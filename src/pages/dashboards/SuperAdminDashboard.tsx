import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Building2,
  Users,
  ShieldAlert,
  Activity,
  Plus,
  CheckCircle2,
  Clock,
  Search,
  X,
  Globe,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface SchoolTenant {
  id: string;
  name: string;
  domain: string;
  users: number;
  status: 'Aktif' | 'Pemeliharaan' | 'Pending';
  tier: 'Enterprise' | 'Standar' | 'Dasar';
}

const INITIAL_SCHOOLS: SchoolTenant[] = [
  { id: '1', name: 'Horizon International Academy', domain: 'horizonacademy.edu', users: 3420, status: 'Aktif', tier: 'Enterprise' },
  { id: '2', name: 'SMA Kristen St. Jude', domain: 'stjude.edu.sg', users: 1890, status: 'Aktif', tier: 'Standar' },
  { id: '3', name: 'Institut Teknologi Apex', domain: 'apextech.org', users: 12500, status: 'Aktif', tier: 'Enterprise' },
  { id: '4', name: 'Sekolah Global Oakridge', domain: 'oakridge.edu', users: 950, status: 'Pemeliharaan', tier: 'Standar' },
  { id: '5', name: 'Akademi Lembah Cambridge', domain: 'cambridgevalley.org', users: 2100, status: 'Aktif', tier: 'Standar' },
];

const INITIAL_AUDIT_LOGS = [
  { id: 'log-101', event: 'Akademi Baru Didaftarkan', user: 'superadmin@eduverse.io', entity: 'Akademi Lembah Cambridge', time: '10 menit lalu', status: 'Sukses', ip: '192.168.1.1' },
  { id: 'log-102', event: 'Sinkronisasi Kebijakan Keamanan RLS', user: 'system_daemon', entity: 'Tabel profiles RLS', time: '42 menit lalu', status: 'Sukses', ip: 'internal' },
  { id: 'log-103', event: 'Super Admin Masuk', user: 'superadmin@eduverse.io', entity: 'Layanan Otentikasi', time: '1 jam lalu', status: 'Sukses', ip: '10.0.4.12' },
  { id: 'log-104', event: 'Status Pemeliharaan Diaktifkan', user: 'superadmin@eduverse.io', entity: 'Sekolah Global Oakridge', time: '3 jam lalu', status: 'Peringatan', ip: '192.168.1.1' },
  { id: 'log-105', event: 'Ekspor Log Audit Global', user: 'superadmin@eduverse.io', entity: 'Log Audit Sistem', time: '5 jam lalu', status: 'Sukses', ip: '192.168.1.1' },
];

export const SuperAdminDashboard: React.FC = () => {
  const location = useLocation();
  const [schools, setSchools] = useState<SchoolTenant[]>(INITIAL_SCHOOLS);
  const [auditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: '', domain: '', tier: 'Enterprise' as const });

  const path = location.pathname;
  const isSchoolsTab = path.includes('/schools');
  const isAuditTab = path.includes('/audit');

  const handleAddSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.name || !newSchool.domain) return;

    const schoolObj: SchoolTenant = {
      id: String(Date.now()),
      name: newSchool.name,
      domain: newSchool.domain,
      users: 1,
      status: 'Aktif',
      tier: newSchool.tier,
    };
    setSchools([schoolObj, ...schools]);
    setNewSchool({ name: '', domain: '', tier: 'Enterprise' });
    setShowModal(false);
  };

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-900/90 via-indigo-900 to-slate-900 text-white shadow-xl">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Konsol Pengawas Utama Platform
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold mt-2">
            {isSchoolsTab
              ? 'Manajemen Sekolah & Multi-Akademi'
              : isAuditTab
              ? 'Log Audit Infrastruktur Global'
              : 'Ringkasan Platform Super Admin'}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            {isSchoolsTab
              ? 'Kelola, konfigurasi, dan pantau lingkungan sekolah yang terisolasi.'
              : isAuditTab
              ? 'Pemantauan aktivitas keamanan, log otentikasi, dan verifikasi aturan RLS secara real-time.'
              : 'Pendaftaran sekolah, metrik global platform, dan status kesehatan infrastruktur.'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Daftarkan Sekolah Baru
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Sekolah / Akademi Aktif</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display mt-3">{schools.length} Sekolah</div>
          <span className="inline-flex items-center text-xs text-emerald-600 font-medium mt-1">
            +3 didaftarkan bulan ini
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Pengguna Platform</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display mt-3">
            {schools.reduce((acc, curr) => acc + curr.users, 0).toLocaleString('id-ID')}
          </div>
          <span className="inline-flex items-center text-xs text-emerald-600 font-medium mt-1">
            Di 5 Peran Pengguna
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Ketersediaan Infrastruktur</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display mt-3">99.98%</div>
          <span className="inline-flex items-center text-xs text-emerald-600 font-medium mt-1">
            Supabase Realtime & RLS Aktif
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Peringatan Sistem</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display mt-3">0 Kritis</div>
          <span className="inline-flex items-center text-xs text-muted-foreground font-medium mt-1">
            Semua kebijakan keamanan lolos
          </span>
        </div>
      </div>

      {/* Main View */}
      {isAuditTab ? (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" /> Jejak Audit & Keamanan Platform
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter log berdasarkan aktivitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="p-3">ID Log</th>
                  <th className="p-3">Aktivitas</th>
                  <th className="p-3">Pengguna & IP</th>
                  <th className="p-3">Entitas Sasaran</th>
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-purple-400 font-semibold">{log.id}</td>
                    <td className="p-3 font-bold text-foreground">{log.event}</td>
                    <td className="p-3 text-muted-foreground">
                      <div>{log.user}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.ip}</div>
                    </td>
                    <td className="p-3 text-foreground">{log.entity}</td>
                    <td className="p-3 text-muted-foreground">{log.time}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          log.status === 'Sukses'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}
                      >
                        {log.status === 'Sukses' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-600" /> Daftar Sekolah Terdaftar ({filteredSchools.length})
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama sekolah atau domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSchools.map((school) => (
              <div
                key={school.id}
                className="p-5 rounded-xl bg-muted/30 border border-border/70 flex flex-col justify-between space-y-3 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 flex items-center justify-center font-bold text-lg">
                      {school.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{school.name}</h4>
                      <p className="text-xs text-muted-foreground font-mono">{school.domain}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-purple-500/10 text-purple-600 border border-purple-500/20">
                    {school.tier}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <span className="text-muted-foreground font-medium">
                    <strong className="text-foreground font-semibold">{school.users.toLocaleString('id-ID')}</strong> Pengguna Aktif
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      school.status === 'Aktif'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> {school.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onboard School Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" /> Daftarkan Sekolah / Akademi Baru
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSchool} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Nama Sekolah</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SMA Negeri 1 Jakarta"
                  value={newSchool.name}
                  onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Domain Web Sekolah</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: sman1jakarta.sch.id"
                  value={newSchool.domain}
                  onChange={(e) => setNewSchool({ ...newSchool, domain: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Tingkat Berlangganan</label>
                <select
                  value={newSchool.tier}
                  onChange={(e) => setNewSchool({ ...newSchool, tier: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="Enterprise">Tingkat Enterprise</option>
                  <option value="Standar">Tingkat Standar</option>
                  <option value="Dasar">Tingkat Dasar</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  Simpan & Daftarkan Sekolah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
