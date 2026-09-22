import { Router, Request, Response } from 'express';
import {
  getCelebrantsForDate,
  getUpcomingCelebrants,
  dispatchCelebrationBlessings
} from '../services/celebrationService.js';

export const celebrationRouter = Router();

// GET /api/celebrations/today - list today's celebrants
celebrationRouter.get('/today', async (req: Request, res: Response) => {
  try {
    const celebrants = await getCelebrantsForDate();
    res.json(celebrants);
  } catch (error: any) {
    console.error('Error fetching today celebrants:', error);
    res.status(500).json({ error: 'Failed to fetch today celebrants' });
  }
});

// GET /api/celebrations/upcoming - list upcoming celebrants for next 7 days
celebrationRouter.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const days = Number(req.query.days) || 7;
    const upcoming = await getUpcomingCelebrants(days);
    res.json(upcoming);
  } catch (error: any) {
    console.error('Error fetching upcoming celebrants:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming celebrants' });
  }
});

// POST /api/celebrations/dispatch - manual or automated dispatch
celebrationRouter.post('/dispatch', async (req: Request, res: Response) => {
  try {
    const {
      memberIds,
      customBirthdayTemplate,
      customAnniversaryTemplate,
      senderId
    } = req.body;

    const result = await dispatchCelebrationBlessings({
      memberIds,
      customBirthdayTemplate,
      customAnniversaryTemplate,
      senderId
    });

    res.json({
      success: true,
      message: `Dispatched celebration blessings to ${result.dispatchedCount} celebrant(s)`,
      result
    });
  } catch (error: any) {
    console.error('Error dispatching celebration blessings:', error);
    res.status(500).json({ error: 'Failed to dispatch celebration blessings' });
  }
});
