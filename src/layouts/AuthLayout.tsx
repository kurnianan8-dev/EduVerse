import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 selection:text-blue-200 relative overflow-hidden">
      {/* Dynamic Glowing Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Left Hero Branding Section */}
      <div className="flex-1 p-8 md:p-16 flex flex-col justify-between relative z-10 border-b md:border-b-0 md:border-r border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-950/90 backdrop-blur-xl">
        <div>
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-2xl tracking-tight text-white">EduVerse</span>
              <span className="block text-xs font-semibold uppercase tracking-wider text-blue-400">Enterprise LMS</span>
            </div>
          </Link>

          <div className="mt-16 space-y-6 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-300">
              <Sparkles className="w-3.5 h-3.5" /> Next-Generation Learning Ecosystem
            </div>

            <h1 className="text-3xl md:text-5xl font-display font-extrabold text-white leading-tight tracking-tight">
              Empowering Education Across Every Role.
            </h1>

            <p className="text-slate-400 text-base leading-relaxed">
              Unified platform architecture connecting Super Admins, School Administrators, Teachers, Students, and Parents in a secure realtime environment.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-4 mt-12 pt-8 border-t border-slate-800/80">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Strict RBAC & RLS</h4>
              <p className="text-xs text-slate-400">Multi-tenant data isolation</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">5 Distinct Roles</h4>
              <p className="text-xs text-slate-400">Custom tailored experience</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-slate-500">
          © {new Date().getFullYear()} EduVerse Platform Inc. All rights reserved.
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10 bg-slate-950/60 backdrop-blur-md">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
