import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { MessageChannel, MessageStatus, ChurchGroup } from '@prisma/client';
import { sendVynfySMS } from '../services/vynfyService.js';

export const messageRouter = Router();

// GET /api/messages - message log history
messageRouter.get('/', async (req: Request, res: Response) => {
  try {
    const logs = await prisma.messageLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (error: any) {
    console.error('Error fetching message logs:', error);
    res.status(500).json({ error: 'Failed to fetch message logs' });
  }
});

// POST /api/messages/send - send single message
messageRouter.post('/send', async (req: Request, res: Response) => {
  try {
    const { channel, recipientPhone, recipientName, messageContent, category } = req.body;

    if (!recipientPhone || !messageContent) {
      return res.status(400).json({ error: 'Phone number and message content are required' });
    }

    let smsResult = null;
    if (channel === 'SMS') {
      smsResult = await sendVynfySMS({
        recipients: [recipientPhone],
        message: messageContent
      });
    }

    const log = await prisma.messageLog.create({
      data: {
        channel: channel === 'WHATSAPP' ? MessageChannel.WHATSAPP : MessageChannel.SMS,
        recipientPhone,
        recipientName: recipientName || null,
        messageContent,
        category: category || 'DIRECT_MESSAGE',
        status: MessageStatus.SENT
      }
    });

    // Clean phone number for direct WhatsApp wa.me link
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(messageContent);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    res.status(201).json({
      success: true,
      log,
      whatsappUrl,
      gateway: smsResult
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to dispatch message' });
  }
});

// POST /api/messages/broadcast - automated batch broadcaster with Vynfy Gateway & Specific Members
messageRouter.post('/broadcast', async (req: Request, res: Response) => {
  try {
    const {
      targetType, // 'SPECIFIC_MEMBERS' | 'ALL_MEMBERS' | 'ATTENDEES_TODAY' | 'ABSENTEES_TODAY' | 'GROUP_1' | 'GROUP_2' | 'DEPARTMENT'
      memberIds, // string[] (for SPECIFIC_MEMBERS)
      sessionId,
      departmentId,
      channel, // 'SMS' | 'WHATSAPP'
      template,
      customMessage
    } = req.body;

    let recipients: { id: string; firstName: string; lastName: string; phone: string | null; churchGroup: ChurchGroup }[] = [];

    if (targetType === 'SPECIFIC_MEMBERS') {
      if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({ error: 'Please select at least one member to receive the message' });
      }
      recipients = await prisma.member.findMany({
        where: { id: { in: memberIds }, phone: { not: null } }
      });
    } else if (targetType === 'ALL_MEMBERS') {
      recipients = await prisma.member.findMany({
        where: { status: 'ACTIVE', phone: { not: null } }
      });
    } else if (targetType === 'ATTENDEES_TODAY') {
      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required for ATTENDEES_TODAY' });
      }
      const records = await prisma.attendanceRecord.findMany({
        where: { sessionId },
        include: {
          member: true
        }
      });
      recipients = records.map(r => r.member).filter(m => !!m.phone);
    } else if (targetType === 'ABSENTEES_TODAY') {
      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required for ABSENTEES_TODAY' });
      }
      const records = await prisma.attendanceRecord.findMany({
        where: { sessionId },
        select: { memberId: true }
      });
      const presentIds = new Set(records.map(r => r.memberId));

      const allActive = await prisma.member.findMany({
        where: { status: 'ACTIVE' }
      });
      recipients = allActive.filter(m => !presentIds.has(m.id) && !!m.phone);
    } else if (targetType === 'GROUP_1') {
      recipients = await prisma.member.findMany({
        where: { status: 'ACTIVE', churchGroup: ChurchGroup.GROUP_1, phone: { not: null } }
      });
    } else if (targetType === 'GROUP_2') {
      recipients = await prisma.member.findMany({
        where: { status: 'ACTIVE', churchGroup: ChurchGroup.GROUP_2, phone: { not: null } }
      });
    } else if (targetType === 'DEPARTMENT') {
      if (!departmentId) {
        return res.status(400).json({ error: 'departmentId is required for DEPARTMENT target' });
      }
      const deptMembers = await prisma.memberDepartment.findMany({
        where: { departmentId },
        include: { member: true }
      });
      recipients = deptMembers.map(dm => dm.member).filter(m => !!m.phone);
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No members with valid phone numbers found for this selection' });
    }

    // Default templates
    let defaultMsg = customMessage;
    if (!defaultMsg) {
      if (targetType === 'ATTENDEES_TODAY') {
        defaultMsg = "Dear {firstName}, thank you for worshipping with us today at CACI! May God's supernatural favor and grace abide with you throughout the week.";
      } else if (targetType === 'ABSENTEES_TODAY') {
        defaultMsg = "Dear {firstName}, we missed your fellowship at CACI today! We pray God keeps you safe and look forward to fellowshipping with you next service.";
      } else {
        defaultMsg = "Calvary greetings {firstName}! Please take note of our upcoming church fellowship and activities at CACI.";
      }
    }

    const logs = [];
    const whatsappLinks: { name: string; phone: string; url: string }[] = [];
    const smsPhones: string[] = [];

    for (const recipient of recipients) {
      if (!recipient.phone) continue;

      const personalized = defaultMsg
        .replace(/{firstName}/g, recipient.firstName)
        .replace(/{lastName}/g, recipient.lastName)
        .replace(/{group}/g, recipient.churchGroup === ChurchGroup.GROUP_1 ? 'Group 1' : 'Group 2');

      const log = await prisma.messageLog.create({
        data: {
          channel: channel === 'WHATSAPP' ? MessageChannel.WHATSAPP : MessageChannel.SMS,
          recipientPhone: recipient.phone,
          recipientName: `${recipient.firstName} ${recipient.lastName}`,
          messageContent: personalized,
          category: targetType,
          status: MessageStatus.SENT
        }
      });
      logs.push(log);

      if (channel === 'SMS') {
        smsPhones.push(recipient.phone);
      } else {
        const cleanPhone = recipient.phone.replace(/[^0-9]/g, '');
        whatsappLinks.push({
          name: `${recipient.firstName} ${recipient.lastName}`,
          phone: recipient.phone,
          url: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalized)}`
        });
      }
    }

    // Dispatch via Vynfy SMS Gateway
    let gatewayResult = null;
    if (channel === 'SMS' && smsPhones.length > 0) {
      gatewayResult = await sendVynfySMS({
        recipients: smsPhones,
        message: defaultMsg.replace(/{firstName}/g, 'Beloved').replace(/{lastName}/g, '').replace(/{group}/g, 'CACI')
      });
    }

    res.json({
      success: true,
      sentCount: logs.length,
      targetType,
      channel: channel || 'SMS',
      gateway: gatewayResult,
      whatsappLinks: channel === 'WHATSAPP' ? whatsappLinks : undefined,
      message: `Successfully dispatched via ${channel === 'SMS' ? 'Vynfy SMS Gateway' : 'WhatsApp'} to ${logs.length} member(s)`
    });
  } catch (error: any) {
    console.error('Error in broadcast message dispatch:', error);
    res.status(500).json({ error: 'Failed to broadcast messages' });
  }
});
