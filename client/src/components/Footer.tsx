import React from 'react';
import { Church, ShieldCheck, Heart, Sparkles, ExternalLink, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Church Identity */}
          <div className="flex items-center space-x-3 text-center md:text-left">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Church className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-white text-sm tracking-tight">
                Christ Apostolic Church International
              </p>
              <p className="text-[11px] text-slate-500">
                Official Media Desk & Church Administration System
              </p>
            </div>
          </div>

          {/* Center: System badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Offline-First Sync</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Vynfy SMS Gateway</span>
            </span>
          </div>

          {/* Right: Cyybrid Technology Branding */}
          <div className="flex flex-col items-center md:items-end space-y-1 text-center md:text-right">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium text-[11px]">Engineered & Developed by</span>
              <a
                href="https://github.com/cyybridtech"
                target="_blank"
                rel="noreferrer"
                className="font-extrabold text-white bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent hover:brightness-125 transition flex items-center space-x-1"
                title="Cyybrid Technology"
              >
                <Cpu className="w-3.5 h-3.5 text-blue-400 inline mr-0.5" />
                <span>Cyybrid Technology</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-500 inline" />
              </a>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              © {new Date().getFullYear()} Cyybrid Technology. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
