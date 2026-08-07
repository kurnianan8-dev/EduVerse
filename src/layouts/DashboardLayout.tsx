import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppRole, ROLE_LABELS } from '../types/auth.types';
import { getRoleBadgeStyle } from '../lib/utils';
import {
  GraduationCap,
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  GraduationCap as StudentIcon,
  UserCheck,
  Award,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Shield,
  Clock,
  User,
} from 'lucide-react';

import { UserAvatar } from '../components/common/UserAvatar';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: AppRole[];
  badge?: string;
}

const NAVIGATION_ITEMS: NavItem[] = [
  // Teacher / Guru Navigation
  { label: 'Dasbor Guru', href: '/dashboard/guru', icon: LayoutDashboard, roles: ['guru', 'teacher'] },
  { label: 'Mata Pelajaran Saya', href: '/dashboard/guru', icon: BookOpen, roles: ['guru', 'teacher'] },

  // Student / Siswa Navigation
  { label: 'Ruang Belajar Siswa', href: '/dashboard/siswa', icon: StudentIcon, roles: ['siswa', 'student'] },
  { label: 'Mata Pelajaran Diikuti', href: '/dashboard/siswa', icon: BookOpen, roles: ['siswa', 'student'] },
];

export const DashboardLayout: React.FC = () => {
  const { user, role, switchRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const roleStyle = getRoleBadgeStyle(role);

  const filteredNavItems = NAVIGATION_ITEMS.filter((item) => item.roles.includes(role));

  const handleRoleSwitch = (newRole: AppRole) => {
    switchRole(newRole);
    navigate(`/dashboard/${newRole.replace('_', '-')}`);
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 z-30 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-xl">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight text-white">EduVerse</span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-blue-400">Platform LMS</span>
            </div>
          </Link>
        </div>

        {/* Current Active Role Indicator */}
        <div className="px-4 py-3 mx-4 mt-4 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Peran Kerja Saat Ini
          </div>
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
              <Shield className="w-3.5 h-3.5" />
              {ROLE_LABELS[role]}
            </span>
            <span className="text-[11px] text-blue-400 font-mono">RBAC Aktif</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Menu Navigasi
          </div>
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20'
                    : 'text-slate-300 hover:bg-sidebar-accent hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Quick Info & Footer */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/30">
          <div className="flex items-center gap-3">
            <UserAvatar src={user?.avatarUrl} name={user?.fullName} size="md" className="border-2 border-blue-500/30" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Topbar Header */}
        <header className="h-16 sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent"
              aria-label="Buka menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Quick Search */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 text-muted-foreground border border-border/50 text-xs w-64">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span>Cari mata pelajaran, pengguna, jadwal...</span>
            </div>
          </div>

          {/* Right Header Action Items */}
          <div className="flex items-center gap-3">

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors" title="Notifikasi">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-accent transition-colors"
              >
                <UserAvatar src={user?.avatarUrl} name={user?.fullName} size="sm" />
                <span className="hidden sm:inline text-xs font-semibold text-foreground">
                  {user?.fullName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-border shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-xs font-bold text-foreground truncate">{user?.fullName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/dashboard/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <User className="w-4 h-4 text-muted-foreground" /> Lihat Profil
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-md flex flex-col pt-16 px-6 pb-6">
            <nav className="space-y-2 flex-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold bg-accent text-foreground"
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
