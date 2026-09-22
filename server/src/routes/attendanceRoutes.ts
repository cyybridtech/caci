import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { ChurchGroup } from '@prisma/client';

export const attendanceRouter = Router();

// GET /api/attendance/analytics - executive pastoral analytics & trends (weekly + monthly)
attendanceRouter.get('/analytics', async (req: Request, res: Response) => {
  try {
    const totalMembers = await prisma.member.count({ where: { status: 'ACTIVE' } });
    const group1Total = await prisma.member.count({ where: { status: 'ACTIVE', churchGroup: ChurchGroup.GROUP_1 } });
    const group2Total = await prisma.member.count({ where: { status: 'ACTIVE', churchGroup: ChurchGroup.GROUP_2 } });

    // Fetch up to 24 service sessions for rich weekly and monthly analytics
    const allSessions = await prisma.serviceSession.findMany({
      orderBy: { serviceDate: 'desc' },
      take: 24,
      include: {
        attendance: {
          include: {
            member: {
              select: { id: true, firstName: true, lastName: true, churchGroup: true, phone: true }
            }
          }
        }
      }
    });

    // 1. Weekly Trends (Last 8-12 sessions chronological)
    const recentSessions = allSessions.slice(0, 10).reverse();
    const weeklyTrends = recentSessions.map(s => {
      const presentCount = s.attendance.length;
      const g1 = s.attendance.filter(a => a.member.churchGroup === ChurchGroup.GROUP_1).length;
      const g2 = s.attendance.filter(a => a.member.churchGroup === ChurchGroup.GROUP_2).length;
      return {
        sessionId: s.id,
        date: s.serviceDate,
        formattedDate: new Date(s.serviceDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        serviceType: s.serviceType,
        totalPresent: presentCount,
        group1Present: g1,
        group2Present: g2,
        turnoutPercentage: totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0
      };
    });

    // 2. Monthly Aggregated Trends (Grouped by Month)
    const monthMap = new Map<string, {
      monthKey: string;
      monthName: string;
      services: typeof allSessions;
      totalPresent: number;
      g1Present: number;
      g2Present: number;
      uniqueMemberIds: Set<string>;
    }>();

    for (const session of allSessions) {
      const d = new Date(session.serviceDate);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          monthKey,
          monthName,
          services: [],
          totalPresent: 0,
          g1Present: 0,
          g2Present: 0,
          uniqueMemberIds: new Set<string>()
        });
      }

      const mData = monthMap.get(monthKey)!;
      mData.services.push(session);
      mData.totalPresent += session.attendance.length;
      mData.g1Present += session.attendance.filter(a => a.member.churchGroup === ChurchGroup.GROUP_1).length;
      mData.g2Present += session.attendance.filter(a => a.member.churchGroup === ChurchGroup.GROUP_2).length;
      session.attendance.forEach(a => mData.uniqueMemberIds.add(a.member.id));
    }

    // Sort months chronologically
    const monthlyTrends = Array.from(monthMap.values())
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map(m => {
        const sCount = m.services.length || 1;
        const avgPresent = Math.round(m.totalPresent / sCount);
        const avgG1 = Math.round(m.g1Present / sCount);
        const avgG2 = Math.round(m.g2Present / sCount);
        return {
          monthKey: m.monthKey,
          monthName: m.monthName,
          servicesCount: m.services.length,
          totalPresent: m.totalPresent,
          avgPresent: avgPresent,
          avgGroup1Present: avgG1,
          avgGroup2Present: avgG2,
          uniqueAttendeesCount: m.uniqueMemberIds.size,
          turnoutPercentage: totalMembers > 0 ? Math.round((avgPresent / totalMembers) * 100) : 0
        };
      });

    // 3. Absentee Alerts (Members who missed the last 2 services)
    let absenteeAlerts: any[] = [];
    if (allSessions.length >= 2) {
      const recent2 = allSessions.slice(0, 2);
      const attendedInRecent = new Set(recent2.flatMap(s => s.attendance.map(a => a.member.id)));
      const allActive = await prisma.member.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, phone: true, photoUrl: true, churchGroup: true, role: true }
      });
      absenteeAlerts = allActive.filter(m => !attendedInRecent.has(m.id));
    }

    // 4. Turnout by Department for the latest session
    const departments = await prisma.department.findMany({
      include: {
        members: {
          select: { memberId: true }
        }
      }
    });

    const latest = allSessions[0];
    const latestAttendeeIds = latest ? new Set(latest.attendance.map(a => a.member.id)) : new Set();

    const departmentTurnout = departments.map(d => {
      const deptMemberIds = d.members.map(m => m.memberId);
      const totalInDept = deptMemberIds.length;
      const presentInDept = deptMemberIds.filter(id => latestAttendeeIds.has(id)).length;
      const percentage = totalInDept > 0 ? Math.round((presentInDept / totalInDept) * 100) : 0;
      return {
        id: d.id,
        name: d.name,
        total: totalInDept,
        present: presentInDept,
        percentage
      };
    });

    res.json({
      totalMembers,
      group1Total,
      group2Total,
      weeklyTrends,
      monthlyTrends,
      absenteeAlerts,
      departmentTurnout
    });
  } catch (error: any) {
    console.error('Error calculating analytics:', error);
    res.status(500).json({ error: 'Failed to calculate church analytics' });
  }
});

