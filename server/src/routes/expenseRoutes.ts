import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { ExpenseCategory, PaymentMethod, UserRole } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const expenseRouter = Router();

expenseRouter.use(requireAuth);

// GET /api/expenses - list all church expenses
expenseRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { category, startDate, endDate } = req.query;

    const where: any = {};
    if (category && Object.values(ExpenseCategory).includes(category as ExpenseCategory)) {
      where.category = category as ExpenseCategory;
    }
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate as string);
      if (endDate) where.expenseDate.lte = new Date(endDate as string);
    }

    const expenses = await prisma.churchExpense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
      take: 200
    });

    res.json(expenses);
  } catch (err: any) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET /api/expenses/summary - total expenses
expenseRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const all = await prisma.churchExpense.findMany();
    const total = all.reduce((s, e) => s + Number(e.amount), 0);

    const byCategory: Record<string, number> = {};
    for (const e of all) {
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
    }

    res.json({ total, byCategory, count: all.length });
  } catch (err: any) {
    console.error('Error fetching expense summary:', err);
    res.status(500).json({ error: 'Failed to fetch expense summary' });
  }
});

// POST /api/expenses - record a new expense (Admin + Finance)
expenseRouter.post('/', requireRole(UserRole.ADMIN, UserRole.FINANCE), async (req: Request, res: Response) => {
  try {
    const { title, category, amount, paymentMethod, expenseDate, vendorName, authorizedBy, receiptNumber, description } = req.body;

    if (!title || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Title and valid amount are required' });
    }

    const expense = await prisma.churchExpense.create({
      data: {
        title: title.trim(),
        category: (category as ExpenseCategory) || ExpenseCategory.OTHER,
        amount: Number(amount),
        paymentMethod: (paymentMethod as PaymentMethod) || PaymentMethod.CASH,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        vendorName: vendorName?.trim() || null,
        authorizedBy: authorizedBy?.trim() || null,
        receiptNumber: receiptNumber?.trim() || null,
        description: description?.trim() || null
      }
    });

    res.status(201).json(expense);
  } catch (err: any) {
    console.error('Error recording expense:', err);
    res.status(500).json({ error: 'Failed to record expense' });
  }
});

// PUT /api/expenses/:id - update an expense (Admin + Finance)
expenseRouter.put('/:id', requireRole(UserRole.ADMIN, UserRole.FINANCE), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, category, amount, paymentMethod, expenseDate, vendorName, authorizedBy, receiptNumber, description } = req.body;

    const existing = await prisma.churchExpense.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const updated = await prisma.churchExpense.update({
      where: { id },
      data: {
        title: title?.trim() ?? existing.title,
        category: (category as ExpenseCategory) ?? existing.category,
        amount: amount !== undefined ? Number(amount) : existing.amount,
        paymentMethod: (paymentMethod as PaymentMethod) ?? existing.paymentMethod,
        expenseDate: expenseDate ? new Date(expenseDate) : existing.expenseDate,
        vendorName: vendorName !== undefined ? (vendorName?.trim() || null) : existing.vendorName,
        authorizedBy: authorizedBy !== undefined ? (authorizedBy?.trim() || null) : existing.authorizedBy,
        receiptNumber: receiptNumber !== undefined ? (receiptNumber?.trim() || null) : existing.receiptNumber,
        description: description !== undefined ? (description?.trim() || null) : existing.description
      }
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Error updating expense:', err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id - delete an expense (Admin + Finance)
expenseRouter.delete('/:id', requireRole(UserRole.ADMIN, UserRole.FINANCE), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.churchExpense.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    await prisma.churchExpense.delete({ where: { id } });
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});
