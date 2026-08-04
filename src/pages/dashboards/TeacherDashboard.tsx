import React, { useState, useEffect } from 'react';
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
  FileCheck,
  CheckCircle2,
  UserPlus,
  Upload,
  QrCode,
  Sparkles,
  Calendar as CalendarIcon
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
  description: string;
  className: string;
}

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  className: string;
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

  // State Management
  const [courses, setCourses] = useState<CourseModule[]>([
    { id: 'c1', code: 'FIS-101', name: 'Fisika Kuantum Dasar', students: 34, term: 'Ganjil 2026' },
    { id: 'c2', code: 'MAT-202', name: 'Kalkulus Lanjut', students: 42, term: 'Ganjil 2026' },
  ]);

  const [classes, setClasses] = useState<ClassItem[]>([
    { id: 'cls-1', name: 'Kelas 10 IPA 1', courseName: 'Fisika Kuantum Dasar', academicYear: '2026/2027' },
    { id: 'cls-2', name: 'Kelas 11 IPA 2', courseName: 'Kalkulus Lanjut', academicYear: '2026/2027' },
  ]);

  const [materials, setMaterials] = useState<MaterialItem[]>([
    { id: 'm1', title: 'Slide Pertemuan 1 - Pengantar Dualisme Gelombang', fileType: 'pdf', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', description: 'Materi dasar bab 1', className: 'Kelas 10 IPA 1' },
    { id: 'm2', title: 'Video Penjelasan Operator Schrödinger', fileType: 'video', fileUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', description: 'Simulasi persamaan gelombang', className: 'Kelas 10 IPA 1' },
  ]);

  const [assignments, setAssignments] = useState<AssignmentItem[]>([
    { id: 'a1', title: 'Tugas 1: Laporan Praktikum Interferometer', description: 'Kerjakan secara kelompok dan unggah PDF', dueDate: '2026-08-15', className: 'Kelas 10 IPA 1' },
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
  const [newMaterial, setNewMaterial] = useState({ title: '', fileType: 'pdf' as const, fileUrl: '', description: '', className: 'Kelas 10 IPA 1' });
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '', className: 'Kelas 10 IPA 1' });
  const [qrInputManual, setQrInputManual] = useState('');

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

  // 3. Upload Material
  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title) return;

    const obj: MaterialItem = {
      id: `m-${Date.now()}`,
      title: newMaterial.title,
      fileType: newMaterial.fileType,
      fileUrl: newMaterial.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      description: newMaterial.description,
      className: newMaterial.className,
    };

    setMaterials([obj, ...materials]);
    setNewMaterial({ title: '', fileType: 'pdf', fileUrl: '', description: '', className: 'Kelas 10 IPA 1' });
    setShowMaterialModal(false);
  };

  // 4. Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title) return;

    const obj: AssignmentItem = {
      id: `a-${Date.now()}`,
      title: newAssignment.title,
      description: newAssignment.description,
      dueDate: newAssignment.dueDate || '2026-08-20',
      className: newAssignment.className,
    };

    setAssignments([obj, ...assignments]);
    setNewAssignment({ title: '', description: '', dueDate: '', className: 'Kelas 10 IPA 1' });
    setShowAssignmentModal(false);
  };

  // 5. Scan QR Code Check-in
  const handleScanQrCode = (scannedCode: string) => {
    if (!scannedCode) return;

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      studentName: scannedCode.includes('EDU-SISWA') ? 'Siswa Terverifikasi QR' : scannedCode,
      jurusan: 'Teknik Informatika',
      qrCode: scannedCode,
      status: 'Hadir',
      scannedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setAttendanceRecords([newRecord, ...attendanceRecords]);
    setQrInputManual('');
    alert(`✅ Absensi Berhasil Discan! ${scannedCode} tercatat Hadir.`);
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
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { color: #0284c7; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; }
          </style>
        </head>
        <body>
          <h2>Laporan Rekap Absensi Siswa</h2>
          <p>Tanggal Laporan: ${new Date().toLocaleDateString('id-ID')}</p>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Siswa</th>
                <th>Jurusan</th>
                <th>Kode QR ID</th>
                <th>Status</th>
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
            Kelola mata pelajaran, buat kelas, unggah materi/tugas, serta scan QR Code absensi siswa.
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
            <span className="text-sm font-bold text-foreground">PDF, Word, Video</span>
          </div>
          <Upload className="w-5 h-5 text-emerald-600" />
        </button>

        <button
          onClick={() => setShowAssignmentModal(true)}
          className="p-4 rounded-2xl bg-card border border-border hover:border-teal-500/50 transition-all text-left flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground block">Buat Tugas Baru</span>
            <span className="text-sm font-bold text-foreground">Set Batas Waktu</span>
          </div>
          <FileText className="w-5 h-5 text-teal-600" />
        </button>

        <button
          onClick={handleExportExcel}
          className="p-4 rounded-2xl bg-card border border-border hover:border-emerald-500/50 transition-all text-left flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-xs font-semibold text-muted-foreground block">Ekspor Absensi</span>
            <span className="text-sm font-bold text-foreground">File Excel (CSV)</span>
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
        {/* Left Column: Mata Pelajaran & Kelas */}
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
        </div>

        {/* Right Column: Absensi Siswa & QR Scan Rekap */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-600" /> Rekap Absensi & QR Code Siswa
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Pindai QR Code siswa menggunakan kamera atau simulasikan pemindaian.</p>
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
        </div>
      </div>

      {/* Modal: Camera QR Scan & Manual Entry */}
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

            <div className="p-6 rounded-2xl bg-black border-2 border-dashed border-amber-500/50 space-y-3">
              <Camera className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
              <p className="text-xs text-slate-300 font-medium">Arahkan Kamera HP / Webcam ke QR Code Siswa</p>
              <span className="inline-block px-3 py-1 rounded-full text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Kamera Aktif & Siap Memindai
              </span>
            </div>

            <div className="space-y-2 text-left pt-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Atau Masukkan Kode QR Manual</label>
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
                    handleScanQrCode(qrInputManual || 'EDU-SISWA-DEMO');
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
                placeholder="Nama Kelas (contoh: Kelas 10-A)"
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

      {/* Modal: Upload Material */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Unggah Materi Pembelajaran</h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUploadMaterial} className="space-y-3">
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
                  <option value="word">Format Word</option>
                  <option value="ppt">Format PPT</option>
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
                Unggah & Publikasikan Materi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
