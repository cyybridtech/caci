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
      take: 200
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

// GET /api/finances/summary - summary totals across 4 cells
financeRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const allRecords = await prisma.financialContribution.findMany({
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
