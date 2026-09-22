import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { FinancialCategory, PaymentMethod } from '@prisma/client';

export const syncRouter = Router();

// POST /api/sync - idempotent batch sync for offline-queued data
syncRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { attendanceQueue = [], contributionQueue = [] } = req.body;

    const syncedAttendance = [];
    const syncedContributions = [];

    // Process attendance queue
    for (const item of attendanceQueue) {
      const { sessionId, memberId, markedBy, checkInTime } = item;
      if (!sessionId || !memberId) continue;

      try {
        const existing = await prisma.attendanceRecord.findUnique({
          where: {
            sessionId_memberId: { sessionId, memberId }
          }
        });

        if (!existing) {
          const rec = await prisma.attendanceRecord.create({
            data: {
              sessionId,
              memberId,
              markedBy: markedBy || 'Media Desk (Offline Sync)',
              checkInTime: checkInTime ? new Date(checkInTime) : new Date()
            }
          });
          syncedAttendance.push(rec);
        } else {
          syncedAttendance.push(existing);
        }
      } catch (err) {
        console.error('Failed syncing attendance item:', item, err);
      }
    }

    // Process contribution queue
    for (const item of contributionQueue) {
      const { memberId, sessionId, category, amount, paymentMethod, referenceCode, notes, transactionDate } = item;
      if (!amount || isNaN(Number(amount))) continue;

      try {
        const rec = await prisma.financialContribution.create({
          data: {
            memberId: memberId || null,
            sessionId: sessionId || null,
            category: category || FinancialCategory.OFFERING,
            amount: Number(amount),
            paymentMethod: paymentMethod || PaymentMethod.CASH,
            referenceCode: referenceCode || 'OFFLINE-SYNC',
            notes: notes ? `${notes} (Synced from offline)` : 'Synced from offline',
            transactionDate: transactionDate ? new Date(transactionDate) : new Date()
          }
        });
        syncedContributions.push(rec);
      } catch (err) {
        console.error('Failed syncing contribution item:', item, err);
      }
    }

    res.json({
      success: true,
      syncedAttendanceCount: syncedAttendance.length,
      syncedContributionCount: syncedContributions.length,
      message: `Successfully synchronized ${syncedAttendance.length} attendance records and ${syncedContributions.length} contributions.`
    });
  } catch (error: any) {
    console.error('Error during offline batch sync:', error);
    res.status(500).json({ error: 'Failed to process offline sync' });
  }
});
