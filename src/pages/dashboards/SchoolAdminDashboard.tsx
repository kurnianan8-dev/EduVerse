import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  UserPlus,
  Calendar,
  Award,
  Search,
  CheckCircle2,
  X,
  Shield,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppRole, ROLE_LABELS } from '../../types/auth.types';

interface SchoolUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  department: string;
  status: 'Aktif' | 'Cuti';
}

const INITIAL_USERS: SchoolUser[] = [
  { id: 'usr-1', name: 'Prof. Marcus Chen', email: 'm.chen@horizonacademy.edu', role: 'teacher', department: 'Fisika & Astronomi', status: 'Aktif' },
  { id: 'usr-2', name: 'Sophia Taylor', email: 'sophia.taylor@student.eduverse.io', role: 'student', department: 'Kelas 11-A', status: 'Aktif' },
  { id: 'usr-3', name: 'David Taylor', email: 'david.taylor@gmail.com', role: 'student', department: 'Siswa Kelas 10-A', status: 'Aktif' },
  { id: 'usr-4', name: 'Dr. Sarah Lin', email: 's.lin@horizonacademy.edu', role: 'teacher', department: 'Matematika', status: 'Aktif' },
  { id: 'usr-5', name: 'Ethan Vance', email: 'e.vance@student.eduverse.io', role: 'student', department: 'Kelas 12-B', status: 'Aktif' },
];

const DEPARTMENTS = [
  { name: 'Fisika & Astronomi', head: 'Prof. Marcus Chen', courses: 14, teachers: 8 },
  { name: 'Matematika & Statistika', head: 'Dr. Sarah Lin', courses: 18, teachers: 12 },
  { name: 'Ilmu Komputer & Kecerdasan Buatan', head: 'Dr. Alan Turing', courses: 22, teachers: 16 },
  { name: 'Humaniora & Sastra', head: 'Prof. Eleanor Vance', courses: 12, teachers: 7 },
];

export const SchoolAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [usersList, setUsersList] = useState<SchoolUser[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'teacher' as AppRole, department: '' });

  const path = location.pathname;
  const isUsersTab = path.includes('/users');
  const isDeptsTab = path.includes('/departments');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const userObj: SchoolUser = {
      id: `usr-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department || 'Tenaga Pengajar Umum',
      status: 'Aktif',
    };

    setUsersList([userObj, ...usersList]);
    setNewUser({ name: '', email: '', role: 'teacher', department: '' });
    setShowUserModal(false);
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-sky-900 via-blue-900 to-slate-900 text-white shadow-xl">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            {user?.schoolName || 'Akademi Internasional Horizon'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold mt-2">
            {isUsersTab
              ? 'Manajemen Pengguna & Peran Akun'
              : isDeptsTab
              ? 'Departemen Akademik & Kelas'
              : 'Konsol Administrasi Sekolah'}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            {isUsersTab
              ? 'Pendaftaran akun guru, kelola siswa terdaftar, dan hubungkan portal orang tua.'
              : isDeptsTab
              ? 'Organisasi departemen fakultas, kurikulum pelajaran, dan jadwal kelas.'
              : 'Kelola akun staf, pendaftaran siswa, departemen, dan kalender akademik.'}
          </p>
        </div>
        <button
          onClick={() => setShowUserModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-lg shadow-sky-600/30 transition-all self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Tambah Akun Pengguna
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Siswa Terdaftar</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display mt-3">2.840 Siswa</div>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Tahun Ajaran 2026-2027</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tenaga Pengajar (Guru)</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display mt-3">142 Guru</div>
          <span className="text-xs text-muted-foreground font-medium mt-1 inline-block">12 Departemen</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Mata Pelajaran Aktif</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display mt-3">86 Mata Pelajaran</div>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Seluruh kurikulum diverifikasi</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Akun Orang Tua Terhubung</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display mt-3">2.150</div>
          <span className="text-xs text-muted-foreground font-medium mt-1 inline-block">75% Keterlibatan orang tua</span>
        </div>
      </div>

      {/* Sub-route View */}
      {isUsersTab ? (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" /> Direktori Akun Sekolah Aktif ({filteredUsers.length})
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama pengguna atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="p-3">Nama Pengguna</th>
                  <th className="p-3">Alamat Email</th>
                  <th className="p-3">Peran</th>
                  <th className="p-3">Departemen / Kelas</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-bold text-foreground">{u.name}</td>
                    <td className="p-3 text-muted-foreground font-mono">{u.email}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-600 border border-sky-500/20">
                        <Shield className="w-3 h-3" /> {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="p-3 text-foreground">{u.department}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" /> {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : isDeptsTab ? (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Fakultas & Departemen Akademik
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEPARTMENTS.map((dept, i) => (
              <div key={i} className="p-5 rounded-xl bg-muted/30 border border-border/70 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-sky-600" /> {dept.name}
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-500/10 text-indigo-600">
                    Departemen Aktif
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Kepala Departemen: <strong className="text-foreground">{dept.head}</strong></p>
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <span className="text-muted-foreground">{dept.courses} Mata Pelajaran Aktif</span>
                  <span className="text-muted-foreground">{dept.teachers} Anggota Pengajar</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Overview Operations */
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground">Operasi Kontrol Administrasi Sekolah</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/80 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-sky-600" />
                <h4 className="font-bold text-sm text-foreground">Manajemen Pengguna</h4>
              </div>
              <p className="text-xs text-muted-foreground">Tambah akun guru, tempatkan siswa ke kelas, dan hubungkan orang tua.</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/80 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-sm text-foreground">Konfigurasi Departemen</h4>
              </div>
              <p className="text-xs text-muted-foreground">Organisasikan fakultas Sains, Matematika, dan Bahasa.</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/80 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm text-foreground">Jadwal Semester Akademik</h4>
              </div>
              <p className="text-xs text-muted-foreground">Atur periode ujian, tanggal mulai/selesai semester, dan libur.</p>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-600" /> Tambah Akun Pengguna Baru
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dr. Robert Vance"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Alamat Email</label>
                <input
                  type="email"
                  required
                  placeholder="r.vance@horizonacademy.edu"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Pilih Peran</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as AppRole })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="teacher">Guru</option>
                    <option value="student">Siswa</option>
                    <option value="parent">Orang Tua</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Dept / Kelas</label>
                  <input
                    type="text"
                    placeholder="Contoh: Fisika"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 cursor-pointer"
                >
                  Buat Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
