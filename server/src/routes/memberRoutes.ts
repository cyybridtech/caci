import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { ChurchGroup, Gender, MemberStatus, MaritalStatus, AssimilationStage, UserRole } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const memberRouter = Router();

// Protect all member endpoints
memberRouter.use(requireAuth);

// GET /api/members/:id/attendance-history
memberRouter.get('/:id/attendance-history', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const currentUser = req.user!;

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        departments: {
          include: { department: true }
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Cell leader check
    if (currentUser.role === UserRole.CELL_LEADER && member.churchGroup !== currentUser.cell) {
      return res.status(403).json({ error: 'You can only view members from your assigned cell' });
    }

    const allSessions = await prisma.serviceSession.findMany({
      orderBy: { serviceDate: 'desc' }
    });

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { memberId: id },
      include: { session: true },
      orderBy: { checkInTime: 'desc' }
    });

    const attendedSessionIds = new Set(attendanceRecords.map((r) => r.sessionId));

    const attendedList = attendanceRecords.map((r: any) => ({
      sessionId: r.sessionId,
      serviceDate: r.session.serviceDate,
      serviceType: r.session.serviceType,
      theme: r.session.theme,
      checkInTime: r.checkInTime,
      markedBy: r.markedBy,
      status: 'PRESENT'
    }));

    const missedList = allSessions
      .filter((s) => !attendedSessionIds.has(s.id))
      .map((s) => ({
        sessionId: s.id,
        serviceDate: s.serviceDate,
        serviceType: s.serviceType,
        theme: s.theme,
        status: 'ABSENT'
      }));

    const totalSessions = allSessions.length;
    const attendedCount = attendedList.length;
    const attendanceRate = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0;

    res.json({
      member,
      summary: {
        totalChurchServices: totalSessions,
        servicesAttended: attendedCount,
        servicesMissed: Math.max(0, totalSessions - attendedCount),
        attendancePercentage: attendanceRate
      },
      attendedList,
      missedList
    });
  } catch (error: any) {
    console.error('Error fetching member attendance history:', error);
    res.status(500).json({ error: 'Failed to fetch member attendance records' });
  }
});

// GET /api/members - list members
memberRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, group, status, departmentId, stage } = req.query;
    const currentUser = req.user!;

    const whereClause: any = {};

    // Cell Leader can only see members in their own cell
    if (currentUser.role === UserRole.CELL_LEADER) {
      if (currentUser.cell) {
        whereClause.churchGroup = currentUser.cell as ChurchGroup;
      }
    } else if (group && ['JOY', 'FAITH', 'HOPE', 'LOVE'].includes(group as string)) {
      whereClause.churchGroup = group as ChurchGroup;
    }

    if (status && (status === 'ACTIVE' || status === 'INACTIVE')) {
      whereClause.status = status as MemberStatus;
    }

    if (stage && typeof stage === 'string' && stage !== 'ALL') {
      whereClause.assimilationStage = stage as AssimilationStage;
    }

    if (departmentId && typeof departmentId === 'string' && departmentId !== 'ALL') {
      whereClause.departments = {
        some: { departmentId }
      };
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      whereClause.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
        { hometown: { contains: q } },
        { occupation: { contains: q } },
        { memberCode: { contains: q } }
      ];
    }

    const members = await prisma.member.findMany({
      where: whereClause,
      select: {
        id: true,
        memberCode: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        gender: true,
        maritalStatus: true,
        churchGroup: true,
        role: true,
        status: true,
        dateOfBirth: true,
        weddingAnniversary: true,
        hometown: true,
        address: true,
        occupation: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        isWaterBaptized: true,
        isHolyGhostBaptized: true,
        assimilationStage: true,
        invitedBy: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        departments: {
          select: {
            departmentId: true,
            department: {
              select: { id: true, name: true }
            }
          }
        },
        _count: {
          select: { attendance: true, contributions: true, pledges: true }
        }
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    });

    res.setHeader('Cache-Control', 'private, max-age=10');
    res.json(members);
  } catch (error: any) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

