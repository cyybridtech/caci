import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Shield,
  AlertTriangle,
  Building2,
  Calendar,
  MessageSquare,
  Award,
  ChevronRight,
  Sparkles,
  BarChart3,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2
} from 'lucide-react';
import { AnalyticsData } from '../types/index.ts';
import { api } from '../services/api.ts';

export const ExecutiveDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');

  useEffect(() => {
    api.getAnalytics()
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400 space-y-2">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-semibold">Computing executive church analytics...</p>
      </div>
    );
  }

  if (!analytics) return null;

  const maxWeeklyAttendance = Math.max(
    ...analytics.weeklyTrends.map((w) => w.totalPresent),
    analytics.totalMembers || 20
  );

  const maxMonthlyAttendance = Math.max(
    ...(analytics.monthlyTrends || []).map((m) => m.avgPresent),
    analytics.totalMembers || 20
  );

  const avgRecentTurnout = analytics.weeklyTrends.length > 0
    ? Math.round(
        analytics.weeklyTrends.reduce((acc, curr) => acc + curr.turnoutPercentage, 0) /
          analytics.weeklyTrends.length
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-extrabold tracking-tight">Executive Pastoral & Growth Analytics</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Weekly and Monthly attendance trends, Group 1 vs Group 2 retention, and pastoral care alerts
          </p>
        </div>

        {/* Total Active Members Pill */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-2.5 rounded-2xl text-center">
          <span className="text-[10px] text-slate-300 uppercase tracking-widest block font-extrabold">
            Total Active Members
          </span>
          <span className="text-2xl font-extrabold text-white block mt-0.5">
            {analytics.totalMembers}
          </span>
        </div>
      </div>

      {/* Top KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Group 1 KPI */}
        <div className="bg-white p-5 rounded-3xl border-2 border-blue-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Group 1 Strength
            </span>
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
          </div>
          <div className="text-3xl font-extrabold text-blue-800 mt-2">
            {analytics.group1Total} <span className="text-sm font-semibold text-slate-500">members</span>
          </div>
          <span className="text-[11px] text-blue-600 block mt-1 font-semibold">
            {Math.round((analytics.group1Total / (analytics.totalMembers || 1)) * 100)}% of total congregation
          </span>
        </div>

        {/* Group 2 KPI */}
        <div className="bg-white p-5 rounded-3xl border-2 border-purple-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
              Group 2 Strength
            </span>
            <span className="w-3 h-3 rounded-full bg-purple-600"></span>
          </div>
          <div className="text-3xl font-extrabold text-purple-800 mt-2">
            {analytics.group2Total} <span className="text-sm font-semibold text-slate-500">members</span>
          </div>
          <span className="text-[11px] text-purple-600 block mt-1 font-semibold">
            {Math.round((analytics.group2Total / (analytics.totalMembers || 1)) * 100)}% of total congregation
          </span>
        </div>

        {/* Turnout Average */}
        <div className="bg-white p-5 rounded-3xl border-2 border-emerald-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Recent Average Turnout
            </span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-800 mt-2">
            {avgRecentTurnout}%
          </div>
          <span className="text-[11px] text-emerald-600 block mt-1 font-semibold">
            Across past services recorded
          </span>
        </div>
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trends Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {/* Header & Timeframe Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>
                  {viewMode === 'WEEKLY' ? 'Weekly Service Attendance Trends' : 'Monthly Aggregated Attendance Trends'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {viewMode === 'WEEKLY'
                  ? 'Turnout comparison per service over past weeks'
                  : 'Turnout comparison aggregated month-by-month'}
              </p>
            </div>

            {/* Timeframe Toggle Buttons */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setViewMode('WEEKLY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 ${
                    viewMode === 'WEEKLY'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Weekly (Services)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('MONTHLY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 ${
                    viewMode === 'MONTHLY'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Monthly (Aggregate)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Group 1 & Group 2 Color Legend */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                <span className="font-bold text-blue-900">Group 1</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                <span className="font-bold text-purple-900">Group 2</span>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 font-semibold">
              Hover bars for detailed attendance stats
            </span>
          </div>

          {/* Graphical Bar Chart Visualizer */}
          {viewMode === 'WEEKLY' ? (
            <div className="h-64 flex items-end justify-between gap-3 pt-4 px-2 border-b border-slate-100 pb-2">
              {analytics.weeklyTrends.map((week, idx) => {
                const g1Height = (week.group1Present / maxWeeklyAttendance) * 100;
                const g2Height = (week.group2Present / maxWeeklyAttendance) * 100;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    {/* Tooltip on Hover */}
                    <div className="text-[10px] font-extrabold text-slate-800 opacity-0 group-hover:opacity-100 transition mb-1 text-center bg-slate-100 px-2 py-0.5 rounded-lg shadow-sm whitespace-nowrap">
                      {week.totalPresent} pres. ({week.turnoutPercentage}%)
                    </div>

                    {/* Dual Bar (Group 1 & Group 2) */}
                    <div className="w-full flex items-end justify-center space-x-1 bg-slate-50 p-1 rounded-2xl h-44 border border-slate-200/80 group-hover:border-blue-300 transition">
                      <div
                        className="w-1/2 bg-blue-600 rounded-t-xl transition-all duration-500 group-hover:bg-blue-500 shadow-sm"
                        style={{ height: `${Math.max(8, g1Height)}%` }}
                        title={`Group 1: ${week.group1Present} congregants`}
                      ></div>
                      <div
                        className="w-1/2 bg-purple-600 rounded-t-xl transition-all duration-500 group-hover:bg-purple-500 shadow-sm"
                        style={{ height: `${Math.max(8, g2Height)}%` }}
                        title={`Group 2: ${week.group2Present} congregants`}
                      ></div>
                    </div>

                    <span className="text-[11px] font-bold text-slate-700 mt-2 truncate w-full text-center">
                      {week.formattedDate}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold truncate w-full text-center">
                      {week.serviceType.replace('Service', '').replace('Divine Worship', 'Sunday')}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Monthly Aggregated Chart */
            <div className="h-64 flex items-end justify-between gap-4 pt-4 px-2 border-b border-slate-100 pb-2">
              {(analytics.monthlyTrends || []).map((month, idx) => {
                const g1Height = (month.avgGroup1Present / maxMonthlyAttendance) * 100;
                const g2Height = (month.avgGroup2Present / maxMonthlyAttendance) * 100;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    {/* Tooltip on Hover */}
                    <div className="text-[10px] font-extrabold text-slate-800 opacity-0 group-hover:opacity-100 transition mb-1 text-center bg-slate-100 px-2 py-0.5 rounded-lg shadow-sm whitespace-nowrap">
                      Avg: {month.avgPresent} ({month.turnoutPercentage}%) • {month.servicesCount} services
                    </div>

                    {/* Dual Bar (Group 1 & Group 2 Month Average) */}
                    <div className="w-full flex items-end justify-center space-x-1.5 bg-slate-50 p-1.5 rounded-2xl h-44 border border-slate-200/80 group-hover:border-purple-300 transition">
                      <div
                        className="w-1/2 bg-blue-600 rounded-t-xl transition-all duration-500 group-hover:bg-blue-500 shadow-sm"
                        style={{ height: `${Math.max(10, g1Height)}%` }}
                        title={`Group 1 Avg: ${month.avgGroup1Present} congregants`}
                      ></div>
                      <div
                        className="w-1/2 bg-purple-600 rounded-t-xl transition-all duration-500 group-hover:bg-purple-500 shadow-sm"
                        style={{ height: `${Math.max(10, g2Height)}%` }}
                        title={`Group 2 Avg: ${month.avgGroup2Present} congregants`}
                      ></div>
                    </div>

                    <span className="text-xs font-bold text-slate-800 mt-2 truncate w-full text-center">
                      {month.monthName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold truncate w-full text-center">
                      {month.servicesCount} services held
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Breakdown Comparison Summary Table */}
          <div className="pt-2">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
              {viewMode === 'WEEKLY' ? 'Recent Services Breakdown' : 'Monthly Performance Table'}
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">{viewMode === 'WEEKLY' ? 'Date & Service' : 'Month'}</th>
                    <th className="py-2.5 px-3 text-center">Group 1</th>
                    <th className="py-2.5 px-3 text-center">Group 2</th>
                    <th className="py-2.5 px-3 text-center">{viewMode === 'WEEKLY' ? 'Total Present' : 'Avg Turnout'}</th>
                    <th className="py-2.5 px-3 text-right">Turnout %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewMode === 'WEEKLY' ? (
                    analytics.weeklyTrends.map((w, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {w.formattedDate} — <span className="text-slate-500 font-normal">{w.serviceType}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-700">{w.group1Present}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-purple-700">{w.group2Present}</td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-slate-900">{w.totalPresent}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                            {w.turnoutPercentage}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    (analytics.monthlyTrends || []).map((m, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {m.monthName} ({m.servicesCount} services)
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-700">{m.avgGroup1Present}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-purple-700">{m.avgGroup2Present}</td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-slate-900">{m.avgPresent} / service</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {m.turnoutPercentage}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Auxiliary Turnout */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Auxiliary Turnout</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">Latest Service</span>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {analytics.departmentTurnout.map((dept) => (
              <div key={dept.id} className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800">{dept.name}</span>
                  <span className="font-bold text-purple-800">
                    {dept.present}/{dept.total} ({dept.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${dept.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Consecutive Absentees Watch List */}
      <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Pastoral Care Alert: Consecutive Absentees
              </h3>
              <p className="text-xs text-slate-500">
                Congregants who missed the last 2 consecutive services — recommend pastoral contact
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200 self-start sm:self-auto">
            {analytics.absenteeAlerts.length} members flagged
          </span>
        </div>

        {analytics.absenteeAlerts.length === 0 ? (
          <div className="py-8 text-center text-emerald-600 font-bold text-xs flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Excellent retention! No members are currently on the consecutive absentee list.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analytics.absenteeAlerts.map((member) => (
              <div
                key={member.id}
                className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt=""
                      className="w-9 h-9 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                        member.churchGroup === 'GROUP_1' ? 'bg-blue-600' : 'bg-purple-600'
                      }`}
                    >
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </div>
                  )}

                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-slate-900 truncate">
                        {member.firstName} {member.lastName}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                          member.churchGroup === 'GROUP_1'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {member.churchGroup === 'GROUP_1' ? 'G1' : 'G2'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono block truncate">
                      {member.phone || 'No phone'}
                    </span>
                  </div>
                </div>

                {member.phone && (
                  <a
                    href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Dear ${member.firstName}, Calvary greetings! We missed your warm presence at CACI recently. Hope all is well with you and your household.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Send Pastoral Care WhatsApp"
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition flex items-center space-x-1 font-bold text-[10px] shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Reach Out</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
