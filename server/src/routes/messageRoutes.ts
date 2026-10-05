import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { MessageChannel, MessageStatus, ChurchGroup, UserRole } from '@prisma/client';
import { sendVynfySMS } from '../services/vynfyService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const messageRouter = Router();

messageRouter.use(requireAuth);

function interpolateMessage(
  template: string,
  data: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    churchGroup?: ChurchGroup | string;
    cell?: string;
  }
): string {
  const first = data.firstName || (data.fullName ? data.fullName.split(' ')[0] : 'Beloved');
  const last = data.lastName || (data.fullName ? data.fullName.split(' ').slice(1).join(' ') : '');
  const full = data.fullName || (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : 'Beloved');

  const cellLabel = (grp?: ChurchGroup | string) => {
    switch (grp) {
      case 'JOY':
      case ChurchGroup.JOY: return 'Joy Cell';
      case 'FAITH':
      case ChurchGroup.FAITH: return 'Faith Cell';
      case 'HOPE':
      case ChurchGroup.HOPE: return 'Hope Cell';
      case 'LOVE':
      case ChurchGroup.LOVE: return 'Love Cell';
      default: return 'CACI Cell';
    }
  };

  const cell = data.cell || cellLabel(data.churchGroup);

  return template
    .replace(/\{firstName\}|\[firstName\]|\{name\}|\[name\]|\{Name\}|\[Name\]/gi, first)
    .replace(/\{lastName\}|\[lastName\]/gi, last)
    .replace(/\{fullName\}|\[fullName\]/gi, full)
    .replace(/\{group\}|\[group\]|\{cell\}|\[cell\]/gi, cell)
    .replace(/\{churchName\}|\[churchName\]/gi, 'Christ Apostolic Church International (CACI)');
}

// GET /api/messages - message log history (Admin & Media Team)
messageRouter.get('/', requireRole(UserRole.ADMIN, UserRole.MEDIA_TEAM), async (req: Request, res: Response) => {
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

// POST /api/messages/send - send single message (Admin & Media Team)
messageRouter.post('/send', requireRole(UserRole.ADMIN, UserRole.MEDIA_TEAM), async (req: Request, res: Response) => {
  try {
    const { channel, recipientPhone, recipientName, messageContent, category } = req.body;

    if (!recipientPhone || !messageContent) {
      return res.status(400).json({ error: 'Phone number and message content are required' });
    }

    const cleanFirstName = recipientName ? recipientName.split(' ')[0] : 'Beloved';
    const personalizedContent = interpolateMessage(messageContent, {
      fullName: recipientName,
      firstName: cleanFirstName
    });

    let smsResult = null;
    if (channel === 'SMS') {
      smsResult = await sendVynfySMS({
        recipients: [recipientPhone],
        message: personalizedContent
      });
    }

    const log = await prisma.messageLog.create({
      data: {
        channel: channel === 'WHATSAPP' ? MessageChannel.WHATSAPP : MessageChannel.SMS,
        recipientPhone,
        recipientName: recipientName || null,
        messageContent: personalizedContent,
        category: category || 'DIRECT_MESSAGE',
        status: MessageStatus.SENT
      }
    });

    // Clean phone number for direct WhatsApp wa.me link
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(personalizedContent);
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

// POST /api/messages/broadcast - automated batch broadcaster with Vynfy Gateway
messageRouter.post('/broadcast', requireRole(UserRole.ADMIN, UserRole.MEDIA_TEAM), async (req: Request, res: Response) => {
  try {
    const {
      targetType, // 'SPECIFIC_MEMBERS' | 'ALL_MEMBERS' | 'ATTENDEES_TODAY' | 'ABSENTEES_TODAY' | 'JOY' | 'FAITH' | 'HOPE' | 'LOVE' | 'DEPARTMENT'
      memberIds,
      sessionId,
      departmentId,
      channel, // 'SMS' | 'WHATSAPP'
      template,
      customMessage,
      senderId
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
    } else if (targetType === 'JOY' || targetType === 'GROUP_1' || targetType === 'JOY_CELL') {
      recipients = await prisma.member.findMany({
        where: { status: 'ACTIVE', churchGroup: ChurchGroup.JOY, phone: { not: null } }
      });
    } else if (targetType === 'FAITH' || targetType === 'GROUP_2' || targetType === 'FAITH_CELL') {
      recipients = await prisma.member.findMany({
        where: { status: 'ACTIVE', churchGroup: ChurchGroup.FAITH, phone: { not: null } }
      });
    } else if (targetType === 'HOPE' || targetType === 'HOPE_CELL') {
      recipients = await prisma.member.findMany({
        where: { status: 'ACTIVE', churchGroup: ChurchGroup.HOPE, phone: { not: null } }
      });
    } else if (targetType === 'LOVE' || targetType === 'LOVE_CELL') {
      recipients = await prisma.member.findMany({
        where: { status: 'ACTIVE', churchGroup: ChurchGroup.LOVE, phone: { not: null } }
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
    const smsQueue: { phone: string; message: string; name: string }[] = [];

    for (const recipient of recipients) {
      if (!recipient.phone) continue;

      const personalized = interpolateMessage(defaultMsg, {
        firstName: recipient.firstName,
        lastName: recipient.lastName,
        churchGroup: recipient.churchGroup
      });

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
        smsQueue.push({
          phone: recipient.phone,
          message: personalized,
          name: `${recipient.firstName} ${recipient.lastName}`
        });
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
    let gatewayResult: any = null;
    if (channel === 'SMS' && smsQueue.length > 0) {
      const hasPersonalization = /\{firstName\}|\[firstName\]|\{name\}|\[name\]|\{Name\}|\[Name\]|\{lastName\}|\[lastName\]|\{fullName\}|\[fullName\]|\{group\}|\[group\]|\{cell\}|\[cell\]/i.test(defaultMsg);

      if (hasPersonalization && smsQueue.length <= 150) {
        // Individualized personalized SMS dispatch so each recipient gets their exact name
        let successCount = 0;
        let lastGatewayRes: any = null;
        for (const item of smsQueue) {
          try {
            const res = await sendVynfySMS({
              recipients: [item.phone],
              message: item.message,
              senderId: senderId || undefined
            });
            if (res.success) successCount++;
            lastGatewayRes = res;
          } catch (e) {
            console.error(`Failed to send personalized SMS to ${item.phone}:`, e);
          }
        }
        gatewayResult = {
          success: successCount > 0,
          status: successCount > 0 ? 'DELIVERED' : 'FAILED',
          recipientCount: smsQueue.length,
          personalized: true,
          successCount,
          lastResponse: lastGatewayRes
        };
      } else {
        // Bulk batch dispatch
        const allPhones = smsQueue.map(s => s.phone);
        const fallbackMsg = interpolateMessage(defaultMsg, {
          firstName: 'Beloved',
          lastName: '',
          fullName: 'Beloved',
          churchGroup: 'CACI'
        });
        gatewayResult = await sendVynfySMS({
          recipients: allPhones,
          message: fallbackMsg,
          senderId: senderId || undefined
        });
      }
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