function parseDatePayload(val: any): Date | null | undefined {
  if (val === undefined) return undefined;
  if (val === null || val === '' || val === 'null' || val === 'undefined') return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    }
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// GET /api/members/:id - full member details including contributions and pledges
memberRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const currentUser = req.user!;

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        departments: {
          include: { department: true }
        },
        attendance: {
          include: { session: true },
          orderBy: { checkInTime: 'desc' },
          take: 30
        },
        contributions: {
          include: { session: true },
          orderBy: { transactionDate: 'desc' },
          take: 50
        },
        pledges: {
          include: {
            campaign: true,
            payments: {
              orderBy: { transactionDate: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Cell leader restriction
    if (currentUser.role === UserRole.CELL_LEADER && member.churchGroup !== currentUser.cell) {
      return res.status(403).json({ error: 'You can only view members from your assigned cell' });
    }

    // Cell leaders and Media Team cannot see member finances (pledges, tithes, welfare, offerings)
    if (currentUser.role === UserRole.CELL_LEADER || currentUser.role === UserRole.MEDIA_TEAM) {
      (member as any).contributions = [];
      (member as any).pledges = [];
    }

    res.json(member);
  } catch (error: any) {
    console.error('Error fetching member:', error);
    res.status(500).json({ error: 'Failed to fetch member details' });
  }
});

// POST /api/members - create member (Admin, Cell Leader)
memberRouter.post('/', async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;

    if (currentUser.role === UserRole.FINANCE) {
      return res.status(403).json({ error: 'Finance role is not authorized to create members' });
    }

    const {
      firstName,
      lastName,
      photoUrl,
      phone,
      email,
      gender,
      maritalStatus,
      churchGroup,
      role,
      status,
      dateOfBirth,
      weddingAnniversary,
      hometown,
      address,
      occupation,
      emergencyContactName,
      emergencyContactPhone,
      isWaterBaptized,
      isHolyGhostBaptized,
      assimilationStage,
      invitedBy,
      notes,
      departmentIds
    } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    // Cell leader forces member into their own cell
    let targetCell: ChurchGroup = ChurchGroup.JOY;
    if (currentUser.role === UserRole.CELL_LEADER) {
      targetCell = (currentUser.cell as ChurchGroup) || ChurchGroup.JOY;
    } else if (churchGroup && ['JOY', 'FAITH', 'HOPE', 'LOVE'].includes(churchGroup)) {
      targetCell = churchGroup as ChurchGroup;
    }

    // Use the highest existing code to prevent P2002 duplicate collisions
    const lastMember = await prisma.member.findFirst({
      where: { memberCode: { startsWith: 'CACI-' } },
      orderBy: { memberCode: 'desc' },
      select: { memberCode: true },
    });
    const lastNumber = lastMember?.memberCode
      ? parseInt(lastMember.memberCode.replace('CACI-', ''), 10)
      : 0;
    const memberCode = `CACI-${String((isNaN(lastNumber) ? 0 : lastNumber) + 1).padStart(3, '0')}`;

    const newMember = await prisma.member.create({
      data: {
        memberCode,
        photoUrl: photoUrl || null,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        gender: (gender as Gender) || Gender.MALE,
        maritalStatus: (maritalStatus as MaritalStatus) || MaritalStatus.SINGLE,
        churchGroup: targetCell,
        role: role || 'Member',
        status: status === 'INACTIVE' ? MemberStatus.INACTIVE : MemberStatus.ACTIVE,
        dateOfBirth: parseDatePayload(dateOfBirth) || null,
        weddingAnniversary: parseDatePayload(weddingAnniversary) || null,
        hometown: hometown ? hometown.trim() : null,
        address: address ? address.trim() : null,
        occupation: occupation ? occupation.trim() : null,
        emergencyContactName: emergencyContactName ? emergencyContactName.trim() : null,
        emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.trim() : null,
        isWaterBaptized: Boolean(isWaterBaptized),
        isHolyGhostBaptized: Boolean(isHolyGhostBaptized),
        assimilationStage: (assimilationStage as AssimilationStage) || AssimilationStage.REGULAR_MEMBER,
        invitedBy: invitedBy ? invitedBy.trim() : null,
        notes: notes ? notes.trim() : null,
        departments: departmentIds && Array.isArray(departmentIds) ? {
          create: departmentIds.map((deptId: string) => ({
            department: { connect: { id: deptId } }
          }))
        } : undefined
      },
      include: {
        departments: {
          select: {
            departmentId: true,
            department: {
              select: { id: true, name: true }
            }
          }
        },
        _count: {
          select: { attendance: true, contributions: true, pledges: true }
        }
      }
    });

    res.status(201).json(newMember);
  } catch (error: any) {
    console.error('Error creating member:', error);
    res.status(500).json({
      error: 'Failed to create member',
      message: error.message,
      code: error.code,
    });
  }
});

