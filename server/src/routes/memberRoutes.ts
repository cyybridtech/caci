import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { ChurchGroup, Gender, MemberStatus, MaritalStatus, AssimilationStage } from '@prisma/client';

export const memberRouter = Router();

// GET /api/members/:id/attendance-history
memberRouter.get('/:id/attendance-history', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

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

// GET /api/members - list all members
memberRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, group, status } = req.query;

    const whereClause: any = {};

    if (group && (group === 'GROUP_1' || group === 'GROUP_2')) {
      whereClause.churchGroup = group as ChurchGroup;
    }

    if (status && (status === 'ACTIVE' || status === 'INACTIVE')) {
      whereClause.status = status as MemberStatus;
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
      include: {
        _count: {
          select: {
            attendance: true,
            contributions: true
          }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    res.json(members);
  } catch (error: any) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// GET /api/members/:id - member details
memberRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        departments: {
          include: { department: true }
        },
        attendance: {
          include: { session: true },
          orderBy: { checkInTime: 'desc' },
          take: 20
        },
        contributions: {
          orderBy: { transactionDate: 'desc' },
          take: 20
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(member);
  } catch (error: any) {
    console.error('Error fetching member:', error);
    res.status(500).json({ error: 'Failed to fetch member details' });
  }
});

// POST /api/members - create member
memberRouter.post('/', async (req: Request, res: Response) => {
  try {
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
      hometown,
      address,
      occupation,
      emergencyContactName,
      emergencyContactPhone,
      isWaterBaptized,
      isHolyGhostBaptized,
      notes
    } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    const count = await prisma.member.count();
    const memberCode = `CACI-${String(count + 1).padStart(3, '0')}`;

    const newMember = await prisma.member.create({
      data: {
        memberCode,
        photoUrl: photoUrl || null,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        gender: gender || Gender.MALE,
        maritalStatus: maritalStatus || MaritalStatus.SINGLE,
        churchGroup: churchGroup === 'GROUP_2' ? ChurchGroup.GROUP_2 : ChurchGroup.GROUP_1,
        role: role || 'Member',
        status: status === 'INACTIVE' ? MemberStatus.INACTIVE : MemberStatus.ACTIVE,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        hometown: hometown ? hometown.trim() : null,
        address: address ? address.trim() : null,
        occupation: occupation ? occupation.trim() : null,
        emergencyContactName: emergencyContactName ? emergencyContactName.trim() : null,
        emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.trim() : null,
        isWaterBaptized: Boolean(isWaterBaptized),
        isHolyGhostBaptized: Boolean(isHolyGhostBaptized),
        notes: notes ? notes.trim() : null
      }
    });

    res.status(201).json(newMember);
  } catch (error: any) {
    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// PUT /api/members/:id - update member
memberRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
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
      hometown,
      address,
      occupation,
      emergencyContactName,
      emergencyContactPhone,
      isWaterBaptized,
      isHolyGhostBaptized,
      notes
    } = req.body;

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
        churchGroup: churchGroup ? (churchGroup === 'GROUP_2' ? ChurchGroup.GROUP_2 : ChurchGroup.GROUP_1) : undefined,
        role: role || undefined,
        status: status ? (status === 'INACTIVE' ? MemberStatus.INACTIVE : MemberStatus.ACTIVE) : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        hometown: hometown !== undefined ? (hometown ? hometown.trim() : null) : undefined,
        address: address !== undefined ? (address ? address.trim() : null) : undefined,
        occupation: occupation !== undefined ? (occupation ? occupation.trim() : null) : undefined,
        emergencyContactName: emergencyContactName !== undefined ? (emergencyContactName ? emergencyContactName.trim() : null) : undefined,
        emergencyContactPhone: emergencyContactPhone !== undefined ? (emergencyContactPhone ? emergencyContactPhone.trim() : null) : undefined,
        isWaterBaptized: isWaterBaptized !== undefined ? Boolean(isWaterBaptized) : undefined,
        isHolyGhostBaptized: isHolyGhostBaptized !== undefined ? Boolean(isHolyGhostBaptized) : undefined,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : undefined
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating member:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// DELETE /api/members/:id
memberRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.member.delete({ where: { id } });
    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting member:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});
