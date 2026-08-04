import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BookOpen,
  Award,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  PlayCircle,
  FileCheck,
  QrCode,
  Download,
  Upload,
  FileText,
  Video,
  File,
  Send,
  Paperclip
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { isMockEnvironment } from '../../config/env';
import { QRCodeSVG } from 'qrcode.react';

interface StudentMaterial {
  id: string;
  title: string;
  subject: string;
  fileType: 'pdf' | 'word' | 'ppt' | 'image' | 'video';
  fileUrl: string;
  description: string;
}

interface StudentAssignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'Belum Dikumpulkan' | 'Sudah Dikumpulkan';
  description: string;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'qr' | 'materi' | 'tugas'>('qr');
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionFileUrl, setSubmissionFileUrl] = useState('');
  const [submissionFileName, setSubmissionFileName] = useState('');
  const [submittedList, setSubmittedList] = useState<string[]>(['sa2']);

  const [materials, setMaterials] = useState<StudentMaterial[]>([
    { id: 'sm1', title: 'Slide Bab 1 - Dualisme Gelombang & Partikel (PDF)', subject: 'Fisika Kuantum', fileType: 'pdf', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', description: 'Materi pengantar bab 1' },
    { id: 'sm2', title: 'Modul Praktikum Interferometri Laser (Word)', subject: 'Fisika Kuantum', fileType: 'word', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', description: 'Panduan eksperimen laboratorium' },
    { id: 'sm3', title: 'Video Penjelasan Operator Schrödinger', subject: 'Fisika Kuantum', fileType: 'video', fileUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', description: 'Simulasi grafik fungsi gelombang' },
  ]);

  const [assignments, setAssignments] = useState<StudentAssignment[]>([
    { id: 'sa1', title: 'Tugas 1: Laporan Praktikum Dualisme', subject: 'Fisika Kuantum', dueDate: 'Besok, 23.59 WIB', status: 'Belum Dikumpulkan', description: 'Buat laporan ringkas dalam format PDF/DOCX.' },
    { id: 'sa2', title: 'Tugas 2: Soal Persamaan Diferensial', subject: 'Kalkulus Lanjut', dueDate: '18 Agt 2026', status: 'Sudah Dikumpulkan', description: 'Kerjakan soal 1 sampai 10.' },
  ]);

  const studentQrCode = user?.qrCode || `EDU-SISWA-${user?.id?.slice(0, 8) || '004'}`;
  const studentJurusan = user?.jurusan || 'Teknik Informatika';

  // Fetch materials & assignments from Supabase if authenticated
  useEffect(() => {
    if (isMockEnvironment) return;

    const fetchSupabaseData = async () => {
      try {
        const { data: matData } = await supabase.from('materials').select('*');
        if (matData && matData.length > 0) {
          setMaterials(
            matData.map((m: any) => ({
              id: m.id,
              title: m.title,
              subject: 'Fisika Kuantum',
              fileType: m.file_type || 'pdf',
              fileUrl: m.file_url,
              description: m.description || '',
            }))
          );
        }

        const { data: assData } = await supabase.from('assignments').select('*');
        if (assData && assData.length > 0) {
          setAssignments(
            assData.map((a: any) => ({
              id: a.id,
              title: a.title,
              subject: 'Fisika Kuantum',
              dueDate: a.due_date ? a.due_date.slice(0, 10) : '2026-08-20',
              status: 'Belum Dikumpulkan',
              description: a.description || '',
            }))
          );
        }
      } catch (err) {
        console.warn('Error fetching student data:', err);
      }
    };

    fetchSupabaseData();
  }, []);

  const handleSubmissionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setSubmissionFileUrl(fakeUrl);
      setSubmissionFileName(file.name);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setSubmittedList((prev) => [...prev, selectedAssignment.id]);

    if (!isMockEnvironment) {
      await supabase.from('submissions').insert({
        assignment_id: selectedAssignment.id.startsWith('sa') ? null : selectedAssignment.id,
        student_id: user?.id,
        file_url: submissionFileUrl || 'https://supabase.com/file-jawaban-siswa.pdf',
        notes: submissionNotes,
      } as any);
    }

    alert(`✅ Tugas "${selectedAssignment.title}" berhasil dikumpulkan dan tersimpan di Supabase!`);
    setSelectedAssignment(null);
    setSubmissionNotes('');
    setSubmissionFileUrl('');
    setSubmissionFileName('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-orange-900 via-amber-900 to-slate-900 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">
              Ruang Belajar Siswa EduVerse
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
              <Flame className="w-4 h-4 text-orange-500" /> 12 Hari Beruntun Belajar!
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold mt-2">
            Selamat Datang, {user?.fullName || 'Sophia Taylor'}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Jurusan: <strong className="text-amber-300">{studentJurusan}</strong> • QR Code Siswa Aktif
          </p>
        </div>
        <button
          onClick={() => setActiveTab('qr')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold shadow-lg shadow-orange-600/30 cursor-pointer transition-all self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4" /> QR Code Saya
        </button>
      </div>

      {/* Main Tab Navigation Buttons */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('qr')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'qr'
              ? 'bg-orange-600 text-white shadow'
              : 'bg-card text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          <QrCode className="w-4 h-4" /> QR Code Presensi Saya
        </button>
        <button
          onClick={() => setActiveTab('materi')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'materi'
              ? 'bg-orange-600 text-white shadow'
              : 'bg-card text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Materi Pembelajaran
        </button>
        <button
          onClick={() => setActiveTab('tugas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'tugas'
              ? 'bg-orange-600 text-white shadow'
              : 'bg-card text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          <FileCheck className="w-4 h-4" /> Tugas & Pengumpulkan
        </button>
      </div>

      {/* Tab 1: QR Code Saya */}
      {activeTab === 'qr' && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm max-w-lg mx-auto text-center space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center justify-center gap-2">
            <QrCode className="w-5 h-5 text-orange-600" /> Kartu Identitas & QR Code Absensi Siswa
          </h3>
          <p className="text-xs text-muted-foreground">Tunjukkan QR Code ini kepada Guru saat sesi absensi kelas berlangsung.</p>

          <div className="p-6 rounded-2xl bg-white text-slate-900 space-y-3 shadow-xl inline-block w-full border border-slate-200">
            <div className="flex justify-center py-2">
              <QRCodeSVG value={studentQrCode} size={220} level="H" includeMargin={true} />
            </div>
            <div className="border-t border-slate-200 pt-3 text-center space-y-1">
              <p className="font-bold text-lg text-slate-900">{user?.fullName || 'Sophia Taylor'}</p>
              <p className="text-xs text-slate-600 font-medium">Jurusan: {studentJurusan}</p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-orange-100 text-orange-700">
                {studentQrCode}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Melihat & Mengunduh Materi */}
      {activeTab === 'materi' && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-600" /> Materi Pembelajaran Kelas ({materials.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((m) => (
              <div key={m.id} className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/10 text-orange-600 border border-orange-500/20">
                      {m.fileType}
                    </span>
                    <span className="text-xs text-muted-foreground">{m.subject}</span>
                  </div>
                  <h4 className="font-bold text-sm text-foreground">{m.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                  <a
                    href={m.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh / Lihat Berkas
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Mengumpulkan Tugas */}
      {activeTab === 'tugas' && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-orange-600" /> Daftar Tugas & Status Pengumpulkan
          </h3>
          <div className="space-y-3">
            {assignments.map((a) => {
              const isSubmitted = submittedList.includes(a.id);
              return (
                <div key={a.id} className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-orange-600">{a.subject}</span>
                      <span className="text-xs text-muted-foreground">• Batas Waktu: {a.dueDate}</span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground mt-0.5">{a.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                  </div>
                  <div>
                    {isSubmitted ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Dikumpulkan
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedAssignment(a)}
                        className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Kumpulkan Tugas
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Form Pengumpulkan Tugas dengan Upload Berkas Jawaban */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Pengumpulan Tugas Siswa</h3>
              <button onClick={() => setSelectedAssignment(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 bg-muted/40 p-3 rounded-xl text-xs">
              <p className="font-bold text-foreground">{selectedAssignment.title}</p>
              <p className="text-muted-foreground">{selectedAssignment.description}</p>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Unggah Berkas Jawaban (PDF, DOCX, PPTX, Gambar)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                  onChange={handleSubmissionFileChange}
                  className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-600 file:text-white hover:file:bg-orange-500 cursor-pointer"
                />
                {submissionFileName && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-orange-400 mt-1">
                    <Paperclip className="w-3 h-3" /> Berkas Terpilih: {submissionFileName}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Atau Masukkan URL File / Link Tugas</label>
                <input
                  type="text"
                  placeholder="https://supabase-storage.com/jawaban-siswa.pdf"
                  value={submissionFileUrl}
                  onChange={(e) => setSubmissionFileUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Catatan / Keterangan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan untuk guru..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Kirim Tugas Ke Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
