import React, { useState } from 'react';
import {
  UserCheck,
  Phone,
  ArrowRight,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Users,
  Shield,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Member, AssimilationStage, ChurchGroup } from '../types/index.ts';

interface AssimilationPipelineProps {
  members: Member[];
  onUpdateStage: (memberId: string, stage: AssimilationStage, group?: ChurchGroup) => Promise<void>;
}

export const AssimilationPipeline: React.FC<AssimilationPipelineProps> = ({
  members,
  onUpdateStage
}) => {
  const visitors = members.filter((m) => m.role === 'First-Timer' || m.assimilationStage !== 'REGULAR_MEMBER');

  const stages: { key: AssimilationStage; title: string; desc: string; color: string }[] = [
    {
      key: 'FIRST_VISIT',
      title: '1. First Sunday Visit',
      desc: 'Welcomed at the door today',
      color: 'border-blue-500 bg-blue-50/40 text-blue-900'
    },
    {
      key: 'WELCOME_CALL',
      title: '2. Welcome Call',
      desc: 'Follow-up call by visitation team',
      color: 'border-amber-500 bg-amber-50/40 text-amber-900'
    },
    {
      key: 'HOME_VISIT',
      title: '3. Pastoral / Home Visit',
      desc: 'In-person contact & prayer',
      color: 'border-purple-500 bg-purple-50/40 text-purple-900'
    },
    {
      key: 'ASSIGNED_GROUP',
      title: '4. Integrated (Group 1/2)',
      desc: 'Fully assimilated member',
      color: 'border-emerald-500 bg-emerald-50/40 text-emerald-900'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">First-Timer & Visitor Assimilation Pipeline</h2>
            <p className="text-xs text-slate-500">
              Track visitors from their first Sunday to full integration into Group 1 or Group 2
            </p>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage) => {
          const stageMembers = visitors.filter((m) => (m.assimilationStage || 'FIRST_VISIT') === stage.key);

          return (
            <div
              key={stage.key}
              className={`rounded-2xl border-2 ${stage.color} p-4 flex flex-col justify-between shadow-sm min-h-[500px]`}
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider">{stage.title}</h3>
                    <p className="text-[10px] text-slate-500">{stage.desc}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-slate-800 shadow-sm">
                    {stageMembers.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3">
                  {stageMembers.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs italic">
                      No visitors in this stage
                    </div>
                  ) : (
                    stageMembers.map((member) => (
                      <div
                        key={member.id}
                        className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3 hover:shadow-md transition"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-slate-900">
                            {member.firstName} {member.lastName}
                          </h4>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                              member.churchGroup === 'GROUP_1'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {member.churchGroup === 'GROUP_1' ? 'Group 1' : 'Group 2'}
                          </span>
                        </div>

                        {member.phone && (
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                            <span className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{member.phone}</span>
                            </span>
                            <a
                              href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Calvary greetings ${member.firstName}! We thank God for having you at CACI.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}

                        {member.invitedBy && (
                          <div className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                            Invited by: <span className="font-semibold text-slate-700">{member.invitedBy}</span>
                          </div>
                        )}

                        {/* Pipeline Advance Controls */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          {stage.key === 'FIRST_VISIT' && (
                            <button
                              onClick={() => onUpdateStage(member.id, 'WELCOME_CALL')}
                              className="w-full py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg flex items-center justify-center space-x-1 transition"
                            >
                              <span>Mark Call Made</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {stage.key === 'WELCOME_CALL' && (
                            <button
                              onClick={() => onUpdateStage(member.id, 'HOME_VISIT')}
                              className="w-full py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-lg flex items-center justify-center space-x-1 transition"
                            >
                              <span>Mark Visited</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {stage.key === 'HOME_VISIT' && (
                            <div className="w-full space-y-1.5">
                              <div className="text-[10px] font-bold text-slate-500">Assign Final Group:</div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <button
                                  onClick={() => onUpdateStage(member.id, 'ASSIGNED_GROUP', 'GROUP_1')}
                                  className="py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-[10px] transition"
                                >
                                  Group 1
                                </button>
                                <button
                                  onClick={() => onUpdateStage(member.id, 'ASSIGNED_GROUP', 'GROUP_2')}
                                  className="py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-[10px] transition"
                                >
                                  Group 2
                                </button>
                              </div>
                            </div>
                          )}

                          {stage.key === 'ASSIGNED_GROUP' && (
                            <span className="w-full py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg flex items-center justify-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Integrated</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
