import React, { useState, useEffect } from 'react';
import {
  Cake,
  Heart,
  Send,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Gift,
  UserCheck,
  Users
} from 'lucide-react';
import { Celebrant } from '../types/index.ts';
import { api } from '../services/api.ts';

interface CelebrationsViewProps {
  onSendMessageClick?: (phone: string, name: string, defaultMessage: string) => void;
}

export const CelebrationsView: React.FC<CelebrationsViewProps> = ({ onSendMessageClick }) => {
  const [todayCelebrants, setTodayCelebrants] = useState<Celebrant[]>([]);
  const [upcomingCelebrants, setUpcomingCelebrants] = useState<Celebrant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Template customizations
  const [birthdayTemplate, setBirthdayTemplate] = useState<string>(
    "Dear {firstName}, the leadership and church family of CACI wish you a glorious and blessed Happy Birthday! May God's supernatural grace, favor, and long life be your portion throughout this new year."
  );
  const [anniversaryTemplate, setAnniversaryTemplate] = useState<string>(
    "Calvary greetings {firstName}! CACI leadership congratulates you on your Wedding Anniversary! May God continue to bless your marriage and home with divine peace, fruitfulness, and joy."
  );

  const fetchCelebrations = async () => {
    try {
      setIsLoading(true);
      const [today, upcoming] = await Promise.all([
        api.getTodayCelebrants(),
        api.getUpcomingCelebrants(14)
      ]);
      setTodayCelebrants(today);
      setUpcomingCelebrants(upcoming);
    } catch (err: any) {
      console.error('Error fetching celebrations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCelebrations();
  }, []);

  const handleDispatchAll = async () => {
    try {
      setIsDispatching(true);
      setFeedback(null);
      const res = await api.dispatchCelebrationBlessings({
        customBirthdayTemplate: birthdayTemplate,
        customAnniversaryTemplate: anniversaryTemplate
      });
      setFeedback(res.message);
      await fetchCelebrations();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to dispatch celebration blessings');
    } finally {
      setIsDispatching(false);
    }
  };

  const pendingTodayCount = todayCelebrants.filter((c) => !c.alreadyDispatched).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-pink-900 via-rose-950 to-slate-900 text-white p-6 rounded-3xl shadow-sm border border-rose-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-rose-300 uppercase tracking-wider mb-1">
            <Cake className="w-4 h-4 text-rose-400" />
            <span>Automated Pastoral Care & Celebrations Engine</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Birthday & Wedding Anniversary Blessings
          </h2>
          <p className="text-xs text-rose-200/80 mt-0.5">
            Automated morning SMS dispatch via Vynfy, upcoming celebrant reminders, and pastoral greetings
          </p>
        </div>

        {/* Engine Status Badge */}
        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-2xl self-start md:self-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-200 block">Daily Auto-Scheduler</span>
            <span className="text-xs font-mono font-bold text-white">Active (Daily at 7:00 AM)</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-extrabold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Today's Celebrants vs Upcoming & Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Celebrants */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Today's Celebrants ({todayCelebrants.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={fetchCelebrations}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  title="Refresh Celebrants"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleDispatchAll}
                  disabled={isDispatching || todayCelebrants.length === 0}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-sm transition disabled:opacity-50 flex items-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isDispatching
                      ? 'Dispatching via Vynfy...'
                      : `Dispatch Blessings (${pendingTodayCount} Pending)`}
                  </span>
                </button>
              </div>
            </div>

            {/* List of Today's Celebrants */}
            {todayCelebrants.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Cake className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-500">No birthdays or anniversaries today.</p>
                <p className="text-[11px] text-slate-400">Check upcoming celebrants in the calendar below!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {todayCelebrants.map((c) => (
                  <div
                    key={`${c.memberId}_${c.celebrationType}`}
                    className={`p-4 rounded-2xl border-2 transition flex items-center justify-between gap-3 ${
                      c.celebrationType === 'BIRTHDAY'
                        ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                        : 'bg-purple-50/50 border-purple-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {c.photoUrl ? (
                        <img
                          src={c.photoUrl}
                          alt=""
                          className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-white shadow-sm"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-sm ${
                            c.celebrationType === 'BIRTHDAY' ? 'bg-rose-600' : 'bg-purple-600'
                          }`}
                        >
                          {c.firstName[0]}
                          {c.lastName[0]}
                        </div>
                      )}

                      <div className="truncate">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {c.firstName} {c.lastName}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                              c.celebrationType === 'BIRTHDAY'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {c.celebrationType === 'BIRTHDAY' ? '🎂 Birthday' : '💍 Anniversary'}
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-600 block mt-0.5">
                          {c.ageOrYears !== null
                            ? c.celebrationType === 'BIRTHDAY'
                              ? `Turning ${c.ageOrYears} years old`
                              : `${c.ageOrYears} years of marriage`
                            : 'Celebrating today'}
                        </span>

                        <span className="text-[10px] text-slate-400 font-mono block">
                          {c.phone || 'No phone registered'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1.5 shrink-0">
                      {c.alreadyDispatched ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>SMS Sent</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending</span>
                        </span>
                      )}

                      {c.phone && (
                        <a
                          href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            c.celebrationType === 'BIRTHDAY'
                              ? birthdayTemplate.replace('{firstName}', c.firstName)
                              : anniversaryTemplate.replace('{firstName}', c.firstName)
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[10px] transition shadow-xs flex items-center space-x-1"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Celebrants (Next 14 Days) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Upcoming Celebrants (Next 14 Days)
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {upcomingCelebrants.length} upcoming
              </span>
            </div>

            {upcomingCelebrants.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No upcoming birthdays or anniversaries in the next 14 days.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcomingCelebrants.map((u, i) => {
                  const eventD = new Date(u.date);
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-900 block truncate">
                          {u.firstName} {u.lastName}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <span>
                            {eventD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-rose-700">
                            {u.celebrationType === 'BIRTHDAY' ? '🎂 Birthday' : '💍 Anniversary'}
                          </span>
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white border text-slate-600 shrink-0">
                        {u.churchGroup === 'GROUP_1' ? 'G1' : 'G2'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Pastoral Blessing Message Templates */}
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-base text-slate-900">Blessing Templates</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                Vynfy Gateway
              </span>
            </div>

            <p className="text-xs text-slate-500">
              These pastoral messages will be dispatched automatically every morning at 7:00 AM.
            </p>

            {/* Birthday Template */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                <Cake className="w-3.5 h-3.5 text-rose-500" />
                <span>Birthday SMS Template</span>
              </label>
              <textarea
                rows={4}
                value={birthdayTemplate}
                onChange={(e) => setBirthdayTemplate(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-2xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Anniversary Template */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                <Heart className="w-3.5 h-3.5 text-purple-500" />
                <span>Anniversary SMS Template</span>
              </label>
              <textarea
                rows={4}
                value={anniversaryTemplate}
                onChange={(e) => setAnniversaryTemplate(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-2xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Dynamic Tags Helper */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold block text-slate-800">Available Dynamic Tags:</span>
              <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                <span className="px-1.5 py-0.5 bg-white border rounded">{"{firstName}"}</span>
                <span className="px-1.5 py-0.5 bg-white border rounded">{"{lastName}"}</span>
                <span className="px-1.5 py-0.5 bg-white border rounded">{"{churchName}"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
