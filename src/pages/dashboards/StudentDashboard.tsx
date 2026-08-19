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
  Star,
  UserPlus,
  Plus,
  Search,
  Users,
  Megaphone,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowLeft,
  Lock,
  AlertCircle,
  Info,
  Check,
  Share2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { UserAvatar } from '../../components/common/UserAvatar';

interface EnrolledClass {
  id: string;
  name: string;
  code: string;
  courseName: string;
  teacherName: string;
  teacherAvatar?: string;
  description: string;
  jurusan: string;
  semester: string;
  academicYear: string;
  materialCount: number;
  assignmentCount: number;
  attendancePercent: number;
}

interface StudentMaterial {
  id: string;
  classId?: string;
  title: string;
  subject: string;
  fileType: string;
  fileUrl: string;
  description: string;
  createdAt?: string;
}

interface StudentAssignment {
  id: string;
  classId?: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'Belum Dikumpulkan' | 'Sudah Dikumpulkan';
  description: string;
  grade?: number;
  feedback?: string;
}

interface AnnouncementItem {
  id: string;
  classId: string;
  title: string;
  content: string;
  teacherName: string;
  teacherAvatar?: string;
  createdAt: string;
}

interface GradeItem {
  id: string;
  classId: string;
  itemTitle: string;
  score: number;
  maxScore: number;
  gradeType: string;
  feedback?: string;
  createdAt: string;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Navigation & Classroom Selection States
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<EnrolledClass | null>(null);
  const [classWorkspaceTab, setClassWorkspaceTab] = useState<'materi' | 'tugas' | 'absensi' | 'pengumuman' | 'nilai'>('materi');

