import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Award,
  Clock,
  Plus,
  FileText,
  X,
  Edit3,
  Camera,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  UserPlus,
  Upload,
  QrCode,
  Sparkles,
  Paperclip,
  File,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { isMockEnvironment } from '../../config/env';

interface CourseModule {
  id: string;
  code: string;
  name: string;
  students: number;
  term: string;
}

interface ClassItem {
  id: string;
  name: string;
  courseName: string;
  academicYear: string;
}

interface MaterialItem {
  id: string;
  title: string;
  fileType: 'pdf' | 'word' | 'ppt' | 'image' | 'video';
  fileUrl: string;
  fileName?: string;
  description: string;
  className: string;
}

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  className: string;
  fileUrl?: string;
  fileName?: string;
}

interface AttendanceRecord {
  id: string;
  studentName: string;
  jurusan: string;
  qrCode: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  scannedAt: string;
}

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Camera & Scan State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [qrInputManual, setQrInputManual] = useState('');

  // Main Data States
  const [courses, setCourses] = useState<CourseModule[]>([
    { id: 'c1', code: 'FIS-101', name: 'Fisika Kuantum Dasar', students: 34, term: 'Ganjil 2026' },
    { id: 'c2', code: 'MAT-202', name: 'Kalkulus Lanjut', students: 42, term: 'Ganjil 2026' },
  ]);

  const [classes, setClasses] = useState<ClassItem[]>([
    { id: 'cls-1', name: 'Kelas 10 IPA 1', courseName: 'Fisika Kuantum Dasar', academicYear: '2026/2027' },
    { id: 'cls-2', name: 'Kelas 11 IPA 2', courseName: 'Kalkulus Lanjut', academicYear: '2026/2027' },
  ]);

  const [materials, setMaterials] = useState<MaterialItem[]>([
    { id: 'm1', title: 'Slide Bab 1 - Pengantar Dualisme Gelombang (PDF)', fileType: 'pdf', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Dualisme_Gelombang.pdf', description: 'Materi dasar bab 1', className: 'Kelas 10 IPA 1' },
    { id: 'm2', title: 'Video Simulasi Operator Schrödinger', fileType: 'video', fileUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', fileName: 'Schrodinger_Simulasi.mp4', description: 'Simulasi grafik fungsi gelombang', className: 'Kelas 10 IPA 1' },
  ]);

  const [assignments, setAssignments] = useState<AssignmentItem[]>([
    { id: 'a1', title: 'Tugas 1: Laporan Praktikum Interferometer', description: 'Kerjakan secara kelompok dan unggah berkas PDF/DOCX', dueDate: '2026-08-15', className: 'Kelas 10 IPA 1' },
  ]);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    { id: 'att-1', studentName: 'Sophia Taylor', jurusan: 'Teknik Informatika', qrCode: 'EDU-SISWA-001', status: 'Hadir', scannedAt: '08:15 WIB' },
    { id: 'att-2', studentName: 'Budi Pratama', jurusan: 'MIPA 1', qrCode: 'EDU-SISWA-002', status: 'Hadir', scannedAt: '08:22 WIB' },
  ]);

  // Modal Visibility Controls
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);

  // Form Inputs
  const [newCourse, setNewCourse] = useState({ code: '', name: '' });
  const [newClass, setNewClass] = useState({ name: '', courseName: 'Fisika Kuantum Dasar' });
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    fileType: 'pdf' as const,
    fileUrl: '',
    fileName: '',
    description: '',
    className: 'Kelas 10 IPA 1',
  });
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    className: 'Kelas 10 IPA 1',
    fileUrl: '',
    fileName: '',
  });

  // Fetch initial data from Supabase if authenticated
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
              fileType: m.file_type || 'pdf',
              fileUrl: m.file_url,
              description: m.description || '',
              className: 'Kelas 10 IPA 1',
            }))
          );
        }

        const { data: assData } = await supabase.from('assignments').select('*');
        if (assData && assData.length > 0) {
          setAssignments(
            assData.map((a: any) => ({
              id: a.id,
              title: a.title,
              description: a.description || '',
              dueDate: a.due_date ? a.due_date.slice(0, 10) : '2026-08-20',
              className: 'Kelas 10 IPA 1',
            }))
          );
        }
      } catch (err) {
        console.warn('Error fetching initial Supabase data:', err);
      }
    };

    fetchSupabaseData();
  }, []);

  // Camera Helper Functions
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera permission denied or unavailable:', err.message);
      setCameraError('Kamera tidak dapat diakses atau izin ditolak. Silakan gunakan opsi simpan/masukkan QR Code manual di bawah.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (showScanModal) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showScanModal]);

  // 1. Create Course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.code || !newCourse.name) return;

    const obj: CourseModule = {
      id: `c-${Date.now()}`,
      code: newCourse.code,
      name: newCourse.name,
      students: 0,
      term: 'Ganjil 2026',
    };

    setCourses([obj, ...courses]);
    setNewCourse({ code: '', name: '' });
    setShowCourseModal(false);
  };

  // 2. Create Class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name) return;

    const obj: ClassItem = {
      id: `cls-${Date.now()}`,
      name: newClass.name,
      courseName: newClass.courseName,
      academicYear: '2026/2027',
    };

    setClasses([obj, ...classes]);
    setNewClass({ name: '', courseName: 'Fisika Kuantum Dasar' });
    setShowClassModal(false);
  };

  // 3. Material Upload & File Handler (PDF, DOC, DOCX, PPT, PPTX, Gambar, Video)
  const handleMaterialFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      const ext = file.name.split('.').pop()?.toLowerCase();

      let detectedType: 'pdf' | 'word' | 'ppt' | 'image' | 'video' = 'pdf';
      if (ext === 'doc' || ext === 'docx') detectedType = 'word';
      else if (ext === 'ppt' || ext === 'pptx') detectedType = 'ppt';
      else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) detectedType = 'image';
      else if (['mp4', 'avi', 'mkv', 'mov', 'webm'].includes(ext || '')) detectedType = 'video';

      setNewMaterial((prev) => ({
        ...prev,
        title: prev.title || file.name,
        fileName: file.name,
        fileType: detectedType,
        fileUrl: fakeUrl,
      }));
    }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title) return;

    const obj: MaterialItem = {
      id: `m-${Date.now()}`,
      title: newMaterial.title,
      fileType: newMaterial.fileType,
      fileUrl: newMaterial.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: newMaterial.fileName || 'Berkas_Materi.pdf',
      description: newMaterial.description,
      className: newMaterial.className,
    };

    setMaterials([obj, ...materials]);

    if (!isMockEnvironment) {
      await supabase.from('materials').insert({
        title: obj.title,
        file_type: obj.fileType,
        file_url: obj.fileUrl,
        description: obj.description,
      } as any);
    }

    setNewMaterial({ title: '', fileType: 'pdf', fileUrl: '', fileName: '', description: '', className: 'Kelas 10 IPA 1' });
    setShowMaterialModal(false);
  };

  // 4. Assignment Creation & File Attachment
  const handleAssignmentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setNewAssignment((prev) => ({
        ...prev,
        fileName: file.name,
        fileUrl: fakeUrl,
      }));
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title) return;

    const obj: AssignmentItem = {
      id: `a-${Date.now()}`,
      title: newAssignment.title,
      description: newAssignment.description,
      dueDate: newAssignment.dueDate || '2026-08-20',
      className: newAssignment.className,
      fileUrl: newAssignment.fileUrl,
      fileName: newAssignment.fileName,
    };

    setAssignments([obj, ...assignments]);

    if (!isMockEnvironment) {
      await supabase.from('assignments').insert({
        title: obj.title,
        description: obj.description,
        due_date: new Date(obj.dueDate).toISOString(),
      } as any);
    }

    setNewAssignment({ title: '', description: '', dueDate: '', className: 'Kelas 10 IPA 1', fileUrl: '', fileName: '' });
    setShowAssignmentModal(false);
  };

  // 5. Scan QR Code Check-in & Supabase Sync
  const handleScanQrCode = async (scannedCode: string) => {
    if (!scannedCode) return;

    const timestampStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      studentName: scannedCode.includes('EDU-SISWA') ? `Siswa (${scannedCode.slice(0, 14)})` : scannedCode,
      jurusan: 'Teknik Informatika',
      qrCode: scannedCode,
      status: 'Hadir',
      scannedAt: `${timestampStr} WIB`,
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);

    if (!isMockEnvironment) {
      await supabase.from('attendance_records').insert({
        status: 'hadir',
        scanned_at: new Date().toISOString(),
      } as any);
    }

    setQrInputManual('');
    alert(`✅ Absensi Berhasil Discan! Siswa dengan QR ${scannedCode} telah dicatat HADIR.`);
  };

  // 6. Export Attendance to Excel (CSV)
  const handleExportExcel = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Nama Siswa,Jurusan,Kode QR,Status,Waktu Scan']
        .concat(attendanceRecords.map((r) => `"${r.studentName}","${r.jurusan}","${r.qrCode}","${r.status}","${r.scannedAt}"`))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Absensi_EduVerse_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 7. Export Attendance to PDF
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Rekap Absensi Siswa - EduVerse LMS</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
            h2 { color: #0284c7; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; }
          </style>
        </head>
        <body>
          <h2>Laporan Rekap Absensi Siswa EduVerse</h2>
          <p>Tanggal Laporan: ${new Date().toLocaleDateString('id-ID')}</p>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Siswa</th>
                <th>Jurusan</th>
                <th>Kode QR ID</th>
                <th>Status Kehadiran</th>
                <th>Waktu Scan</th>
              </tr>
            </thead>
            <tbody>
              ${attendanceRecords
                .map(
                  (r, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${r.studentName}</td>
                  <td>${r.jurusan}</td>
                  <td>${r.qrCode}</td>
                  <td>${r.status}</td>
                  <td>${r.scannedAt}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Dasbor Guru & Pengajar EduVerse
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold mt-2">
            Selamat Datang, {user?.fullName || 'Prof. Marcus Chen'}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Kelola mata pelajaran, buat kelas, unggah materi (PDF/DOCX/PPTX/Video), buat tugas, dan pindaikan kamera QR Code absensi siswa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCourseModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Mata Pelajaran
          </button>
          <button
            onClick={() => setShowClassModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg shadow-teal-600/30 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Buat Kelas
          </button>
          <button
            onClick={() => setShowScanModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/30 cursor-pointer"
          >
            <Camera className="w-4 h-4" /> Scan QR Absensi
          </button>
        </div>
      </div>

      {/* Action Quick Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setShowMaterialModal(true)}
          className="p-4 rounded-2xl bg-card border border-border hover:border-emerald-500/50 transition-all text-left flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground block">Unggah Materi</span>
            <span className="text-sm font-bold text-foreground">PDF, DOCX, PPTX, Video</span>
          </div>
          <Upload className="w-5 h-5 text-emerald-600" />
        </button>

        <button
          onClick={() => setShowAssignmentModal(true)}
          className="p-4 rounded-2xl bg-card border border-border hover:border-teal-500/50 transition-all text-left flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground block">Buat Tugas Baru</span>
            <span className="text-sm font-bold text-foreground">Lampirkan Berkas</span>
          </div>
          <FileText className="w-5 h-5 text-teal-600" />
        </button>

        <button
          onClick={handleExportExcel}
          className="p-4 rounded-2xl bg-card border border-border hover:border-emerald-500/50 transition-all text-left flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground block">Ekspor Absensi</span>
            <span className="text-sm font-bold text-foreground">File Excel (.CSV)</span>
          </div>
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
        </button>

        <button
          onClick={handleExportPDF}
          className="p-4 rounded-2xl bg-card border border-border hover:border-rose-500/50 transition-all text-left flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground block">Cetak Laporan</span>
            <span className="text-sm font-bold text-foreground">Dokumen PDF</span>
          </div>
          <Download className="w-5 h-5 text-rose-600" />
        </button>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Mata Pelajaran, Kelas, & Materi */}
        <div className="space-y-6">
          {/* Mata Pelajaran Catalog */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" /> Mata Pelajaran Saya ({courses.length})
              </h3>
              <button onClick={() => setShowCourseModal(true)} className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
                + Tambah
              </button>
            </div>
            <div className="space-y-3">
              {courses.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase font-mono">{c.code}</span>
                    <h4 className="font-bold text-sm text-foreground">{c.name}</h4>
                    <p className="text-xs text-muted-foreground">{c.term}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Daftar Kelas */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" /> Kelas & Rombel ({classes.length})
              </h3>
              <button onClick={() => setShowClassModal(true)} className="text-xs font-bold text-teal-600 hover:underline cursor-pointer">
                + Buat Kelas
              </button>
            </div>
            <div className="space-y-3">
              {classes.map((cls) => (
                <div key={cls.id} className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{cls.name}</h4>
                    <p className="text-xs text-muted-foreground">{cls.courseName} • Tahun Ajaran {cls.academicYear}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-500/10 text-teal-600">
                    Terdaftar
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Materi Pembelajaran yang Diunggah */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" /> Materi Pembelajaran ({materials.length})
              </h3>
              <button onClick={() => setShowMaterialModal(true)} className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
                + Unggah Materi
              </button>
            </div>
            <div className="space-y-3">
              {materials.map((m) => (
                <div key={m.id} className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {m.fileType}
                    </span>
                    <h4 className="font-bold text-sm text-foreground mt-1">{m.title}</h4>
                    <p className="text-xs text-muted-foreground">{m.description || m.fileName}</p>
                  </div>
                  <a
                    href={m.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-accent hover:bg-muted text-foreground transition-colors cursor-pointer"
                    title="Unduh Berkas"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Absensi Siswa, Kamera QR, & Tugas */}
        <div className="space-y-6">
          {/* Sesi Absensi & Kamera QR */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-600" /> Rekap Absensi & QR Code Siswa
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Pemindaian QR Kamera perangkat & Penyimpanan otomatis ke Supabase.</p>
              </div>
              <button
                onClick={() => setShowScanModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" /> Pindai Kamera
              </button>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="p-2.5">Siswa</th>
                    <th className="p-2.5">Kode QR</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendanceRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="p-2.5 font-bold text-foreground">{r.studentName}</td>
                      <td className="p-2.5 font-mono text-amber-600">{r.qrCode}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-muted-foreground">{r.scannedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button onClick={handleExportExcel} className="flex-1 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-600 text-xs font-bold border border-emerald-500/30 transition-all cursor-pointer">
                📄 Unduh Excel (.CSV)
              </button>
              <button onClick={handleExportPDF} className="flex-1 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600 hover:text-white text-rose-600 text-xs font-bold border border-rose-500/30 transition-all cursor-pointer">
                📑 Cetak PDF
              </button>
            </div>
          </div>

          {/* Tasks & Assignments */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" /> Daftar Tugas Dibuat ({assignments.length})
              </h3>
              <button onClick={() => setShowAssignmentModal(true)} className="text-xs font-bold text-teal-600 hover:underline cursor-pointer">
                + Buat Tugas
              </button>
            </div>
            <div className="space-y-3">
              {assignments.map((a) => (
                <div key={a.id} className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{a.title}</h4>
                    <p className="text-xs text-muted-foreground">{a.description} • Tenggat: {a.dueDate}</p>
                    {a.fileName && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-teal-400 mt-1">
                        <Paperclip className="w-3 h-3" /> {a.fileName}
                      </span>
                    )}
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-500/10 text-teal-600">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Camera QR Scan & Device Video Stream */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-border pb-3 text-left">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-600" /> Pindai QR Code Absensi Siswa
              </h3>
              <button onClick={() => setShowScanModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Element connected to device camera */}
            <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-amber-500/50 aspect-video flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 space-y-2 text-center bg-black/80">
                  <Camera className="w-10 h-10 text-amber-500 animate-pulse" />
                  <p className="text-xs text-slate-300">Menghubungkan ke Kamera Perangkat...</p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="space-y-2 text-left pt-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Masukkan / Deteksi Kode QR Siswa</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: EDU-SISWA-001"
                  value={qrInputManual}
                  onChange={(e) => setQrInputManual(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={() => {
                    handleScanQrCode(qrInputManual || 'EDU-SISWA-SCAN-001');
                    setShowScanModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer"
                >
                  Absenkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Course */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Buat Mata Pelajaran Baru</h3>
              <button onClick={() => setShowCourseModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Kode Pelajaran (contoh: FIS-101)"
                value={newCourse.code}
                onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <input
                type="text"
                required
                placeholder="Nama Mata Pelajaran"
                value={newCourse.name}
                onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer">
                Simpan Mata Pelajaran
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Class */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Buat Kelas Baru</h3>
              <button onClick={() => setShowClassModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Nama Kelas (contoh: Kelas 10 IPA 1)"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <select
                value={newClass.courseName}
                onChange={(e) => setNewClass({ ...newClass, courseName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
                ))}
              </select>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow cursor-pointer">
                Simpan Kelas
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Material with PDF/DOC/DOCX/PPT/PPTX/Image/Video file input */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" /> Unggah Berkas Materi Pembelajaran
              </h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUploadMaterial} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Pilih Berkas (PDF, DOC, DOCX, PPT, PPTX, Gambar, Video)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,image/*,video/*"
                  onChange={handleMaterialFileChange}
                  className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                />
              </div>

              <input
                type="text"
                required
                placeholder="Judul Materi"
                value={newMaterial.title}
                onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newMaterial.fileType}
                  onChange={(e) => setNewMaterial({ ...newMaterial, fileType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="pdf">Format PDF</option>
                  <option value="word">Format Word (DOC/DOCX)</option>
                  <option value="ppt">Format PPT/PPTX</option>
                  <option value="image">Format Gambar</option>
                  <option value="video">Format Video</option>
                </select>
                <input
                  type="text"
                  placeholder="URL File / Link Supabase Storage"
                  value={newMaterial.fileUrl}
                  onChange={(e) => setNewMaterial({ ...newMaterial, fileUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <textarea
                rows={2}
                placeholder="Deskripsi singkat materi..."
                value={newMaterial.description}
                onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer">
                Unggah & Simpan ke Supabase
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Assignment with File Attachment */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" /> Buat Tugas Pembelajaran
              </h3>
              <button onClick={() => setShowAssignmentModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAssignment} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Judul Tugas"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              />

              <textarea
                rows={3}
                placeholder="Petunjuk & Deskripsi Tugas..."
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              />

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Lampirkan Berkas Soal/Panduan (Opsional)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                  onChange={handleAssignmentFileChange}
                  className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Tenggat Waktu Pengumpulan</label>
                <input
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <button type="submit" className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow cursor-pointer">
                Terbitkan Tugas Ke Supabase
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
