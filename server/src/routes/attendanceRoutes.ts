import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { ChurchGroup } from '@prisma/client';

export const attendanceRouter = Router();

// GET /api/attendance/analytics - executive pastoral analytics & growth/drop trends
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

    // 1. Weekly Trends (Last 10 sessions in chronological order)
    const recentSessions = allSessions.slice(0, 10).reverse();
    const rawWeekly = recentSessions.map(s => {
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

    // Calculate delta (dropped vs increased) for each service
    const weeklyTrends = rawWeekly.map((item, idx, arr) => {
      if (idx === 0) {
        return {
          ...item,
          netChange: 0,
          percentChange: 0,
          trendStatus: 'STABLE' as const
        };
      }
      const prev = arr[idx - 1];
      const net = item.totalPresent - prev.totalPresent;
      const pct = prev.totalPresent > 0 ? Math.round((net / prev.totalPresent) * 100) : (net > 0 ? 100 : 0);
      return {
        ...item,
        netChange: net,
        percentChange: pct,
        trendStatus: net > 0 ? ('INCREASED' as const) : net < 0 ? ('DROPPED' as const) : ('STABLE' as const)
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

    // Sort months chronologically and calculate deltas
    const rawMonthly = Array.from(monthMap.values())
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

    const monthlyTrends = rawMonthly.map((item, idx, arr) => {
      if (idx === 0) {
        return {
          ...item,
          netChange: 0,
          percentChange: 0,
          trendStatus: 'STABLE' as const
        };
      }
      const prev = arr[idx - 1];
      const net = item.avgPresent - prev.avgPresent;
      const pct = prev.avgPresent > 0 ? Math.round((net / prev.avgPresent) * 100) : (net > 0 ? 100 : 0);
      return {
        ...item,
        netChange: net,
        percentChange: pct,
        trendStatus: net > 0 ? ('INCREASED' as const) : net < 0 ? ('DROPPED' as const) : ('STABLE' as const)
      };
    });

    // 3. Executive Growth Summary vs Previous Service
    const latestService = weeklyTrends.length > 0 ? weeklyTrends[weeklyTrends.length - 1] : null;
    const priorService = weeklyTrends.length > 1 ? weeklyTrends[weeklyTrends.length - 2] : null;

    const serviceGrowth = latestService && priorService ? {
      latestCount: latestService.totalPresent,
      priorCount: priorService.totalPresent,
      netChange: latestService.totalPresent - priorService.totalPresent,
      percentChange: priorService.totalPresent > 0
        ? Math.round(((latestService.totalPresent - priorService.totalPresent) / priorService.totalPresent) * 100)
        : (latestService.totalPresent > 0 ? 100 : 0),
      status: (latestService.totalPresent > priorService.totalPresent
        ? 'INCREASED'
        : latestService.totalPresent < priorService.totalPresent
        ? 'DROPPED'
        : 'STABLE') as 'INCREASED' | 'DROPPED' | 'STABLE'
    } : {
      latestCount: latestService ? latestService.totalPresent : 0,
      priorCount: 0,
      netChange: 0,
      percentChange: 0,
      status: 'STABLE' as const
    };

    // 4. Absentee Alerts (Members who missed the last 2 services)
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

    // 5. Turnout by Department for the latest session
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
      serviceGrowth,
      weeklyTrends,
      monthlyTrends,
      absenteeAlerts,
      departmentTurnout
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch executive analytics' });
  }
});

// POST /api/attendance/check-in - high-speed one-press check-in
attendanceRouter.post('/check-in', async (req: Request, res: Response) => {
  try {
    const { sessionId, memberId, markedBy } = req.body;

    if (!sessionId || !memberId) {
      return res.status(400).json({ error: 'sessionId and memberId are required' });
    }

    // Verify session
    const session = await prisma.serviceSession.findUnique({
      where: { id: sessionId }
    });
    if (!session) {
      return res.status(404).json({ error: 'Service session not found' });
    }

    // Verify member
    const member = await prisma.member.findUnique({
      where: { id: memberId }
    });
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Idempotent upsert check
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        sessionId_memberId: {
          sessionId,
          memberId
        }
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

    if (existing) {
      return res.json({
        message: 'Member already checked in',
        record: existing,
        alreadyCheckedIn: true
      });
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        sessionId,
        memberId,
        markedBy: markedBy || 'Media Desk Operator'
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
      message: 'Attendance recorded successfully',
      record,
      alreadyCheckedIn: false
    });
  } catch (error: any) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// POST /api/attendance/undo - instant check-in undo
attendanceRouter.post('/undo', async (req: Request, res: Response) => {
  try {
    const { sessionId, memberId } = req.body;

    if (!sessionId || !memberId) {
      return res.status(400).json({ error: 'sessionId and memberId are required' });
    }

    await prisma.attendanceRecord.delete({
      where: {
        sessionId_memberId: {
          sessionId,
          memberId
        }
      }
    });

    res.json({ success: true, message: 'Check-in successfully undone' });
  } catch (error: any) {
    console.error('Error undoing attendance:', error);
    res.status(500).json({ error: 'Failed to undo attendance' });
  }
});

// GET /api/attendance/session/:sessionId - all check-ins for a session
attendanceRouter.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;

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
    res.status(500).json({ error: 'Failed to fetch session attendance' });
  }
});

// GET /api/attendance/search - high-speed member search
attendanceRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, group } = req.query;

    const whereClause: any = {
      status: 'ACTIVE'
    };

    if (group && (group === 'GROUP_1' || group === 'GROUP_2')) {
      whereClause.churchGroup = group as ChurchGroup;
    }

    if (q && typeof q === 'string' && q.trim().length > 0) {
      const searchTerm = q.trim();
      whereClause.OR = [
        { firstName: { contains: searchTerm } },
        { lastName: { contains: searchTerm } },
        { memberCode: { contains: searchTerm } },
        { phone: { contains: searchTerm } }
      ];
    }

    const members = await prisma.member.findMany({
      where: whereClause,
      include: {
        departments: {
          include: {
            department: true
          }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      take: 50
    });

    res.json(members);
  } catch (error: any) {
    console.error('Error searching members for check-in:', error);
    res.status(500).json({ error: 'Failed to search members' });
  }
});

// GET /api/attendance/stats/:sessionId - live headcount counters
attendanceRouter.get('/stats/:sessionId', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;

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
    res.status(500).json({ error: 'Failed to calculate stats' });
  }
});
