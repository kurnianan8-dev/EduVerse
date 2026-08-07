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
  Paperclip,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

interface StudentMaterial {
  id: string;
  title: string;
  subject: string;
  fileType: string;
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
  grade?: number;
  feedback?: string;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'qr' | 'materi' | 'tugas'>('qr');
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionFileUrl, setSubmissionFileUrl] = useState('');
  const [submissionFileName, setSubmissionFileName] = useState('');
  const [submittedList, setSubmittedList] = useState<Record<string, { grade?: number; feedback?: string }>>({});

  const [materials, setMaterials] = useState<StudentMaterial[]>([]);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);

  const studentQrCode = user?.qrCode || `EDU-SISWA-${user?.id?.slice(0, 8) || '001'}`;
  const studentJurusan = user?.jurusan || 'Umum';

  // Ensure QR Code exists in Supabase DB for logged in student
  useEffect(() => {
    if (user?.id) {
      ensureStudentQrCodeInSupabase();
    }
  }, [user?.id]);

  const ensureStudentQrCodeInSupabase = async () => {
    if (!user?.id) return;
    try {
      const generatedQr = `EDU-SISWA-${user.id.slice(0, 8)}`;
      const { data: profile } = await supabase.from('profiles').select('qr_code').eq('id', user.id).single();
      console.log('📌 [StudentDashboard] Checking profiles.qr_code in DB:', (profile as any)?.qr_code);
      if (!(profile as any)?.qr_code) {
        console.log('📌 [StudentDashboard] Syncing missing profiles.qr_code in DB to:', generatedQr);
        await (supabase as any).from('profiles').update({ qr_code: generatedQr }).eq('id', user.id);
      }
    } catch (err) {
      console.warn('⚠️ [StudentDashboard] Syncing QR Code to Supabase profile:', err);
    }
  };

  // Fetch materials & assignments from Supabase DB
  useEffect(() => {
    fetchSupabaseData();
  }, []);

  const fetchSupabaseData = async () => {
    try {
      // 1. Fetch Materials from Supabase
      const { data: matData } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
      if (matData) {
        setMaterials(
          matData.map((m: any) => ({
            id: m.id,
            title: m.title,
            subject: 'Pelajaran',
            fileType: m.file_type || 'pdf',
            fileUrl: m.file_url,
            description: m.description || '',
          }))
        );
      }

      // 2. Fetch Submissions submitted by this student to check status, grades, and comments
      const submittedMap: Record<string, { grade?: number; feedback?: string }> = {};
      if (user?.id) {
        const { data: subData } = await supabase.from('submissions').select('assignment_id, grade, feedback').eq('student_id', user.id);
        if (subData) {
          subData.forEach((s: any) => {
            submittedMap[s.assignment_id] = { grade: s.grade, feedback: s.feedback };
          });
          setSubmittedList(submittedMap);
        }
      }

      // 3. Fetch Assignments from Supabase
      const { data: assData } = await supabase.from('assignments').select('*').order('created_at', { ascending: false });
      if (assData) {
        setAssignments(
          assData.map((a: any) => ({
            id: a.id,
            title: a.title,
            subject: 'Pelajaran',
            dueDate: a.due_date ? a.due_date.slice(0, 10) : 'Tanpa Tenggat',
            status: submittedMap[a.id] ? 'Sudah Dikumpulkan' : 'Belum Dikumpulkan',
            description: a.description || '',
            grade: submittedMap[a.id]?.grade,
            feedback: submittedMap[a.id]?.feedback,
          }))
        );
      }
    } catch (err) {
      console.warn('Error fetching student Supabase data:', err);
    }
  };

  // High-Quality PNG Download of Student's QR Code
  const handleDownloadQR = () => {
    const svgElement = document.getElementById('student-qr-svg') as SVGElement | null;
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 800;
      canvas.height = 800;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      const safeName = (user?.fullName || user?.email || 'Siswa').replace(/[^a-zA-Z0-9]/g, '_');
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_Absensi_${safeName}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleSubmissionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      let publicFileUrl = URL.createObjectURL(file);
      try {
        const filePath = `submissions/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('materials')
          .upload(filePath, file);

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage.from('materials').getPublicUrl(filePath);
          if (urlData?.publicUrl) publicFileUrl = urlData.publicUrl;
        }
      } catch (err) {
        console.warn('Storage upload fallback:', err);
      }

      setSubmissionFileUrl(publicFileUrl);
      setSubmissionFileName(file.name);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    try {
      const { data, error } = await supabase.from('submissions').insert({
        assignment_id: selectedAssignment.id,
        student_id: user?.id,
        file_url: submissionFileUrl || 'https://supabase.com/file-jawaban-siswa.pdf',
        notes: submissionNotes,
      } as any).select();

      setSubmittedList((prev) => ({ ...prev, [selectedAssignment.id]: {} }));
      setAssignments((prev) =>
        prev.map((a) => (a.id === selectedAssignment.id ? { ...a, status: 'Sudah Dikumpulkan' } : a))
      );

      alert(`✅ Tugas "${selectedAssignment.title}" berhasil dikumpulkan dan tersimpan di Supabase!`);
      setSelectedAssignment(null);
      setSubmissionNotes('');
      setSubmissionFileUrl('');
      setSubmissionFileName('');
    } catch (err: any) {
      alert(`Gagal mengirimkan tugas: ${err.message}`);
    }
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
              <Flame className="w-4 h-4 text-orange-500" /> Sesi Belajar Aktif
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold mt-2">
            Selamat Datang, {user?.fullName || user?.email || 'Siswa'}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Jurusan: <strong className="text-amber-300">{studentJurusan}</strong> • Email: <strong className="text-amber-300">{user?.email}</strong>
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
          <FileCheck className="w-4 h-4" /> Tugas & Penilaian
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
              <QRCodeSVG
                id="student-qr-svg"
                value={JSON.stringify({
                  app: 'EDUVERSE',
                  type: 'STUDENT_ATTENDANCE_QR',
                  v: '1.0',
                  sid: user?.id || '',
                  code: studentQrCode,
                })}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="border-t border-slate-200 pt-3 text-center space-y-1">
              <p className="font-bold text-lg text-slate-900">{user?.fullName || user?.email || 'Siswa'}</p>
              <p className="text-xs text-slate-600 font-medium">Jurusan: {studentJurusan}</p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-orange-100 text-orange-700">
                {studentQrCode}
              </span>
            </div>
          </div>

          <button
            onClick={handleDownloadQR}
            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download QR Absensi (.PNG)
          </button>
        </div>
      )}

      {/* Tab 2: Melihat & Mengunduh Materi */}
      {activeTab === 'materi' && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-600" /> Materi Pembelajaran Kelas ({materials.length})
          </h3>
          {materials.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">Belum ada materi pembelajaran yang diunggah Guru di Supabase.</p>
          ) : (
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
          )}
        </div>
      )}

      {/* Tab 3: Mengumpulkan Tugas & Melihat Nilai Guru */}
      {activeTab === 'tugas' && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-orange-600" /> Daftar Tugas & Status Penilaian
          </h3>
          {assignments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">Belum ada tugas yang diterbitkan Guru di Supabase.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => {
                const subInfo = submittedList[a.id];
                const isSubmitted = !!subInfo;
                return (
                  <div key={a.id} className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-orange-600">{a.subject}</span>
                        <span className="text-xs text-muted-foreground">• Batas Waktu: {a.dueDate}</span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground mt-0.5">{a.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{a.description}</p>

                      {/* Display Grade and Teacher Feedback */}
                      {subInfo?.grade !== undefined && subInfo?.grade !== null && (
                        <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-bold flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span>Nilai Guru: {subInfo.grade} / 100 {subInfo.feedback ? `• Komentar: "${subInfo.feedback}"` : ''}</span>
                        </div>
                      )}
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
          )}
        </div>
      )}

      {/* Modal: Form Pengumpulan Tugas dengan Upload Berkas Jawaban (Multi-Format) */}
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
                <label className="text-xs font-bold text-muted-foreground uppercase">Unggah Berkas Jawaban (PDF, Word, PPT, Excel, ZIP, RAR, Gambar, Video)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,image/*,video/*"
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
