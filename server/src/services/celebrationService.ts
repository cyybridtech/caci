import { prisma } from '../db.js';
import { sendVynfySMS, formatGhanaPhoneNumber } from './vynfyService.js';
import { CelebrationType, MessageStatus, MessageChannel } from '@prisma/client';

export interface Celebrant {
  memberId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  photoUrl: string | null;
  churchGroup: string;
  celebrationType: CelebrationType;
  date: Date;
  ageOrYears: number | null;
  alreadyDispatched: boolean;
}

/**
 * Find all active church members who have a birthday or wedding anniversary today.
 */
export async function getCelebrantsForDate(targetDate = new Date()): Promise<Celebrant[]> {
  const targetMonth = targetDate.getMonth(); // 0-indexed
  const targetDay = targetDate.getDate();
  const dateKey = `${targetDate.getFullYear()}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;

  const members = await prisma.member.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      photoUrl: true,
      churchGroup: true,
      dateOfBirth: true,
      weddingAnniversary: true,
      maritalStatus: true
    }
  });

  const celebrationLogs = await prisma.celebrationLog.findMany({
    where: { eventDate: dateKey }
  });

  const dispatchedKeys = new Set(
    celebrationLogs.map(log => `${log.memberId}_${log.celebrationType}`)
  );

  const celebrants: Celebrant[] = [];

  for (const m of members) {
    // 1. Birthday Check
    if (m.dateOfBirth) {
      const dob = new Date(m.dateOfBirth);
      if (dob.getMonth() === targetMonth && dob.getDate() === targetDay) {
        const age = targetDate.getFullYear() - dob.getFullYear();
        celebrants.push({
          memberId: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          phone: m.phone,
          photoUrl: m.photoUrl,
          churchGroup: m.churchGroup,
          celebrationType: CelebrationType.BIRTHDAY,
          date: dob,
          ageOrYears: age > 0 ? age : null,
          alreadyDispatched: dispatchedKeys.has(`${m.id}_${CelebrationType.BIRTHDAY}`)
        });
      }
    }

    // 2. Wedding Anniversary Check
    if (m.weddingAnniversary) {
      const anniv = new Date(m.weddingAnniversary);
      if (anniv.getMonth() === targetMonth && anniv.getDate() === targetDay) {
        const years = targetDate.getFullYear() - anniv.getFullYear();
        celebrants.push({
          memberId: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          phone: m.phone,
          photoUrl: m.photoUrl,
          churchGroup: m.churchGroup,
          celebrationType: CelebrationType.ANNIVERSARY,
          date: anniv,
          ageOrYears: years > 0 ? years : null,
          alreadyDispatched: dispatchedKeys.has(`${m.id}_${CelebrationType.ANNIVERSARY}`)
        });
      }
    }
  }

  return celebrants;
}

/**
 * Find upcoming celebrants for the next N days (default: 7 days)
 */
export async function getUpcomingCelebrants(daysAhead = 7): Promise<Celebrant[]> {
  const results: Celebrant[] = [];
  const today = new Date();

  for (let i = 1; i <= daysAhead; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    const dayCelebrants = await getCelebrantsForDate(nextDate);
    results.push(...dayCelebrants);
  }

  return results;
}

/**
 * Dispatch automated SMS blessings to celebrants via Vynfy Gateway
 */
export async function dispatchCelebrationBlessings(options: {
  memberIds?: string[];
  customBirthdayTemplate?: string;
  customAnniversaryTemplate?: string;
  senderId?: string;
}) {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const celebrants = await getCelebrantsForDate(today);
  const toDispatch = celebrants.filter(c => {
    if (c.alreadyDispatched) return false;
    if (options.memberIds && options.memberIds.length > 0) {
      return options.memberIds.includes(c.memberId);
    }
    return true;
  });

  const defaultBirthdayMsg = "Dear {firstName}, the leadership and family of CACI wish you a glorious and blessed Happy Birthday! May God's supernatural grace, favor, and long life be your portion.";
  const defaultAnnivMsg = "Calvary greetings {firstName}! CACI leadership congratulates you on your Wedding Anniversary! May God continue to bless your marriage and home with peace and joy.";

  const dispatchedResults = [];

  for (const c of toDispatch) {
    if (!c.phone) continue;

    const rawTemplate = c.celebrationType === CelebrationType.BIRTHDAY
      ? (options.customBirthdayTemplate || defaultBirthdayMsg)
      : (options.customAnniversaryTemplate || defaultAnnivMsg);

    const personalized = rawTemplate
      .replace(/{firstName}/g, c.firstName)
      .replace(/{lastName}/g, c.lastName)
      .replace(/{churchName}/g, 'Christ Apostolic Church International (CACI)');

    // Dispatch via live Vynfy Gateway
    const gatewayRes = await sendVynfySMS({
      recipients: [c.phone],
      message: personalized,
      senderId: options.senderId || 'CACI '
    });

    // Record Celebration Log
    const log = await prisma.celebrationLog.create({
      data: {
        memberId: c.memberId,
        celebrationType: c.celebrationType,
        eventDate: dateKey,
        recipientPhone: c.phone,
        messageContent: personalized,
        status: gatewayRes.success ? MessageStatus.SENT : MessageStatus.FAILED
      }
    });

    // Also record in general message log
    await prisma.messageLog.create({
      data: {
        channel: MessageChannel.SMS,
        recipientPhone: c.phone,
        recipientName: `${c.firstName} ${c.lastName}`,
        messageContent: personalized,
        category: c.celebrationType === CelebrationType.BIRTHDAY ? 'BIRTHDAY_SMS' : 'ANNIVERSARY_SMS',
        status: gatewayRes.success ? MessageStatus.SENT : MessageStatus.FAILED
      }
    });

    dispatchedResults.push({
      memberId: c.memberId,
      name: `${c.firstName} ${c.lastName}`,
      phone: c.phone,
      type: c.celebrationType,
      gatewayStatus: gatewayRes.status,
      success: gatewayRes.success
    });
  }

  return {
    totalEligible: celebrants.length,
    dispatchedCount: dispatchedResults.length,
    results: dispatchedResults
  };
}