// GET /api/attendance/session/:sessionId - all check-ins for a session
attendanceRouter.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const records = await prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: {
        member: {
          include: {
            departments: {
              include: {
                department: true
              }
            }
          }
        }
      },
      orderBy: { checkInTime: 'desc' }
    });

    res.json(records);
  } catch (error: any) {
    console.error('Error fetching session attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// POST /api/attendance/check-in - rapid check-in
attendanceRouter.post('/check-in', async (req: Request, res: Response) => {
  try {
    const { sessionId, memberId, markedBy } = req.body;

    if (!sessionId || !memberId) {
      return res.status(400).json({ error: 'sessionId and memberId are required' });
    }

    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        sessionId_memberId: {
          sessionId,
          memberId
        }
      },
      include: {
        member: true
      }
    });

    if (existing) {
      return res.status(200).json({
        message: 'Member is already checked in',
        record: existing,
        alreadyCheckedIn: true
      });
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        sessionId,
        memberId,
        markedBy: markedBy || 'Media Desk'
      },
      include: {
        member: {
          include: {
            departments: {
              include: {
                department: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Check-in successful',
      record,
      alreadyCheckedIn: false
    });
  } catch (error: any) {
    console.error('Error during check-in:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// POST /api/attendance/undo - undo check-in
attendanceRouter.post('/undo', async (req: Request, res: Response) => {
  try {
    const { sessionId, memberId } = req.body;

    if (!sessionId || !memberId) {
      return res.status(400).json({ error: 'sessionId and memberId are required' });
    }

    await prisma.attendanceRecord.deleteMany({
      where: {
        sessionId,
        memberId
      }
    });

    res.json({ success: true, message: 'Check-in undone successfully' });
  } catch (error: any) {
    console.error('Error undoing check-in:', error);
    res.status(500).json({ error: 'Failed to undo attendance' });
  }
});

// GET /api/attendance/stats/:sessionId - live headcount counters
attendanceRouter.get('/stats/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const totalMembers = await prisma.member.count({
      where: { status: 'ACTIVE' }
    });

    const group1Total = await prisma.member.count({
      where: { status: 'ACTIVE', churchGroup: ChurchGroup.GROUP_1 }
    });

    const group2Total = await prisma.member.count({
      where: { status: 'ACTIVE', churchGroup: ChurchGroup.GROUP_2 }
    });

    const checkedInRecords = await prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: {
        member: {
          select: { churchGroup: true }
        }
      }
    });

    const totalPresent = checkedInRecords.length;
    const group1Present = checkedInRecords.filter(r => r.member.churchGroup === ChurchGroup.GROUP_1).length;
    const group2Present = checkedInRecords.filter(r => r.member.churchGroup === ChurchGroup.GROUP_2).length;

    const overallPercentage = totalMembers > 0 ? Math.round((totalPresent / totalMembers) * 100) : 0;
    const group1Percentage = group1Total > 0 ? Math.round((group1Present / group1Total) * 100) : 0;
    const group2Percentage = group2Total > 0 ? Math.round((group2Present / group2Total) * 100) : 0;

    res.json({
      totalMembers,
      totalPresent,
      totalAbsent: Math.max(0, totalMembers - totalPresent),
      overallPercentage,
      group1: {
        total: group1Total,
        present: group1Present,
        absent: Math.max(0, group1Total - group1Present),
        percentage: group1Percentage
      },
      group2: {
        total: group2Total,
        present: group2Present,
        absent: Math.max(0, group2Total - group2Present),
        percentage: group2Percentage
      }
    });
  } catch (error: any) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ error: 'Failed to fetch attendance stats' });
  }
});