  // Modal: Join Class States
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inputClassCode, setInputClassCode] = useState('');
  const [isSearchingCode, setIsSearchingCode] = useState(false);
  const [matchedClassPreview, setMatchedClassPreview] = useState<any | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);

  // Classroom Contents
  const [materials, setMaterials] = useState<StudentMaterial[]>([]);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [gradesList, setGradesList] = useState<GradeItem[]>([]);

  // Task Submission States
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionFileUrl, setSubmissionFileUrl] = useState('');
  const [submissionFileName, setSubmissionFileName] = useState('');
  const [submittedList, setSubmittedList] = useState<Record<string, { grade?: number; feedback?: string }>>({});

  // Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const studentQrCode = user?.qrCode || `EDU-SISWA-${user?.id?.slice(0, 8) || '001'}`;
  const studentJurusan = user?.jurusan || 'Teknik / Umum';

  const showToastNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (user?.id) {
      ensureStudentQrCodeInSupabase();
      fetchStudentEnrolledClasses();
    }
  }, [user?.id]);

  const ensureStudentQrCodeInSupabase = async () => {
    if (!user?.id) return;
    try {
      const generatedQr = `EDU-SISWA-${user.id.slice(0, 8)}`;
      const { data: profile } = await supabase.from('profiles').select('qr_code').eq('id', user.id).single();
      if (!(profile as any)?.qr_code) {
        await (supabase as any).from('profiles').update({ qr_code: generatedQr }).eq('id', user.id);
      }
    } catch (err) {
      console.warn('Syncing QR Code profile warning:', err);
    }
  };

  // Fetch all enrolled classes for this student from Supabase DB
  const fetchStudentEnrolledClasses = async () => {
    if (!user?.id) return;
    try {
      // 1. Query enrollments table
      const { data: enrollData } = await supabase.from('enrollments').select('class_id').eq('student_id', user.id);
      let classIds: string[] = [];
      if (enrollData && enrollData.length > 0) {
        classIds = enrollData.map((e: any) => e.class_id).filter(Boolean);
      }

      // 2. Query classes
      let query = supabase.from('classes').select('*');
      if (classIds.length > 0) {
        query = query.in('id', classIds);
      }
      const { data: clsData } = await query;

      // 3. Fetch materials, assignments, profiles map for counts
      const { data: matData } = await supabase.from('materials').select('id, class_id');
      const { data: assData } = await supabase.from('assignments').select('id, class_id');
      const { data: attData } = await supabase.from('attendance_records').select('class_id, status').eq('student_id', user.id);
      const { data: teacherProfiles } = await supabase.from('profiles').select('id, full_name, avatar_url');

      const teacherMap: Record<string, any> = {};
      if (teacherProfiles) {
        teacherProfiles.forEach((p: any) => {
          teacherMap[p.id] = p;
        });
      }

      const matCountMap: Record<string, number> = {};
      if (matData) {
        matData.forEach((m: any) => {
          if (m.class_id) matCountMap[m.class_id] = (matCountMap[m.class_id] || 0) + 1;
        });
      }

      const assCountMap: Record<string, number> = {};
      if (assData) {
        assData.forEach((a: any) => {
          if (a.class_id) assCountMap[a.class_id] = (assCountMap[a.class_id] || 0) + 1;
        });
      }

      const attCountMap: Record<string, { hadir: number; total: number }> = {};
      if (attData) {
        attData.forEach((a: any) => {
          const cid = a.class_id || 'general';
          if (!attCountMap[cid]) attCountMap[cid] = { hadir: 0, total: 0 };
          attCountMap[cid].total += 1;
          if (a.status?.toLowerCase() === 'hadir' || a.status?.toLowerCase() === 'masuk') {
            attCountMap[cid].hadir += 1;
          }
        });
      }

      if (clsData) {
        setEnrolledClasses(
          clsData.map((c: any) => {
            const teacher = teacherMap[c.teacher_id];
            const att = attCountMap[c.id];
            const attPercent = att && att.total > 0 ? Math.round((att.hadir / att.total) * 100) : 100;
            const rawName = c.name || 'Kelas';
            const matchCode = rawName.match(/\[(EDU[A-Z0-9]+)\]/i);
            const extractedCode = c.code || c.class_code || (matchCode ? matchCode[1] : null) || 'EDU8XK21';
            const cleanName = rawName.replace(/\s*\[EDU[A-Z0-9]+\]/i, '').trim();

            return {
              id: c.id,
              name: cleanName || rawName,
              code: extractedCode,
              courseName: c.course_name || 'Mata Pelajaran Umum',
              teacherName: teacher?.full_name || 'Guru EduVerse',
              teacherAvatar: teacher?.avatar_url || undefined,
              description: c.description || 'Kelas pembelajaran interaktif LMS EduVerse.',
              jurusan: c.jurusan || 'Semua Jurusan',
              semester: c.semester || 'Ganjil',
              academicYear: c.academic_year || '2026/2027',
              materialCount: matCountMap[c.id] || 0,
              assignmentCount: assCountMap[c.id] || 0,
              attendancePercent: attPercent,
            };
          })
        );
      }

      // 4. Fetch Submissions
      const submittedMap: Record<string, { grade?: number; feedback?: string }> = {};
      const { data: subData } = await supabase.from('submissions').select('assignment_id, grade, feedback').eq('student_id', user.id);
      if (subData) {
        subData.forEach((s: any) => {
          submittedMap[s.assignment_id] = { grade: s.grade, feedback: s.feedback };
        });
        setSubmittedList(submittedMap);
      }

      // 5. Fetch Materials & Assignments for student's enrolled classes
      if (classIds.length > 0) {
        const { data: fullMats, error: matErr } = await supabase
          .from('materials')
          .select('*')
          .in('class_id', classIds)
          .order('created_at', { ascending: false });

        if (fullMats && !matErr) {
          setMaterials(
            fullMats.map((m: any) => ({
              id: m.id,
              classId: m.class_id,
              title: m.title,
              subject: 'Mata Pelajaran',
              fileType: m.file_type || 'pdf',
              fileUrl: m.file_url,
              description: m.description || '',
              createdAt: m.created_at ? new Date(m.created_at).toLocaleDateString('id-ID') : '',
            }))
          );
        }

        const { data: fullAss, error: assErr } = await supabase
          .from('assignments')
          .select('*')
          .in('class_id', classIds)
          .order('created_at', { ascending: false });

        if (fullAss && !assErr) {
          setAssignments(
            fullAss.map((a: any) => ({
              id: a.id,
              classId: a.class_id,
              title: a.title,
              subject: 'Mata Pelajaran',
              dueDate: a.due_date ? a.due_date.slice(0, 10) : 'Tanpa Tenggat',
              status: submittedMap[a.id] ? 'Sudah Dikumpulkan' : 'Belum Dikumpulkan',
              description: a.description || '',
              grade: submittedMap[a.id]?.grade,
              feedback: submittedMap[a.id]?.feedback,
            }))
          );
        }
      }

      // 6. Fetch Announcements
      const { data: annData } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (annData) {
        setAnnouncements(
          annData.map((a: any) => {
            const t = teacherMap[a.teacher_id];
            return {
              id: a.id,
              classId: a.class_id,
              title: a.title,
              content: a.content,
              teacherName: t?.full_name || 'Guru Pengampu',
              teacherAvatar: t?.avatar_url,
              createdAt: new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            };
          })
        );
      }

      // 7. Fetch Grades
      const { data: grData } = await supabase.from('grades').select('*').eq('student_id', user.id).order('created_at', { ascending: false });
      if (grData) {
        setGradesList(
          grData.map((g: any) => ({
            id: g.id,
            classId: g.class_id,
            itemTitle: g.item_title,
            score: g.score,
            maxScore: g.max_score || 100,
            gradeType: g.grade_type || 'tugas',
            feedback: g.feedback,
            createdAt: new Date(g.created_at).toLocaleDateString('id-ID'),
          }))
        );
      }
    } catch (err) {
      console.warn('Error fetching student enrolled classes:', err);
    }
  };

  // Search & Validate Class Code when student enters code in modal
  const handleCheckClassCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputClassCode.trim().toUpperCase();
    console.log('🔍 [Join Class Input]:', { rawInput: inputClassCode, cleanedCode: cleanCode, studentId: user?.id });

    if (!cleanCode) {
      setJoinError('Silakan masukkan kode kelas.');
      return;
    }

    setIsSearchingCode(true);
    setJoinError(null);
    setMatchedClassPreview(null);

    try {
      let foundClass: any = null;

      // Strategy 1: Search by code or class_code column
      try {
        const { data: codeData } = await (supabase as any)
          .from('classes')
          .select('*')
          .or(`code.ilike.${cleanCode},class_code.ilike.${cleanCode}`);
        if (codeData && codeData.length > 0) {
          foundClass = codeData[0];
        }
      } catch (err1) {
        console.warn('Strategy 1 notice:', err1);
      }

      // Strategy 2: Search by code column alone
      if (!foundClass) {
        try {
          const { data: codeData2 } = await (supabase as any)
            .from('classes')
            .select('*')
            .ilike('code', cleanCode);
          if (codeData2 && codeData2.length > 0) {
            foundClass = codeData2[0];
          }
        } catch (err2) {
          console.warn('Strategy 2 notice:', err2);
        }
      }

      // Strategy 3: Query all classes and check code / class_code / name in memory
      if (!foundClass) {
        try {
          const { data: allCls } = await (supabase as any).from('classes').select('*');
          if (allCls && allCls.length > 0) {
            foundClass = allCls.find((c: any) => {
              const cCode = (c.code || c.class_code || '').toString().trim().toUpperCase();
              const cName = (c.name || '').toString().trim().toUpperCase();
              return cCode === cleanCode || (cCode && cleanCode && cCode.includes(cleanCode)) || (cName && cleanCode && cName.includes(cleanCode));
            });
          }
        } catch (err3) {
          console.warn('Strategy 3 notice:', err3);
        }
      }

      if (!foundClass) {
        console.warn('❌ [Join Class] Kode kelas tidak ditemukan di database:', cleanCode);
        setJoinError('Kode kelas tidak ditemukan.');
        setIsSearchingCode(false);
        return;
      }

      console.log('✅ [Join Class Found Class]:', {
        class_id: foundClass.id,
        class_name: foundClass.name,
        class_code: foundClass.code || foundClass.class_code,
        is_active: foundClass.is_active,
        student_id: user?.id,
      });

      // 2. Check if Class is Active
      if (foundClass.is_active === false) {
        setJoinError('Kelas sudah tidak menerima anggota baru.');
        setIsSearchingCode(false);
        return;
      }

      // 3. Check if Student is Already Enrolled
      if (user?.id) {
        const { data: enrollCheck } = await (supabase as any)
          .from('enrollments')
          .select('id')
          .eq('class_id', foundClass.id)
          .eq('student_id', user.id);

        if (enrollCheck && enrollCheck.length > 0) {
          console.log('ℹ️ [Join Class] Siswa sudah terdaftar di kelas:', foundClass.id);
          setJoinError('Anda sudah bergabung di kelas ini.');
          setIsSearchingCode(false);
          return;
        }
      }

      // 4. Fetch Teacher Profile Name
      let teacherName = 'Guru EduVerse';
      let teacherAvatar = undefined;
      if (foundClass.teacher_id) {
        const { data: teacherProf } = await (supabase as any)
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', foundClass.teacher_id)
          .single();
        if (teacherProf) {
          teacherName = teacherProf.full_name;
          teacherAvatar = teacherProf.avatar_url;
        }
      }

      setMatchedClassPreview({
        ...foundClass,
        teacherName,
        teacherAvatar,
      });
    } catch (err: any) {
      console.error('❌ [Join Class Verification Error]:', err);
      setJoinError('Kode kelas tidak ditemukan.');
    } finally {
      setIsSearchingCode(false);
    }
  };

  // Confirm Join Class & Insert to Enrollments Table
  const handleConfirmJoinClass = async () => {
    if (!matchedClassPreview || !user?.id) return;

    setIsSubmittingJoin(true);
    console.log('📌 [Join Class Inserting Payload]:', {
      class_id: matchedClassPreview.id,
      student_id: user.id,
      class_name: matchedClassPreview.name,
    });

    try {
      // Insert to Supabase enrollments table
      const { data: insertData, error: insertErr } = await (supabase as any).from('enrollments').insert({
        class_id: matchedClassPreview.id,
        student_id: user.id,
        status: 'active',
        enrolled_at: new Date().toISOString(),
      }).select();

      if (insertErr && !insertErr.message.includes('duplicate')) {
        console.error('❌ [Join Class Supabase INSERT Error]:', insertErr);
        // Fallback insert with minimal payload
        const { data: fallbackData, error: fallbackErr } = await (supabase as any).from('enrollments').insert({
          class_id: matchedClassPreview.id,
          student_id: user.id,
        }).select();

        if (fallbackErr && !fallbackErr.message.includes('duplicate')) {
          console.error('❌ [Join Class Fallback INSERT Error]:', fallbackErr);
          showToastNotification('error', 'Gagal bergabung ke kelas: ' + fallbackErr.message);
          setIsSubmittingJoin(false);
          return;
        }
        console.log('🎉 [Join Class Fallback INSERT Success]:', fallbackData);
      } else {
        console.log('🎉 [Join Class INSERT Success]:', insertData);
      }

      // Refresh Enrolled Classes State Immediately!
      await fetchStudentEnrolledClasses();

      setShowJoinModal(false);
      setInputClassCode('');
      setMatchedClassPreview(null);

      showToastNotification('success', 'Berhasil bergabung ke kelas.');
    } catch (err: any) {
      console.error('❌ [Join Class Exception]:', err);
      showToastNotification('error', 'Gagal bergabung ke kelas: ' + err.message);
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  // Submission Upload Handler
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
      const { error } = await (supabase as any).from('submissions').insert({
        assignment_id: selectedAssignment.id,
        student_id: user?.id,
        file_url: submissionFileUrl || 'https://supabase.com/file-jawaban-siswa.pdf',
        notes: submissionNotes,
      });

      if (error) console.warn('Submission notice:', error.message);

      setSubmittedList((prev) => ({ ...prev, [selectedAssignment.id]: {} }));
      setAssignments((prev) =>
        prev.map((a) => (a.id === selectedAssignment.id ? { ...a, status: 'Sudah Dikumpulkan' } : a))
      );

      showToastNotification('success', `✅ Tugas "${selectedAssignment.title}" berhasil dikumpulkan!`);
      setSelectedAssignment(null);
      setSubmissionNotes('');
      setSubmissionFileUrl('');
      setSubmissionFileName('');
    } catch (err: any) {
      showToastNotification('error', `Gagal mengirimkan tugas: ${err.message}`);
    }
  };

  // PNG Download of Student's QR Code
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

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Banner Notification */}
      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-lg animate-in zoom-in-95 ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : toast.type === 'error'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl border border-blue-500/20">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Ruang Belajar Siswa EduVerse
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
              <Flame className="w-4 h-4 text-emerald-400 animate-pulse" /> Sesi Belajar Aktif
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white pt-1">
            Selamat Datang, {user?.fullName || user?.email || 'Siswa'}
          </h1>
          <p className="text-xs text-slate-300">
            Jurusan: <strong className="text-blue-300">{studentJurusan}</strong> • Institusi: <strong className="text-blue-300">{user?.schoolName || 'SMK EduVerse'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
          >
            <UserPlus className="w-4 h-4" /> + Gabung Kelas Baru
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SCREEN A: DETAILED CLASSROOM WORKSPACE (If a class is selected) */}
      {/* ========================================================= */}
      {selectedClass ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Navbar & Back Button */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-sm">
            <button
              onClick={() => setSelectedClass(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Kelas
            </button>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
              Kode Kelas: {selectedClass.code}
            </span>
          </div>

          {/* Class Banner Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white shadow-xl space-y-3 border border-indigo-500/20">
            <div className="flex items-center gap-3">
              <UserAvatar src={selectedClass.teacherAvatar} name={selectedClass.teacherName} size="lg" className="border-2 border-indigo-400/40" />
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {selectedClass.courseName}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">{selectedClass.name}</h2>
                <p className="text-xs text-slate-300">
                  Guru Pengampu: <strong className="text-white">{selectedClass.teacherName}</strong> • {selectedClass.jurusan} ({selectedClass.semester})
                </p>
              </div>
            </div>
          </div>

          {/* Classroom Workspace Tabs */}
          {(() => {
            const classMaterials = selectedClass ? materials.filter((m) => m.classId === selectedClass.id) : [];
            const classAssignments = selectedClass ? assignments.filter((a) => a.classId === selectedClass.id) : [];
            return (
              <>
                <div className="flex border-b border-border overflow-x-auto gap-2">
                  <button
                    onClick={() => setClassWorkspaceTab('materi')}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      classWorkspaceTab === 'materi'
                        ? 'border-blue-600 text-blue-600 bg-blue-500/5 rounded-t-xl'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" /> Tab Materi ({classMaterials.length})
                  </button>
                  <button
                    onClick={() => setClassWorkspaceTab('tugas')}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      classWorkspaceTab === 'tugas'
                        ? 'border-blue-600 text-blue-600 bg-blue-500/5 rounded-t-xl'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileCheck className="w-4 h-4" /> Tab Tugas ({classAssignments.length})
                  </button>
                  <button
                    onClick={() => setClassWorkspaceTab('absensi')}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      classWorkspaceTab === 'absensi'
                        ? 'border-blue-600 text-blue-600 bg-blue-500/5 rounded-t-xl'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <QrCode className="w-4 h-4" /> Tab Absensi
                  </button>
                  <button
                    onClick={() => setClassWorkspaceTab('pengumuman')}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      classWorkspaceTab === 'pengumuman'
                        ? 'border-blue-600 text-blue-600 bg-blue-500/5 rounded-t-xl'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Megaphone className="w-4 h-4 text-amber-500" /> Tab Pengumuman ({announcements.length})
                  </button>
                  <button
                    onClick={() => setClassWorkspaceTab('nilai')}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      classWorkspaceTab === 'nilai'
                        ? 'border-blue-600 text-blue-600 bg-blue-500/5 rounded-t-xl'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-500" /> Tab Nilai
                  </button>
                </div>

                {/* TAB 1: MATERI PEMBELAJARAN */}
                {classWorkspaceTab === 'materi' && (
                  <div className="space-y-4">
                    {classMaterials.length === 0 ? (
                      <div className="p-8 text-center bg-card border border-border rounded-2xl text-muted-foreground italic text-xs">
                        Belum ada materi dipublikasikan oleh Guru untuk kelas ini.
                      </div>
                    ) : (
                      classMaterials.map((m) => (
                        <div key={m.id} className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                {m.fileType}
                              </span>
                              <span className="text-xs font-semibold text-muted-foreground">{m.subject}</span>
                            </div>
                            <h4 className="font-bold text-base text-foreground">{m.title}</h4>
                            <p className="text-xs text-muted-foreground">{m.description}</p>
                          </div>
                          <a
                            href={m.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Download className="w-4 h-4" /> Unduh Berkas
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 2: TUGAS & PENILAIAN */}
                {classWorkspaceTab === 'tugas' && (
                  <div className="space-y-4">
                    {classAssignments.length === 0 ? (
                      <div className="p-8 text-center bg-card border border-border rounded-2xl text-muted-foreground italic text-xs">
                        Belum ada tugas diberikan oleh Guru untuk kelas ini.
                      </div>
                    ) : (
                      classAssignments.map((a) => (
                  <div key={a.id} className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-base text-foreground">{a.title}</h4>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          a.status === 'Sudah Dikumpulkan'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                      <span>Tenggat: <strong>{a.dueDate}</strong></span>
                      {a.grade !== undefined && (
                        <span className="font-bold text-emerald-600">Nilai: {a.grade} / 100</span>
                      )}
                      <button
                        onClick={() => setSelectedAssignment(a)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer hover:bg-blue-700 transition-all"
                      >
                        Kumpulkan Tugas
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: ABSENSI & KARTU QR */}
          {classWorkspaceTab === 'absensi' && (
            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm text-center space-y-4 max-w-lg mx-auto">
              <h3 className="text-base font-bold text-foreground flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" /> Kartu QR Presensi Kelas
              </h3>
              <p className="text-xs text-muted-foreground">Tunjukkan QR Code ini kepada Guru saat sesi presensi berlangsung.</p>

              <div className="p-6 rounded-2xl bg-white text-slate-900 shadow-xl inline-block w-full border border-slate-200">
                <div className="flex justify-center py-2">
                  <QRCodeSVG
                    id="student-qr-svg"
                    value={JSON.stringify({
                      app: 'EDUVERSE',
                      type: 'STUDENT_ATTENDANCE_QR',
                      v: '1.0',
                      sid: user?.id || '',
                      code: studentQrCode,
                      name: user?.fullName || '',
                      email: user?.email || '',
                      jurusan: studentJurusan,
                    })}
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="border-t border-slate-200 pt-3 flex items-center justify-center gap-3 text-left">
                  <UserAvatar src={user?.avatarUrl} name={user?.fullName} size="md" />
                  <div>
                    <p className="font-bold text-base text-slate-900">{user?.fullName || user?.email || 'Siswa'}</p>
                    <p className="text-xs text-slate-600 font-medium">Jurusan: {studentJurusan}</p>
                    <span className="inline-block px-2.5 py-0.5 mt-1 rounded-full text-[11px] font-mono font-bold bg-blue-100 text-blue-700">
                      {studentQrCode}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownloadQR}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" /> Unduh QR Presensi (.PNG)
              </button>
            </div>
          )}

          {/* TAB 4: PENGUMUMAN GURU */}
          {classWorkspaceTab === 'pengumuman' && (
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <div className="p-8 text-center bg-card border border-border rounded-2xl text-muted-foreground italic text-xs">
                  Belum ada pengumuman untuk kelas ini.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
                    <div className="flex items-center gap-3">
                      <UserAvatar src={ann.teacherAvatar} name={ann.teacherName} size="md" />
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{ann.teacherName}</h4>
                        <p className="text-[11px] text-muted-foreground">{ann.createdAt}</p>
                      </div>
                    </div>
                    <h3 className="font-bold text-base text-foreground pt-1">{ann.title}</h3>
                    <p className="text-xs text-muted-foreground whitespace-pre-line">{ann.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: REKAP NILAI SISWA */}
          {classWorkspaceTab === 'nilai' && (
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" /> Transkrip Nilai Siswa
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="p-3">Komponen / Tugas</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Nilai Siswa</th>
                      <th className="p-3">Catatan / Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {gradesList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-xs text-muted-foreground italic">
                          Belum ada nilai diinputkan oleh Guru.
                        </td>
                      </tr>
                    ) : (
                      gradesList.map((g) => (
                        <tr key={g.id} className="hover:bg-muted/30">
                          <td className="p-3 font-bold text-foreground">{g.itemTitle}</td>
                          <td className="p-3 uppercase text-[10px] font-bold text-muted-foreground">{g.gradeType}</td>
                          <td className="p-3 font-bold text-emerald-600">{g.score} / {g.maxScore}</td>
                          <td className="p-3 text-muted-foreground">{g.feedback || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      );
    })()}
  </div>
) : (
        /* ========================================================= */
        /* SCREEN B: DAFTAR KARTU KELAS RUANG BELAJAR SISWA (Default Grid View) */
        /* ========================================================= */
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> Kelas Yang Anda Ikuti ({enrolledClasses.length})
            </h2>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" /> + Gabung Kelas
            </button>
          </div>

          {enrolledClasses.length === 0 ? (
            <div className="p-12 text-center bg-card border border-border rounded-3xl space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Anda Belum Bergabung di Kelas Manapun</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Minta Kode Kelas acak (contoh: EDU8XK21) kepada Guru Anda, lalu tekan tombol "+ Gabung Kelas" untuk mulai belajar.
                </p>
              </div>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <UserPlus className="w-4 h-4" /> Masukkan Kode Kelas Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        {cls.courseName}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {cls.code}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-foreground group-hover:text-blue-600 transition-colors">{cls.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{cls.jurusan} • {cls.semester}</p>
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <UserAvatar src={cls.teacherAvatar} name={cls.teacherName} size="sm" />
                      <span className="text-xs font-semibold text-foreground">{cls.teacherName}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-muted/40">
                        <span className="block font-bold text-foreground">{cls.materialCount}</span>
                        <span className="text-[10px] text-muted-foreground">Materi</span>
                      </div>
                      <div className="p-2 rounded-xl bg-muted/40">
                        <span className="block font-bold text-foreground">{cls.assignmentCount}</span>
                        <span className="text-[10px] text-muted-foreground">Tugas</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold">
                        <span className="block">{cls.attendancePercent}%</span>
                        <span className="text-[10px]">Presensi</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedClass(cls)}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Masuk Kelas <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: GABUNG KELAS MENGGUNAKAN KODE KELAS (Google Classroom Style) */}
      {/* ========================================================= */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> Gabung Kelas Ruang Belajar
              </h3>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinError(null);
                  setMatchedClassPreview(null);
                  setInputClassCode('');
                }}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message Alert */}
            {joinError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            {/* Step 1: Input Class Code */}
            {!matchedClassPreview ? (
              <form onSubmit={handleCheckClassCode} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-foreground">Masukkan Kode Kelas</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: EDU8XK21"
                    value={inputClassCode}
                    onChange={(e) => setInputClassCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-2xl bg-muted/60 border border-border text-foreground font-mono font-bold text-base tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Kode acak 8 karakter dapat diminta kepada Guru pengampu kelas Anda.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSearchingCode || !inputClassCode.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSearchingCode ? 'Memeriksa...' : 'Cek Kode Kelas'}
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Confirmation Preview Card */
              <div className="space-y-4 text-left">
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-600 text-white">
                    {matchedClassPreview.course_name || 'Mata Pelajaran'}
                  </span>
                  <h4 className="font-bold text-lg text-foreground">{matchedClassPreview.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    Guru: <strong>{matchedClassPreview.teacherName}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Jurusan: <strong>{matchedClassPreview.jurusan || 'Semua Jurusan'}</strong> • Semester: <strong>{matchedClassPreview.semester || 'Ganjil'}</strong>
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMatchedClassPreview(null)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Ganti Kode
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmJoinClass}
                    disabled={isSubmittingJoin}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmittingJoin ? 'Proses...' : 'Konfirmasi Bergabung'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT ASSIGNMENT */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Pengumpulan Tugas: {selectedAssignment.title}</h3>
              <button onClick={() => setSelectedAssignment(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Pilih Berkas Jawaban (PDF / Word / Gambar / Zip)</label>
                <input
                  type="file"
                  onChange={handleSubmissionFileChange}
                  className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {submissionFileName && <p className="text-xs font-semibold text-emerald-600">Terpilih: {submissionFileName}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Catatan Tambahan untuk Guru</label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Tuliskan pesan atau catatan pengerjaan tugas..."
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Kirim Jawaban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
