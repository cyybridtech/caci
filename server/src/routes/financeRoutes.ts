import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { FinancialCategory, PaymentMethod, ChurchGroup, UserRole } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const financeRouter = Router();

financeRouter.use(requireAuth);

// GET /api/finances - list all contributions
financeRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { category, sessionId, memberId, startDate, endDate } = req.query;

    const whereClause: any = {};

    if (category && Object.values(FinancialCategory).includes(category as FinancialCategory)) {
      whereClause.category = category as FinancialCategory;
    }

    if (sessionId && typeof sessionId === 'string') {
      whereClause.sessionId = sessionId;
    }

    if (memberId && typeof memberId === 'string') {
      whereClause.memberId = memberId;
    }

    if (startDate || endDate) {
      whereClause.transactionDate = {};
      if (startDate) whereClause.transactionDate.gte = new Date(startDate as string);
      if (endDate) whereClause.transactionDate.lte = new Date(endDate as string);
    }

    const records = await prisma.financialContribution.findMany({
      where: whereClause,
      include: {
        member: {
          select: {
            id: true,
            photoUrl: true,
            firstName: true,
            lastName: true,
            phone: true,
            churchGroup: true
          }
        },
        session: {
          select: {
            id: true,
            serviceDate: true,
            serviceType: true
          }
        }
      },
      orderBy: { transactionDate: 'desc' },
      take: 1000
    });

    res.json(records);
  } catch (error: any) {
    console.error('Error fetching financial records:', error);
    res.status(500).json({ error: 'Failed to fetch financial records' });
  }
});

// POST /api/finances - record contribution (Admin & Finance team)
financeRouter.post('/', requireRole(UserRole.ADMIN, UserRole.FINANCE), async (req: Request, res: Response) => {
  try {
    const {
      memberId,
      sessionId,
      category,
      amount,
      paymentMethod,
      transactionDate,
      notes
    } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid contribution amount is required' });
    }

    const record = await prisma.financialContribution.create({
      data: {
        memberId: memberId || null,
        sessionId: sessionId || null,
        category: category || FinancialCategory.OFFERING,
        amount: Number(amount),
        paymentMethod: paymentMethod || PaymentMethod.CASH,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        notes: notes || null
      },
      include: {
        member: {
          select: {
            id: true,
            photoUrl: true,
            firstName: true,
            lastName: true,
            phone: true,
            churchGroup: true
          }
        },
        session: true
      }
    });

    res.status(201).json(record);
  } catch (error: any) {
    console.error('Error recording contribution:', error);
    res.status(500).json({ error: 'Failed to record contribution' });
  }
});

// GET /api/finances/summary - summary totals across 4 cells (supports optional startDate/endDate query params)
financeRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause: any = {};
    if (startDate || endDate) {
      whereClause.transactionDate = {};
      if (startDate) whereClause.transactionDate.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        whereClause.transactionDate.lte = end;
      }
    }

    const allRecords = await prisma.financialContribution.findMany({
      where: whereClause,
      include: {
        member: {
          select: { churchGroup: true }
        }
      }
    });

    let totalAmount = 0;
    const categoryTotals: Record<string, number> = {
      TITHE: 0,
      OFFERING: 0,
      WELFARE: 0,
      THANKSGIVING: 0,
      BUILDING_PROJECT: 0,
      SPECIAL_SEED: 0
    };

    let joyAmount = 0;
    let faithAmount = 0;
    let hopeAmount = 0;
    let loveAmount = 0;
    let unassignedAmount = 0;

    for (const r of allRecords) {
      const amt = Number(r.amount);
      totalAmount += amt;

      if (categoryTotals[r.category] !== undefined) {
        categoryTotals[r.category] += amt;
      } else {
        categoryTotals[r.category] = amt;
      }

      if (r.member) {
        if (r.member.churchGroup === ChurchGroup.JOY) joyAmount += amt;
        else if (r.member.churchGroup === ChurchGroup.FAITH) faithAmount += amt;
        else if (r.member.churchGroup === ChurchGroup.HOPE) hopeAmount += amt;
        else if (r.member.churchGroup === ChurchGroup.LOVE) loveAmount += amt;
        else unassignedAmount += amt;
      } else {
        unassignedAmount += amt;
      }
    }

    res.json({
      totalAmount,
      categoryTotals,
      cellComparison: {
        JOY: joyAmount,
        FAITH: faithAmount,
        HOPE: hopeAmount,
        LOVE: loveAmount,
        generalOfferings: unassignedAmount
      },
      groupComparison: {
        group1: joyAmount,
        group2: faithAmount,
        generalOfferings: unassignedAmount
      },
      recordCount: allRecords.length
    });
  } catch (error: any) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ error: 'Failed to fetch financial summary' });
  }
});

