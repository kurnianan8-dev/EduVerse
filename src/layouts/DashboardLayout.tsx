import React, { useState, useEffect } from 'react';
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
  FileText,
} from 'lucide-react';

import { UserAvatar } from '../components/common/UserAvatar';

export interface DashboardOutletContext {
  activeNav: string;
  setActiveNav: (navId: string) => void;
  navTrigger: number;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  basePath: string;
  icon: React.ElementType;
  roles: AppRole[];
  badge?: string;
}

const NAVIGATION_ITEMS: NavItem[] = [
  // Teacher / Guru Navigation
  { id: 'overview', label: 'Dasbor Guru', href: '/dashboard/guru?section=overview', basePath: '/dashboard/guru', icon: LayoutDashboard, roles: ['guru', 'teacher'] },
  { id: 'classes', label: 'Mata Pelajaran Saya', href: '/dashboard/guru?section=classes', basePath: '/dashboard/guru', icon: BookOpen, roles: ['guru', 'teacher'] },
  { id: 'materials', label: 'Materi Pembelajaran', href: '/dashboard/guru?section=materials', basePath: '/dashboard/guru', icon: FileText, roles: ['guru', 'teacher'] },
  { id: 'assignments', label: 'Tugas & Penilaian', href: '/dashboard/guru?section=assignments', basePath: '/dashboard/guru', icon: Award, roles: ['guru', 'teacher'] },
  { id: 'students', label: 'Data Siswa & Presensi', href: '/dashboard/guru?section=students', basePath: '/dashboard/guru', icon: Users, roles: ['guru', 'teacher'] },

  // Student / Siswa Navigation
  { id: 'ruang-belajar', label: 'Ruang Belajar Siswa', href: '/dashboard/siswa?section=ruang-belajar', basePath: '/dashboard/siswa', icon: StudentIcon, roles: ['siswa', 'student'] },
  { id: 'mata-pelajaran', label: 'Mata Pelajaran Diikuti', href: '/dashboard/siswa?section=mata-pelajaran', basePath: '/dashboard/siswa', icon: BookOpen, roles: ['siswa', 'student'] },
];

export const DashboardLayout: React.FC = () => {
  const { user, role, switchRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const defaultNavForRole = role === 'siswa' || role === 'student' ? 'ruang-belajar' : 'overview';
  const [activeNav, setActiveNavState] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('section') || defaultNavForRole;
  });
  const [navTrigger, setNavTrigger] = useState<number>(0);

  const roleStyle = getRoleBadgeStyle(role);

  const filteredNavItems = NAVIGATION_ITEMS.filter((item) => item.roles.includes(role));

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    const validIds = filteredNavItems.map((i) => i.id);
    if (section && validIds.includes(section)) {
      setActiveNavState(section);
    } else if (!validIds.includes(activeNav)) {
      setActiveNavState(defaultNavForRole);
    }
  }, [location.search, role]);

  const handleNavClick = (item: NavItem) => {
    setActiveNavState(item.id);
    setNavTrigger((prev) => prev + 1);
    setMobileMenuOpen(false);
    navigate(item.href);
  };

  const setActiveNav = (navId: string) => {
    const targetItem = filteredNavItems.find((i) => i.id === navId);
    setActiveNavState(navId);
    setNavTrigger((prev) => prev + 1);
    if (targetItem) {
      navigate(targetItem.href);
    }
  };

  const handleRoleSwitch = (newRole: AppRole) => {
    switchRole(newRole);
    navigate(`/dashboard/${newRole.replace('_', '-')}`);
  };

  const isProfilePage = location.pathname.includes('/profile');

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
            </div>
          </Link>
        </div>

        {/* Current Active Role Indicator */}
        <div className="px-4 py-3 mx-4 mt-4 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Peran Akun
          </div>
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
              <Shield className="w-3.5 h-3.5" />
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Menu Navigasi
          </div>
          {filteredNavItems.map((item) => {
            const isActive = !isProfilePage && activeNav === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/25'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Quick Info & Footer */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/30">
          <div className="flex items-center gap-3">
            <UserAvatar src={user?.avatarUrl} name={user?.fullName} size="md" className="border-2 border-blue-500/30" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{ROLE_LABELS[role]}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Topbar Header */}
        <header className="h-16 sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent"
              aria-label="Buka menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base text-foreground">EduVerse</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                {ROLE_LABELS[role]}
              </span>
            </div>
          </div>

          {/* Right Header Action Items */}
          <div className="flex items-center gap-3">
            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-accent transition-colors cursor-pointer"
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
                    <p className="text-[11px] text-muted-foreground truncate">{ROLE_LABELS[role]}</p>
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
                const isActive = !isProfilePage && activeNav === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white bg-card/80 border border-border'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ activeNav, setActiveNav, navTrigger } satisfies DashboardOutletContext} />
        </main>
      </div>
    </div>
  );
};