// PUT /api/members/:id - update member
memberRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const currentUser = req.user!;

    if (currentUser.role === UserRole.FINANCE) {
      return res.status(403).json({ error: 'Not authorized to update members' });
    }

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (currentUser.role === UserRole.CELL_LEADER && existing.churchGroup !== currentUser.cell) {
      return res.status(403).json({ error: 'You can only edit members within your assigned cell' });
    }

    const {
      firstName,
      lastName,
      photoUrl,
      phone,
      email,
      gender,
      maritalStatus,
      churchGroup,
      role,
      status,
      dateOfBirth,
      weddingAnniversary,
      hometown,
      address,
      occupation,
      emergencyContactName,
      emergencyContactPhone,
      isWaterBaptized,
      isHolyGhostBaptized,
      assimilationStage,
      invitedBy,
      notes
    } = req.body;

    let targetCell = undefined;
    if ((currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MEDIA_TEAM || currentUser.role === UserRole.DEVELOPER) && churchGroup && ['JOY', 'FAITH', 'HOPE', 'LOVE'].includes(churchGroup)) {
      targetCell = churchGroup as ChurchGroup;
    }

    const updated = await prisma.member.update({
      where: { id },
      data: {
        firstName: firstName ? firstName.trim() : undefined,
        lastName: lastName ? lastName.trim() : undefined,
        photoUrl: photoUrl !== undefined ? photoUrl : undefined,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
        email: email !== undefined ? (email ? email.trim() : null) : undefined,
        gender: gender || undefined,
        maritalStatus: maritalStatus || undefined,
        churchGroup: targetCell,
        role: role || undefined,
        status: status ? (status === 'INACTIVE' ? MemberStatus.INACTIVE : MemberStatus.ACTIVE) : undefined,
        dateOfBirth: parseDatePayload(dateOfBirth),
        weddingAnniversary: parseDatePayload(weddingAnniversary),
        hometown: hometown !== undefined ? (hometown ? hometown.trim() : null) : undefined,
        address: address !== undefined ? (address ? address.trim() : null) : undefined,
        occupation: occupation !== undefined ? (occupation ? occupation.trim() : null) : undefined,
        emergencyContactName: emergencyContactName !== undefined ? (emergencyContactName ? emergencyContactName.trim() : null) : undefined,
        emergencyContactPhone: emergencyContactPhone !== undefined ? (emergencyContactPhone ? emergencyContactPhone.trim() : null) : undefined,
        isWaterBaptized: isWaterBaptized !== undefined ? Boolean(isWaterBaptized) : undefined,
        isHolyGhostBaptized: isHolyGhostBaptized !== undefined ? Boolean(isHolyGhostBaptized) : undefined,
        assimilationStage: assimilationStage || undefined,
        invitedBy: invitedBy !== undefined ? (invitedBy ? invitedBy.trim() : null) : undefined,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : undefined
      },
      include: {
        departments: {
          select: {
            departmentId: true,
            department: {
              select: { id: true, name: true }
            }
          }
        },
        _count: {
          select: { attendance: true, contributions: true, pledges: true }
        }
      }
    });

    const { departmentIds } = req.body;
    if (departmentIds && Array.isArray(departmentIds)) {
      await prisma.memberDepartment.deleteMany({
        where: { memberId: id }
      });
      if (departmentIds.length > 0) {
        await prisma.memberDepartment.createMany({
          data: departmentIds.map((deptId: string) => ({
            memberId: id,
            departmentId: deptId
          }))
        });
      }
    }

    const finalUpdated = await prisma.member.findUnique({
      where: { id },
      include: {
        departments: {
          select: {
            departmentId: true,
            department: {
              select: { id: true, name: true }
            }
          }
        },
        _count: {
          select: { attendance: true, contributions: true, pledges: true }
        }
      }
    });

    res.json(finalUpdated || updated);
  } catch (error: any) {
    console.error('Error updating member:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// PATCH /api/members/:id/assimilation - update stage
memberRouter.patch('/:id/assimilation', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { assimilationStage, churchGroup } = req.body;
    const currentUser = req.user!;

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Member not found' });

    // Cell leaders can only operate on members of their own cell,
    // OR on unassigned visitors they are advancing into their cell
    if (
      currentUser.role === UserRole.CELL_LEADER &&
      existing.churchGroup !== null &&
      existing.churchGroup !== currentUser.cell
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Determine the new church group
    const validCells = ['JOY', 'FAITH', 'HOPE', 'LOVE'];
    let newChurchGroup: ChurchGroup | undefined = undefined;

    if (churchGroup && validCells.includes(churchGroup)) {
      if (
        currentUser.role === UserRole.ADMIN ||
        currentUser.role === UserRole.DEVELOPER ||
        // Cell leaders may assign to their own cell only
        (currentUser.role === UserRole.CELL_LEADER && churchGroup === currentUser.cell)
      ) {
        newChurchGroup = churchGroup as ChurchGroup;
      }
    }

    // When fully integrated, auto-promote role from First-Timer → Member
    const isIntegrated = assimilationStage === 'ASSIGNED_GROUP';
    const rolePromotion = isIntegrated && existing.role === 'First-Timer' ? 'Member' : undefined;

    await prisma.member.update({
      where: { id },
      data: {
        assimilationStage: assimilationStage || undefined,
        churchGroup: newChurchGroup,
        ...(rolePromotion ? { role: rolePromotion } : {}),
      }
    });

    // Return full member with departments and counts so UI card doesn't lose data
    const fullMember = await prisma.member.findUnique({
      where: { id },
      include: {
        departments: {
          include: {
            department: {
              select: { id: true, name: true }
            }
          }
        },
        _count: {
          select: { attendance: true, contributions: true, pledges: true }
        }
      }
    });

    res.json(fullMember);
  } catch (error: any) {
    console.error('Error updating assimilation:', error);
    res.status(500).json({ error: 'Failed to update assimilation stage' });
  }
});


// DELETE /api/members/:id
memberRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const currentUser = req.user!;

    if (currentUser.role === UserRole.FINANCE) {
      return res.status(403).json({ error: 'Unauthorized to delete members' });
    }

    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (currentUser.role === UserRole.CELL_LEADER && member.churchGroup !== currentUser.cell) {
      return res.status(403).json({ error: 'You can only delete members in your assigned cell' });
    }

    // Safely delete all dependent records in transaction to prevent TiDB foreign key constraint failures
    await prisma.$transaction([
      prisma.memberDepartment.deleteMany({ where: { memberId: id } }),
      prisma.attendanceRecord.deleteMany({ where: { memberId: id } }),
      prisma.celebrationLog.deleteMany({ where: { memberId: id } }),
      prisma.financialContribution.deleteMany({ where: { memberId: id } }),
      prisma.memberPledge.deleteMany({ where: { memberId: id } }),
      prisma.member.delete({ where: { id } })
    ]);

    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting member:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});
