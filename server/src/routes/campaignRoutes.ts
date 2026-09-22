import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import {
  CampaignCategory,
  CampaignStatus,
  PledgeStatus,
  PaymentMethod,
  FinancialCategory,
  MessageChannel,
  MessageStatus
} from '@prisma/client';
import { sendVynfySMS } from '../services/vynfyService.js';

export const campaignRouter = Router();

// GET /api/campaigns - list all campaigns with summary statistics
campaignRouter.get('/', async (req: Request, res: Response) => {
  try {
    const campaigns = await prisma.pledgeCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        pledges: {
          include: {
            member: {
              select: { id: true, firstName: true, lastName: true, phone: true, photoUrl: true, churchGroup: true }
            },
            payments: true
          }
        }
      }
    });

    const enriched = campaigns.map(c => {
      const target = Number(c.targetAmount);
      const totalPledged = c.pledges.reduce((sum, p) => sum + Number(p.pledgedAmount), 0);
      const totalPaid = c.pledges.reduce((sum, p) => sum + Number(p.amountPaid), 0);
      const percentRaised = target > 0 ? Math.min(100, Math.round((totalPaid / target) * 100)) : 0;
      const percentPledged = target > 0 ? Math.round((totalPledged / target) * 100) : 0;

      const fulfilledCount = c.pledges.filter(p => p.status === PledgeStatus.FULFILLED).length;
      const pendingCount = c.pledges.filter(p => p.status === PledgeStatus.PENDING).length;
      const partialCount = c.pledges.filter(p => p.status === PledgeStatus.PARTIALLY_PAID).length;

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        targetAmount: target,
        category: c.category,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        createdAt: c.createdAt,
        totalPledged,
        totalPaid,
        remainingTarget: Math.max(0, target - totalPaid),
        percentRaised,
        percentPledged,
        pledgesCount: c.pledges.length,
        fulfilledCount,
        pendingCount,
        partialCount,
        pledges: c.pledges
      };
    });

    res.json(enriched);
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// POST /api/campaigns - create campaign
campaignRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, targetAmount, category, startDate, endDate } = req.body;

    if (!title || !targetAmount) {
      return res.status(400).json({ error: 'Title and target amount are required' });
    }

    const campaign = await prisma.pledgeCampaign.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        targetAmount: Number(targetAmount),
        category: category || CampaignCategory.BUILDING_PROJECT,
        status: CampaignStatus.ACTIVE,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null
      }
    });

    res.status(201).json(campaign);
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// GET /api/campaigns/:id - campaign details
campaignRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const campaign = await prisma.pledgeCampaign.findUnique({
      where: { id },
      include: {
        pledges: {
          include: {
            member: true,
            payments: {
              orderBy: { transactionDate: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const target = Number(campaign.targetAmount);
    const totalPledged = campaign.pledges.reduce((sum, p) => sum + Number(p.pledgedAmount), 0);
    const totalPaid = campaign.pledges.reduce((sum, p) => sum + Number(p.amountPaid), 0);

    res.json({
      ...campaign,
      targetAmount: target,
      totalPledged,
      totalPaid,
      remainingTarget: Math.max(0, target - totalPaid),
      percentRaised: target > 0 ? Math.round((totalPaid / target) * 100) : 0
    });
  } catch (error: any) {
    console.error('Error fetching campaign details:', error);
    res.status(500).json({ error: 'Failed to fetch campaign details' });
  }
});

// POST /api/campaigns/:id/pledges - add a member pledge
campaignRouter.post('/:id/pledges', async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id as string;
    const { memberId, donorName, donorPhone, pledgedAmount, dueDate, notes } = req.body;

    if (!pledgedAmount || isNaN(Number(pledgedAmount))) {
      return res.status(400).json({ error: 'Valid pledge amount is required' });
    }

    let resolvedDonorName = donorName;
    let resolvedDonorPhone = donorPhone;

    if (memberId) {
      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (member) {
        resolvedDonorName = `${member.firstName} ${member.lastName}`;
        resolvedDonorPhone = member.phone || undefined;
      }
    }

    const pledge = await prisma.memberPledge.create({
      data: {
        campaignId,
        memberId: memberId || null,
        donorName: resolvedDonorName || 'Anonymous Donor',
        donorPhone: resolvedDonorPhone || null,
        pledgedAmount: Number(pledgedAmount),
        amountPaid: 0,
        status: PledgeStatus.PENDING,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes ? notes.trim() : null
      },
      include: {
        member: true,
        payments: true
      }
    });

    res.status(201).json(pledge);
  } catch (error: any) {
    console.error('Error recording pledge:', error);
    res.status(500).json({ error: 'Failed to record pledge' });
  }
});

// POST /api/campaigns/pledges/:pledgeId/payments - record payment towards pledge
campaignRouter.post('/pledges/:pledgeId/payments', async (req: Request, res: Response) => {
  try {
    const pledgeId = req.params.pledgeId as string;
    const { amount, paymentMethod, notes, transactionDate } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }

    const pledge = await prisma.memberPledge.findUnique({
      where: { id: pledgeId },
      include: { campaign: true, member: true }
    });

    if (!pledge) {
      return res.status(404).json({ error: 'Pledge record not found' });
    }

    const paymentAmount = Number(amount);
    const receiptNumber = `CACI-PLG-${Date.now().toString().slice(-6)}`;

    // Create Payment Record
    const payment = await prisma.pledgePayment.create({
      data: {
        pledgeId,
        amount: paymentAmount,
        paymentMethod: paymentMethod || PaymentMethod.CASH,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        receiptNumber,
        notes: notes ? notes.trim() : `Payment for ${pledge.campaign.title}`
      }
    });

    // Update Pledge Amount Paid and Status
    const newAmountPaid = Number(pledge.amountPaid) + paymentAmount;
    const pledgedAmount = Number(pledge.pledgedAmount);
    let newStatus: PledgeStatus = PledgeStatus.PARTIALLY_PAID;
    if (newAmountPaid >= pledgedAmount) {
      newStatus = PledgeStatus.FULFILLED;
    }

    const updatedPledge = await prisma.memberPledge.update({
      where: { id: pledgeId },
      data: {
        amountPaid: newAmountPaid,
        status: newStatus
      },
      include: {
        member: true,
        payments: true
      }
    });

    // Automatically record in General Church Financial Contribution Ledger
    await prisma.financialContribution.create({
      data: {
        memberId: pledge.memberId,
        category: FinancialCategory.BUILDING_PROJECT,
        amount: paymentAmount,
        paymentMethod: paymentMethod || PaymentMethod.CASH,
        notes: `Pledge Payment (${receiptNumber}) for campaign: ${pledge.campaign.title}`,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date()
      }
    });

    res.status(201).json({
      success: true,
      payment,
      updatedPledge,
      receiptNumber
    });
  } catch (error: any) {
    console.error('Error recording pledge payment:', error);
    res.status(500).json({ error: 'Failed to record pledge payment' });
  }
});

// POST /api/campaigns/:id/remind-sms - send gentle Vynfy SMS reminders to unpaid/partial pledgers
campaignRouter.post('/:id/remind-sms', async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id as string;
    const { customMessage, senderId } = req.body;

    const campaign = await prisma.pledgeCampaign.findUnique({
      where: { id: campaignId },
      include: {
        pledges: {
          where: {
            status: { in: [PledgeStatus.PENDING, PledgeStatus.PARTIALLY_PAID] }
          },
          include: { member: true }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const defaultReminder = "Calvary greetings {name}! Thank you for pledging GH₵ {pledged} towards CACI {campaign}. You have currently redeemed GH₵ {paid}, with a remaining balance of GH₵ {balance}. God bless you as you fulfill your pledge!";

    const results = [];

    for (const pledge of campaign.pledges) {
      const phone = pledge.member?.phone || pledge.donorPhone;
      if (!phone) continue;

      const name = pledge.member ? pledge.member.firstName : (pledge.donorName || 'Beloved');
      const pledged = Number(pledge.pledgedAmount).toFixed(2);
      const paid = Number(pledge.amountPaid).toFixed(2);
      const balance = (Number(pledge.pledgedAmount) - Number(pledge.amountPaid)).toFixed(2);

      const personalized = (customMessage || defaultReminder)
        .replace(/{name}/g, name)
        .replace(/{campaign}/g, campaign.title)
        .replace(/{pledged}/g, pledged)
        .replace(/{paid}/g, paid)
        .replace(/{balance}/g, balance);

      // Dispatch via Vynfy Gateway
      const gatewayRes = await sendVynfySMS({
        recipients: [phone],
        message: personalized,
        senderId: senderId || 'CACI '
      });

      // Log in MessageLog
      await prisma.messageLog.create({
        data: {
          channel: MessageChannel.SMS,
          recipientPhone: phone,
          recipientName: pledge.member ? `${pledge.member.firstName} ${pledge.member.lastName}` : pledge.donorName,
          messageContent: personalized,
          category: 'PLEDGE_REMINDER',
          status: gatewayRes.success ? MessageStatus.SENT : MessageStatus.FAILED
        }
      });

      results.push({
        donor: name,
        phone,
        balance,
        success: gatewayRes.success,
        status: gatewayRes.status
      });
    }

    res.json({
      success: true,
      remindedCount: results.length,
      results,
      message: `Dispatched pledge reminders to ${results.length} pledger(s)`
    });
  } catch (error: any) {
    console.error('Error dispatching pledge reminder SMS:', error);
    res.status(500).json({ error: 'Failed to dispatch pledge reminders' });
  }
});