// GET /api/finances/services-audit - comprehensive audit of all church services and their finances
financeRouter.get('/services-audit', async (req: Request, res: Response) => {
  try {
    const { search, limit = '60' } = req.query;

    const whereClause: any = {};
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      whereClause.OR = [
        { serviceType: { contains: q } },
        { theme: { contains: q } },
        { notes: { contains: q } }
      ];
    }

    const sessions = await prisma.serviceSession.findMany({
      where: whereClause,
      orderBy: { serviceDate: 'desc' },
      take: Math.min(Number(limit) || 60, 100),
      include: {
        _count: {
          select: { attendance: true, contributions: true }
        },
        attendance: {
          select: { id: true, memberId: true }
        },
        contributions: {
          include: {
            member: {
              select: {
                id: true,
                photoUrl: true,
                firstName: true,
                lastName: true,
                phone: true,
                memberCode: true,
                churchGroup: true
              }
            }
          },
          orderBy: { amount: 'desc' }
        }
      }
    });

    let cumulativeGainedAllServices = 0;
    let highestSingleServiceGained = 0;
    let highestGainedSessionTitle = '';

    const auditedServices = sessions.map((s) => {
      let serviceTotalGained = 0;
      const categoryTotals: Record<string, number> = {
        TITHE: 0,
        OFFERING: 0,
        WELFARE: 0,
        THANKSGIVING: 0,
        BUILDING_PROJECT: 0,
        SPECIAL_SEED: 0
      };

      const cellTotals: Record<string, number> = {
        JOY: 0,
        FAITH: 0,
        HOPE: 0,
        LOVE: 0,
        GENERAL: 0
      };

      const paymentMethodTotals: Record<string, number> = {
        CASH: 0,
        MOBILE_MONEY: 0,
        BANK_TRANSFER: 0,
        CHEQUE: 0
      };

      for (const c of s.contributions) {
        const amt = Number(c.amount) || 0;
        serviceTotalGained += amt;

        // Category breakdown
        if (categoryTotals[c.category] !== undefined) {
          categoryTotals[c.category] += amt;
        } else {
          categoryTotals[c.category] = amt;
        }

        // Cell breakdown
        if (c.member && c.member.churchGroup) {
          cellTotals[c.member.churchGroup] = (cellTotals[c.member.churchGroup] || 0) + amt;
        } else {
          cellTotals.GENERAL = (cellTotals.GENERAL || 0) + amt;
        }

        // Payment method breakdown
        if (paymentMethodTotals[c.paymentMethod] !== undefined) {
          paymentMethodTotals[c.paymentMethod] += amt;
        } else {
          paymentMethodTotals[c.paymentMethod] = amt;
        }
      }

      cumulativeGainedAllServices += serviceTotalGained;
      if (serviceTotalGained > highestSingleServiceGained) {
        highestSingleServiceGained = serviceTotalGained;
        highestGainedSessionTitle = `${s.serviceType} (${new Date(s.serviceDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`;
      }

      const attendanceCount = s._count.attendance;
      const averageGivingPerAttendee = attendanceCount > 0
        ? Math.round((serviceTotalGained / attendanceCount) * 100) / 100
        : 0;

      return {
        session: {
          id: s.id,
          serviceDate: s.serviceDate,
          serviceType: s.serviceType,
          theme: s.theme,
          notes: s.notes,
          createdAt: s.createdAt
        },
        attendanceCount,
        contributionCount: s.contributions.length,
        totalGained: serviceTotalGained,
        averageGivingPerAttendee,
        categoryTotals,
        cellTotals,
        paymentMethodTotals,
        contributions: s.contributions
      };
    });

    const averageGainedPerService = auditedServices.length > 0
      ? Math.round((cumulativeGainedAllServices / auditedServices.length) * 100) / 100
      : 0;

    res.json({
      summary: {
        totalServicesAudited: auditedServices.length,
        cumulativeGainedAllServices,
        averageGainedPerService,
        highestSingleServiceGained,
        highestGainedSessionTitle: highestGainedSessionTitle || 'N/A'
      },
      services: auditedServices
    });
  } catch (error: any) {
    console.error('Error fetching services financial audit:', error);
    res.status(500).json({ error: 'Failed to fetch services financial audit' });
  }
});

// GET /api/finances/member/:memberId - giving statement for member
financeRouter.get('/member/:memberId', async (req: Request, res: Response) => {
  try {
    const memberId = req.params.memberId as string;

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        photoUrl: true,
        firstName: true,
        lastName: true,
        phone: true,
        churchGroup: true
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const contributions = await prisma.financialContribution.findMany({
      where: { memberId },
      include: { session: true },
      orderBy: { transactionDate: 'desc' }
    });

    const totalGiven = contributions.reduce((sum, item) => sum + Number(item.amount), 0);

    res.json({
      member,
      totalGiven,
      contributions
    });
  } catch (error: any) {
    console.error('Error fetching member giving statement:', error);
    res.status(500).json({ error: 'Failed to fetch member giving statement' });
  }
});

// PUT /api/finances/:id - edit a contribution (Admin & Finance)
financeRouter.put('/:id', requireRole(UserRole.ADMIN, UserRole.FINANCE), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { memberId, sessionId, category, amount, paymentMethod, transactionDate, notes } = req.body;

    const existing = await prisma.financialContribution.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Contribution not found' });

    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const updated = await prisma.financialContribution.update({
      where: { id },
      data: {
        memberId: memberId !== undefined ? (memberId || null) : existing.memberId,
        sessionId: sessionId !== undefined ? (sessionId || null) : existing.sessionId,
        category: (category as FinancialCategory) ?? existing.category,
        amount: amount !== undefined ? Number(amount) : existing.amount,
        paymentMethod: (paymentMethod as PaymentMethod) ?? existing.paymentMethod,
        transactionDate: transactionDate ? new Date(transactionDate) : existing.transactionDate,
        notes: notes !== undefined ? (notes?.trim() || null) : existing.notes
      },
      include: {
        member: {
          select: { id: true, photoUrl: true, firstName: true, lastName: true, phone: true, churchGroup: true }
        },
        session: { select: { id: true, serviceDate: true, serviceType: true } }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating contribution:', error);
    res.status(500).json({ error: 'Failed to update contribution' });
  }
});

// DELETE /api/finances/:id - delete a contribution (Admin & Finance)
financeRouter.delete('/:id', requireRole(UserRole.ADMIN, UserRole.FINANCE), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.financialContribution.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Contribution not found' });

    await prisma.financialContribution.delete({ where: { id } });
    res.json({ success: true, message: 'Contribution deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting contribution:', error);
    res.status(500).json({ error: 'Failed to delete contribution' });
  }
});
