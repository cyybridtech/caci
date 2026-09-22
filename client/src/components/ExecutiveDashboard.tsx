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
  BarChart3,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  Activity,
  Layers,
  LineChart
} from 'lucide-react';
import { AnalyticsData } from '../types/index.ts';
import { api } from '../services/api.ts';

export const ExecutiveDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [chartType, setChartType] = useState<'TOTAL' | 'GROUPS'>('TOTAL');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

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

  const weeklyData = analytics.weeklyTrends || [];
  const monthlyData = analytics.monthlyTrends || [];
  const activeDataset = timeframe === 'WEEKLY' ? weeklyData : monthlyData;

  // Compute key summary numbers
  const latestService = weeklyData.length > 0 ? weeklyData[weeklyData.length - 1] : null;
  const growth = analytics.serviceGrowth || {
    latestCount: latestService ? latestService.totalPresent : 0,
    priorCount: 0,
    netChange: 0,
    percentChange: 0,
    status: 'STABLE' as const
  };

  const totalMembers = analytics.totalMembers || 1;
  const avgTurnout = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((acc, curr) => acc + curr.turnoutPercentage, 0) / weeklyData.length)
    : 0;

  const highestTurnout = weeklyData.length > 0
    ? Math.max(...weeklyData.map((w) => w.totalPresent))
    : 0;

  // Chart coordinate calculations (Professional SVG Area/Line)
  const chartWidth = 700;
  const chartHeight = 220;
  const paddingX = 45;
  const paddingY = 25;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingY * 2;

  const maxVal = Math.max(
    totalMembers,
    ...activeDataset.map((d: any) => d.totalPresent || d.avgPresent || 0),
    10
  );

  const getPoints = (getValue: (item: any) => number) => {
    if (activeDataset.length === 0) return [];
    if (activeDataset.length === 1) {
      const y = chartHeight - paddingY - (getValue(activeDataset[0]) / maxVal) * plotHeight;
      return [{ x: chartWidth / 2, y, item: activeDataset[0], idx: 0 }];
    }
    return activeDataset.map((item, idx) => {
      const x = paddingX + (idx / (activeDataset.length - 1)) * plotWidth;
      const val = getValue(item);
      const y = chartHeight - paddingY - (val / maxVal) * plotHeight;
      return { x, y, item, idx, val };
    });
  };

  const totalPoints = getPoints((d: any) => (timeframe === 'WEEKLY' ? d.totalPresent : d.avgPresent));
  const g1Points = getPoints((d: any) => (timeframe === 'WEEKLY' ? d.group1Present : d.avgGroup1Present));
  const g2Points = getPoints((d: any) => (timeframe === 'WEEKLY' ? d.group2Present : d.avgGroup2Present));

  // Generate SVG Path for line & area
  const createLinePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    return pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  };

  const createAreaPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    const linePath = createLinePath(pts);
    const lastX = pts[pts.length - 1].x;
    const firstX = pts[0].x;
    const baseY = chartHeight - paddingY;
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  // Gridline values
  const gridSteps = [0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), maxVal];

  return (
    <div className="space-y-6">
      {/* Executive Growth Trajectory Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Executive Growth & Retention Overview</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Congregation Attendance & Growth Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time service turnout changes, growth trajectory vs drops, and demographic stability
          </p>
        </div>

        {/* Growth or Drop Status Pill */}
        <div className="flex items-center space-x-3 bg-slate-800/90 border border-slate-700/80 px-4 py-3 rounded-2xl">
          <div
            className={`p-2.5 rounded-xl flex items-center justify-center ${
              growth.status === 'INCREASED'
                ? 'bg-emerald-500/20 text-emerald-400'
                : growth.status === 'DROPPED'
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {growth.status === 'INCREASED' ? (
              <ArrowUpRight className="w-5 h-5" />
            ) : growth.status === 'DROPPED' ? (
              <ArrowDownRight className="w-5 h-5" />
            ) : (
              <Minus className="w-5 h-5" />
            )}
          </div>

          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
              Latest Service Trajectory
            </span>
            <div className="flex items-center space-x-1.5">
              <span
                className={`text-sm font-extrabold ${
                  growth.status === 'INCREASED'
                    ? 'text-emerald-400'
                    : growth.status === 'DROPPED'
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {growth.status === 'INCREASED'
                  ? `+${growth.netChange} Attendee${Math.abs(growth.netChange) !== 1 ? 's' : ''} (+${growth.percentChange}%)`
                  : growth.status === 'DROPPED'
                  ? `${growth.netChange} Attendee${Math.abs(growth.netChange) !== 1 ? 's' : ''} (${growth.percentChange}%)`
                  : 'Stable / Consistent'}
              </span>
              <span className="text-[10px] text-slate-400">vs prior service</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Crisp Key Performance Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Latest Service Headcount */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Latest Service Turnout
            </span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {latestService ? latestService.totalPresent : 0}
            <span className="text-xs font-normal text-slate-500 ml-1.5">
              / {totalMembers} congregants
            </span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] font-semibold">
            {growth.status === 'INCREASED' ? (
              <span className="text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +{growth.percentChange}% growth
              </span>
            ) : growth.status === 'DROPPED' ? (
              <span className="text-rose-600 flex items-center">
                <ArrowDownRight className="w-3 h-3 mr-0.5" /> {growth.percentChange}% drop
              </span>
            ) : (
              <span className="text-slate-500">Unchanged</span>
            )}
            <span className="text-slate-400">• {latestService?.turnoutPercentage || 0}% turnout</span>
          </div>
        </div>

        {/* Average Service Turnout */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Average Turnout Rate
            </span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {avgTurnout}%
          </div>
          <span className="text-[11px] text-slate-500 block font-medium">
            Across past {weeklyData.length} recorded services
          </span>
        </div>

        {/* Highest Service Peak */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Peak Attendance
            </span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {highestTurnout}
            <span className="text-xs font-normal text-slate-500 ml-1.5">attendees</span>
          </div>
          <span className="text-[11px] text-slate-500 block font-medium">
            Highest single service headcount
          </span>
        </div>

        {/* Group 1 & Group 2 Split */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Group 1 / Group 2 Split
            </span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-extrabold text-slate-900 mt-1 flex items-center space-x-2">
            <span className="text-blue-700 font-bold">{analytics.group1Total} (G1)</span>
            <span className="text-slate-300">/</span>
            <span className="text-purple-700 font-bold">{analytics.group2Total} (G2)</span>
          </div>
          {/* Progress split bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex mt-1">
            <div
              className="bg-blue-600 h-full"
              style={{ width: `${Math.round((analytics.group1Total / totalMembers) * 100)}%` }}
            ></div>
            <div
              className="bg-purple-600 h-full"
              style={{ width: `${Math.round((analytics.group2Total / totalMembers) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Professional Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Enterprise Interactive Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
          {/* Chart Header & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <LineChart className="w-4 h-4 text-blue-600" />
                <span>Attendance Trajectory & Trend Analysis</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {timeframe === 'WEEKLY'
                  ? 'Service-by-service attendance progression and growth/drop indicators'
                  : 'Monthly aggregated attendance performance and retention rate'}
              </p>
            </div>

            {/* View & Type Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Chart Series Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setChartType('TOTAL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition ${
                    chartType === 'TOTAL'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Overall Trajectory
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('GROUPS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition ${
                    chartType === 'GROUPS'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Group 1 vs 2
                </button>
              </div>

              {/* Timeframe Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTimeframe('WEEKLY')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition ${
                    timeframe === 'WEEKLY'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setTimeframe('MONTHLY')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition ${
                    timeframe === 'MONTHLY'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center space-x-4 font-semibold text-slate-700">
              {chartType === 'TOTAL' ? (
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-0.5 bg-blue-600 rounded"></span>
                  <span className="text-blue-950 font-bold">Total Church Attendance</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-0.5 bg-blue-600 rounded"></span>
                    <span className="text-blue-900 font-bold">Group 1</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-0.5 bg-purple-600 rounded"></span>
                    <span className="text-purple-900 font-bold">Group 2</span>
                  </div>
                </>
              )}
            </div>

            <span className="text-[11px] text-slate-400 font-medium">
              Click or hover points for growth/drop details
            </span>
          </div>

          {/* Clean Executive SVG Line/Area Chart */}
          <div className="relative bg-slate-50/50 rounded-2xl border border-slate-200/80 p-3">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-56 overflow-visible"
            >
              <defs>
                <linearGradient id="totalAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="g1Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="g2Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              {gridSteps.map((stepVal, idx) => {
                const y = chartHeight - paddingY - (stepVal / maxVal) * plotHeight;
                return (
                  <g key={idx}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray={idx === 0 ? undefined : '3 3'}
                      strokeWidth={1}
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      fill="#94a3b8"
                      fontSize="9"
                      fontWeight="600"
                      textAnchor="end"
                    >
                      {stepVal}
                    </text>
                  </g>
                );
              })}

              {/* Chart Series Rendering */}
              {chartType === 'TOTAL' ? (
                <>
                  {/* Area fill */}
                  <path
                    d={createAreaPath(totalPoints)}
                    fill="url(#totalAreaGrad)"
                  />
                  {/* Line */}
                  <path
                    d={createLinePath(totalPoints)}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              ) : (
                <>
                  {/* Group 1 Line */}
                  <path
                    d={createAreaPath(g1Points)}
                    fill="url(#g1Grad)"
                  />
                  <path
                    d={createLinePath(g1Points)}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Group 2 Line */}
                  <path
                    d={createAreaPath(g2Points)}
                    fill="url(#g2Grad)"
                  />
                  <path
                    d={createLinePath(g2Points)}
                    fill="none"
                    stroke="#9333ea"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Interactive Data Points */}
              {totalPoints.map((pt, idx) => {
                const isHovered = hoveredIdx === idx;
                const d = pt.item as any;
                const net = d.netChange || 0;
                const pct = d.percentChange || 0;
                const isGrowth = net > 0;
                const isDrop = net < 0;

                return (
                  <g key={idx} className="cursor-pointer">
                    {/* Hover vertical guide line */}
                    {isHovered && (
                      <line
                        x1={pt.x}
                        y1={paddingY}
                        x2={pt.x}
                        y2={chartHeight - paddingY}
                        stroke="#94a3b8"
                        strokeDasharray="2 2"
                        strokeWidth={1}
                      />
                    )}

                    {/* Data Point Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? '#1d4ed8' : '#2563eb'}
                      stroke="#ffffff"
                      strokeWidth={2}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />

                    {/* X Axis Label */}
                    <text
                      x={pt.x}
                      y={chartHeight - 6}
                      fill="#64748b"
                      fontSize="9.5"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {timeframe === 'WEEKLY' ? d.formattedDate : d.monthName?.split(' ')[0]}
                    </text>

                    {/* Trend Indicator Icon above point on hover */}
                    {isHovered && (
                      <g transform={`translate(${pt.x - 45}, ${Math.max(10, pt.y - 48)})`}>
                        <rect
                          width="90"
                          height="40"
                          rx="8"
                          fill="#0f172a"
                          opacity="0.95"
                        />
                        <text
                          x="45"
                          y="15"
                          fill="#f8fafc"
                          fontSize="9.5"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {timeframe === 'WEEKLY' ? `${d.totalPresent} Attendees` : `Avg: ${d.avgPresent}`}
                        </text>
                        <text
                          x="45"
                          y="29"
                          fill={isGrowth ? '#4ade80' : isDrop ? '#f87171' : '#94a3b8'}
                          fontSize="8.5"
                          fontWeight="600"
                          textAnchor="middle"
                        >
                          {idx === 0
                            ? 'Baseline Service'
                            : isGrowth
                            ? `▲ +${net} (+${pct}%)`
                            : isDrop
                            ? `▼ ${net} (${pct}%)`
                            : '• Unchanged'}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Growth & Drop Detailed Breakdown Table */}
          <div className="pt-2">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2.5">
              {timeframe === 'WEEKLY' ? 'Service Turnout & Net Delta Log' : 'Monthly Performance & Trend Log'}
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">{timeframe === 'WEEKLY' ? 'Service Session' : 'Month'}</th>
                    <th className="py-2.5 px-3 text-center">Group 1</th>
                    <th className="py-2.5 px-3 text-center">Group 2</th>
                    <th className="py-2.5 px-3 text-center">
                      {timeframe === 'WEEKLY' ? 'Total Present' : 'Avg / Service'}
                    </th>
                    <th className="py-2.5 px-3 text-center">Turnout Rate</th>
                    <th className="py-2.5 px-3 text-right">Growth / Drop Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timeframe === 'WEEKLY' ? (
                    weeklyData.map((w: any, i: number) => {
                      const net = w.netChange || 0;
                      const pct = w.percentChange || 0;
                      const isGrowth = net > 0;
                      const isDrop = net < 0;

                      return (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {w.formattedDate} — <span className="text-slate-500 font-normal">{w.serviceType}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-blue-700">{w.group1Present}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-purple-700">{w.group2Present}</td>
                          <td className="py-2.5 px-3 text-center font-extrabold text-slate-900">{w.totalPresent}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {w.turnoutPercentage}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {i === 0 ? (
                              <span className="text-[10px] text-slate-400 font-semibold">Baseline</span>
                            ) : isGrowth ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>+{net} (+{pct}%)</span>
                              </span>
                            ) : isDrop ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                                <ArrowDownRight className="w-3 h-3" />
                                <span>{net} ({pct}%)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                                <Minus className="w-3 h-3" />
                                <span>No change</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    monthlyData.map((m: any, i: number) => {
                      const net = m.netChange || 0;
                      const pct = m.percentChange || 0;
                      const isGrowth = net > 0;
                      const isDrop = net < 0;

                      return (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {m.monthName} ({m.servicesCount} services)
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-blue-700">{m.avgGroup1Present}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-purple-700">{m.avgGroup2Present}</td>
                          <td className="py-2.5 px-3 text-center font-extrabold text-slate-900">{m.avgPresent} / service</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {m.turnoutPercentage}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {i === 0 ? (
                              <span className="text-[10px] text-slate-400 font-semibold">Baseline</span>
                            ) : isGrowth ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>+{net} (+{pct}%)</span>
                              </span>
                            ) : isDrop ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                                <ArrowDownRight className="w-3 h-3" />
                                <span>{net} ({pct}%)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                                <Minus className="w-3 h-3" />
                                <span>No change</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Auxiliary Turnout Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Departmental Turnout</span>
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
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
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
