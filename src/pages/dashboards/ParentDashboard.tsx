import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  UserCheck,
  Award,
  Clock,
  Bell,
  MessageSquare,
  CheckCircle2,
  X,
  Send,
  Calendar as CalendarIcon,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [selectedChild, setSelectedChild] = useState('Sophia Taylor (Kelas 11-A)');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [noteSubject, setNoteSubject] = useState('');
  const [noteBody, setNoteBody] = useState('');

  const path = location.pathname;
  const isAttendanceTab = path.includes('/attendance');
  const isReportsTab = path.includes('/reports');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody) return;
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setShowMessageModal(false);
      setNoteSubject('');
      setNoteBody('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-amber-900 via-orange-900 to-slate-900 text-white shadow-xl">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Portal Pemantauan Orang Tua
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold mt-2">
            {isAttendanceTab
              ? 'Presensi Harian & Catatan Kehadiran'
              : isReportsTab
              ? 'Rapor Akademik & Transkrip Hasil Belajar'
              : `Selamat Datang, ${user?.fullName || 'David Taylor'}`}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            {isAttendanceTab
              ? 'Pantau jam kehadiran harian, kirim surat izin/sakit, dan tinjau persentase kehadiran bulanan.'
              : isReportsTab
              ? 'Rapor resmi semester, pencapaian nilai, dan catatan perkembangan dari guru.'
              : 'Dapatkan informasi perkembangan akademik anak Anda, kehadiran harian, dan pengumuman sekolah.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-200">Anak Terhubung:</span>
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-xs font-bold text-white cursor-pointer focus:outline-none"
          >
            <option>Sophia Taylor (Kelas 11-A)</option>
            <option>Lucas Taylor (Kelas 8-C)</option>
          </select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tingkat Presensi / Kehadiran</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display mt-3">98,5%</div>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">100/102 Hari Hadir</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Rata-rata Nilai Semester</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display mt-3">94,8 (A)</div>
          <span className="text-xs text-amber-600 font-medium mt-1 inline-block">5% Terbaik di Kelas</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pertemuan Wali Murid & Guru</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display mt-3">Jumat, 15 Agt</div>
          <span className="text-xs text-sky-600 font-medium mt-1 inline-block">Jadwal dikonfirmasi</span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pengumuman Sekolah</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display mt-3">2 Baru</div>
          <span className="text-xs text-purple-600 font-medium mt-1 inline-block">Informasi Kegiatan Semester</span>
        </div>
      </div>

      {/* Sub-view switcher */}
      {isAttendanceTab ? (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600" /> Catatan Presensi untuk {selectedChild}
            </h3>
            <button
              onClick={() => setShowMessageModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Kirim Surat Izin / Sakit
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="block text-2xl font-bold text-emerald-600">100</span>
              <span className="text-xs text-muted-foreground font-semibold">Hari Hadir</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="block text-2xl font-bold text-amber-600">2</span>
              <span className="text-xs text-muted-foreground font-semibold">Izin / Sakit</span>
            </div>
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="block text-2xl font-bold text-rose-600">0</span>
              <span className="text-xs text-muted-foreground font-semibold">Tanpa Keterangan</span>
            </div>
            <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <span className="block text-2xl font-bold text-sky-600">1</span>
              <span className="text-xs text-muted-foreground font-semibold">Terlambat</span>
            </div>
          </div>
        </div>
      ) : (
        /* Academic Results / Report Cards */
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-600" /> Hasil Belajar Akademik untuk {selectedChild}
            </h3>
            <button
              onClick={() => setShowMessageModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-500 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" /> Pesan Wali Kelas
            </button>
          </div>

          <div className="space-y-3">
            {[
              { subject: 'Fisika Kuantum Dasar', grade: '96 / 100 (A+)', remark: 'Penalaran analitis sangat baik pada materi gelombang.' },
              { subject: 'Aljabar Linier & Kalkulus', grade: '93 / 100 (A)', remark: 'Performa konsisten dan pemahaman matriks sangat baik.' },
              { subject: 'Arsitektur Sistem Komputer', grade: '89 / 100 (B+)', remark: 'Sangat aktif selama praktikum sistem operasi.' },
            ].map((r, i) => (
              <div key={i} className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{r.subject}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.remark}</p>
                </div>
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {r.grade}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-600" /> Kirim Pesan / Catatan ke Wali Kelas
              </h3>
              <button onClick={() => setShowMessageModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {messageSent ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-foreground">Pesan Berhasil Terkirim!</h4>
                <p className="text-xs text-muted-foreground">Prof. Marcus Chen telah menerima notifikasi Anda.</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Subjek / Perihal</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Surat Izin Sakit atau Pertanyaan Akademik"
                    value={noteSubject}
                    onChange={(e) => setNoteSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Isi Pesan</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tuliskan pesan Anda kepada wali kelas..."
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Kirim Pesan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
