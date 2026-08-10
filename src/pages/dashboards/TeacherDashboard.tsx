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
  AlertCircle,
  MessageSquare,
  Star,
  ArrowLeft,
  ArrowRight,
  Megaphone,
  BarChart3,
  Copy,
  Trash2,
  ExternalLink,
  Info,
  Check,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Html5Qrcode } from 'html5-qrcode';
import { UserAvatar } from '../../components/common/UserAvatar';

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
  code: string;
  courseName: string;
  description?: string;
  jurusan?: string;
  semester?: string;
  academicYear: string;
  isActive: boolean;
  studentCount: number;
}

interface MaterialItem {
  id: string;
  classId?: string;
  title: string;
  fileType: string;
  fileUrl: string;
  fileName?: string;
  description: string;
  className: string;
  createdAt?: string;
}

interface AssignmentItem {
  id: string;
  classId?: string;
  title: string;
  description: string;
  dueDate: string;
  className: string;
  fileUrl?: string;
  fileName?: string;
  maxScore?: number;
  createdAt?: string;
}

interface SubmissionItem {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  avatarUrl?: string;
  fileUrl: string;
  notes: string;
  grade?: number;
  feedback?: string;
  submittedAt: string;
}

interface AttendanceRecord {
  id: string;
  classId?: string;
  studentName: string;
  avatarUrl?: string;
  jurusan: string;
  qrCode: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  scannedAt: string;
}

interface AnnouncementItem {
  id: string;
  classId: string;
  title: string;
  content: string;
  createdAt: string;
}

interface EnrolledStudent {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  jurusan?: string;
  joinedAt: string;
}

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Selected Class Workspace State (If open)
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [classTab, setClassTab] = useState<'beranda' | 'materi' | 'tugas' | 'absensi' | 'anggota'>('beranda');

  // Scanner References & States
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [attendanceMode, setAttendanceMode] = useState<'masuk' | 'pulang'>('masuk');

  // Main Data States (Fetched directly from Supabase DB)
  const [courses, setCourses] = useState<CourseModule[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);

  // Modal Visibility Controls
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);

  // Form Inputs
  const [newCourse, setNewCourse] = useState({ code: '', name: '' });
  const [newClass, setNewClass] = useState<{ name: string; courseName: string; description?: string; jurusan?: string; semester?: string }>({
    name: '',
    courseName: '',
    description: '',
    jurusan: 'Semua Jurusan',
    semester: 'Ganjil',
  });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });

  const [gradeInput, setGradeInput] = useState<number | ''>('');
  const [feedbackInput, setFeedbackInput] = useState('');

  const [newMaterial, setNewMaterial] = useState<{
    title: string;
    fileType: string;
    fileUrl: string;
    fileName: string;
    description: string;
  }>({
    title: '',
    fileType: 'pdf',
    fileUrl: '',
    fileName: '',
    description: '',
  });

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    fileUrl: '',
    fileName: '',
    maxScore: 100,
  });

  // Fetch real data from Supabase DB on mount
  useEffect(() => {
    fetchSupabaseData();
  }, []);

  // When selectedClass changes, fetch members & announcements for that class
  useEffect(() => {
    if (selectedClass?.id) {
      fetchClassDetails(selectedClass.id);
    }
  }, [selectedClass?.id]);

  const fetchSupabaseData = async () => {
    try {
      // 0. Fetch all profiles map
      const { data: allProfiles } = await supabase.from('profiles').select('*');
      const profilesMap: Record<string, any> = {};
      if (allProfiles) {
        allProfiles.forEach((p: any) => {
          profilesMap[p.id] = p;
        });
      }

      // 1. Materials
      const { data: matData } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
      if (matData) {
        setMaterials(
          matData.map((m: any) => ({
            id: m.id,
            classId: m.class_id,
            title: m.title,
            fileType: m.file_type || 'pdf',
            fileUrl: m.file_url,
            fileName: m.title,
            description: m.description || '',
            className: 'Kelas',
            createdAt: new Date(m.created_at).toLocaleDateString('id-ID'),
          }))
        );
      }

      // 2. Assignments
      const { data: assData } = await supabase.from('assignments').select('*').order('created_at', { ascending: false });
      if (assData) {
        setAssignments(
          assData.map((a: any) => ({
            id: a.id,
            classId: a.class_id,
            title: a.title,
            description: a.description || '',
            dueDate: a.due_date ? a.due_date.slice(0, 10) : 'Tanpa Tenggat',
            className: 'Kelas',
            fileUrl: a.file_url,
            fileName: a.file_name,
            maxScore: a.max_score || 100,
            createdAt: new Date(a.created_at).toLocaleDateString('id-ID'),
          }))
        );
      }

      // 3. Submissions with Real Student Profiles
      const { data: subData } = await supabase.from('submissions').select('*').order('submitted_at', { ascending: false });
      if (subData) {
        setSubmissions(
          subData.map((s: any) => {
            const prof = profilesMap[s.student_id];
            return {
              id: s.id,
              assignmentId: s.assignment_id,
              studentId: s.student_id,
              studentName: prof ? (prof.full_name || prof.email) : `Siswa (${s.student_id?.slice(0, 8) || ''})`,
              avatarUrl: prof?.avatar_url,
              fileUrl: s.file_url,
              notes: s.notes || '',
              grade: s.grade,
              feedback: s.feedback || '',
              submittedAt: new Date(s.submitted_at).toLocaleDateString('id-ID'),
            };
          })
        );
      }

      // 4. Courses
      const { data: courseData } = await supabase.from('courses').select('*');
      if (courseData && courseData.length > 0) {
        setCourses(
          courseData.map((c: any) => ({
            id: c.id,
            code: c.code || 'PEL-01',
            name: c.name,
            students: 0,
            term: 'Aktif',
          }))
        );
      }

      // 4.5 Classes from Supabase DB
      const { data: clsData } = await supabase.from('classes').select('*').order('created_at', { ascending: false });
      if (clsData && clsData.length > 0) {
        const { data: enrollData } = await supabase.from('enrollments').select('class_id');
        const countMap: Record<string, number> = {};
        if (enrollData) {
          enrollData.forEach((e: any) => {
            countMap[e.class_id] = (countMap[e.class_id] || 0) + 1;
          });
        }

        setClasses(
          clsData.map((c: any) => {
            const rawName = c.name || 'Kelas';
            const matchCode = rawName.match(/\[(EDU[A-Z0-9]+)\]/i);
            const extractedCode = c.code || c.class_code || (matchCode ? matchCode[1] : null) || `EDU${c.id.slice(0, 5).toUpperCase()}`;
            const cleanName = rawName.replace(/\s*\[EDU[A-Z0-9]+\]/i, '').trim();

            return {
              id: c.id,
              name: cleanName || rawName,
              code: extractedCode,
              courseName: c.course_name || 'Mata Pelajaran Umum',
              description: c.description || '',
              jurusan: c.jurusan || 'Semua Jurusan',
              semester: c.semester || 'Ganjil',
              academicYear: c.academic_year || '2026/2027',
              isActive: c.is_active !== false,
              studentCount: countMap[c.id] || 0,
            };
          })
        );
      }

      // 5. Attendance Records with Real Student Profiles
      const { data: attData } = await supabase.from('attendance_records').select('*').order('scanned_at', { ascending: false });
      if (attData && attData.length > 0) {
        const missingIds = attData.map((a: any) => a.student_id).filter((id: string) => id && !profilesMap[id]);
        if (missingIds.length > 0) {
          const { data: addProfiles } = await supabase.from('profiles').select('*').in('id', missingIds);
          if (addProfiles) {
            addProfiles.forEach((p: any) => {
              profilesMap[p.id] = p;
            });
          }
        }

        setAttendanceRecords(
          attData.map((a: any) => {
            const prof = profilesMap[a.student_id];
            let studentName = prof?.full_name || prof?.email;
            if (!studentName || studentName.startsWith('Siswa (')) {
              studentName = prof?.full_name || prof?.email || (a.qr_code && !a.qr_code.startsWith('{') ? a.qr_code : 'Siswa');
            }
            return {
              id: a.id,
              classId: a.class_id,
              studentName: studentName,
              avatarUrl: prof?.avatar_url || undefined,
              jurusan: prof?.jurusan || 'Umum',
              qrCode: prof?.qr_code || a.student_id || '-',
              status: a.status === 'pulang' ? 'Sakit' : 'Hadir',
              scannedAt: new Date(a.scanned_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            };
          })
        );
      }
    } catch (err) {
      console.warn('Error fetching Supabase data:', err);
    }
  };

  // Fetch enrolled students & announcements for a specific class
  const fetchClassDetails = async (classId: string) => {
    try {
      // 1. Fetch Enrolled Students
      const { data: enrollData } = await supabase.from('enrollments').select('student_id, enrolled_at').eq('class_id', classId);
      if (enrollData && enrollData.length > 0) {
        const studentIds = enrollData.map((e: any) => e.student_id).filter(Boolean);
        const { data: studentProfiles } = await supabase.from('profiles').select('*').in('id', studentIds);

        if (studentProfiles) {
          const enrollMap = new Map(enrollData.map((e: any) => [e.student_id, e.enrolled_at]));
          setEnrolledStudents(
            studentProfiles.map((p: any) => ({
              id: p.id,
              fullName: p.full_name || p.email,
              email: p.email,
              avatarUrl: p.avatar_url,
              jurusan: p.jurusan || 'Umum',
              joinedAt: new Date(enrollMap.get(p.id) || Date.now()).toLocaleDateString('id-ID'),
            }))
          );
        }
      } else {
        setEnrolledStudents([]);
      }

      // 2. Fetch Announcements
      const { data: annData } = await supabase.from('announcements').select('*').eq('class_id', classId).order('created_at', { ascending: false });
      if (annData) {
        setAnnouncements(
          annData.map((a: any) => ({
            id: a.id,
            classId: a.class_id,
            title: a.title,
            content: a.content,
            createdAt: new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          }))
        );
      }
    } catch (err) {
      console.warn('Error fetching class details:', err);
    }
  };

  // Safe Cleanup Scanner
  const safeCleanupScanner = async () => {
    if (scannerRef.current) {
      try {
        if (isScanningRef.current) {
          await scannerRef.current.stop();
          isScanningRef.current = false;
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Scanner cleanup notice:', err);
      } finally {
        scannerRef.current = null;
      }
    }
  };

  // Robust Camera QR Scanner Lifecycle
  useEffect(() => {
    let isMounted = true;
    let animFrameId: number;
    let timerId: ReturnType<typeof setTimeout>;

    if (showScanModal) {
      setCameraError(null);
      isScanningRef.current = false;

      const initCameraScanner = () => {
        animFrameId = requestAnimationFrame(async () => {
          const videoContainer = document.getElementById('reader');
          if (!videoContainer) {
            console.warn('📌 [QR Scanner] DOM #reader element not ready. Retrying...');
            timerId = setTimeout(initCameraScanner, 200);
            return;
          }

          try {
            await safeCleanupScanner();
            if (!isMounted) return;

            const html5QrCode = new Html5Qrcode('reader');
            scannerRef.current = html5QrCode;

            let targetCameraId: string | { facingMode: string } = { facingMode: 'environment' };

            try {
              const devices = await Html5Qrcode.getCameras();
              if (devices && devices.length > 0) {
                const backCam = devices.find((d) =>
                  d.label.toLowerCase().includes('back') ||
                  d.label.toLowerCase().includes('rear') ||
                  d.label.toLowerCase().includes('environment') ||
                  d.label.toLowerCase().includes('belakang')
                );
                if (backCam) {
                  targetCameraId = backCam.id;
                } else {
                  targetCameraId = devices[devices.length - 1].id;
                }
              }
            } catch (devErr) {
              console.warn('📌 [QR Camera Devices Query Notice]:', devErr);
            }

            const qrConfig = {
              fps: 15,
              qrbox: { width: 220, height: 220 },
              aspectRatio: 1.0,
            };

            await html5QrCode.start(
              targetCameraId,
              qrConfig,
              (decodedText) => {
                const now = Date.now();
                if (decodedText === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 2500) {
                  return;
                }
                lastScannedCodeRef.current = decodedText;
                lastScannedTimeRef.current = now;
                processAutoScan(decodedText);
              },
              () => {}
            );

            isScanningRef.current = true;
          } catch (err: any) {
            console.error('❌ [QR Camera Initialization Failed]:', err);
            setCameraError(
              '⚠️ Gagal membuka kamera. Pastikan izin kamera telah diberikan di browser (HTTPS / Chrome Android).'
            );
          }
        });
      };

      timerId = setTimeout(initCameraScanner, 300);
    } else {
      safeCleanupScanner();
    }

    return () => {
      isMounted = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (timerId) clearTimeout(timerId);
      safeCleanupScanner();
    };
  }, [showScanModal]);

  // Automatic Scan Processing & Supabase Insertion
  const processAutoScan = async (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return;

    try {
      let extractedUUID = '';
      let jsonCodeParam = '';
      let jsonName = '';
      let jsonEmail = '';
      let jsonJurusan = '';
      let isJsonFormat = false;

      try {
        const parsed = JSON.parse(cleanCode);
        if (parsed && typeof parsed === 'object') {
          isJsonFormat = true;
          extractedUUID = parsed.sid || parsed.studentId || parsed.id || '';
          jsonCodeParam = parsed.code || '';
          jsonName = parsed.name || '';
          jsonEmail = parsed.email || '';
          jsonJurusan = parsed.jurusan || '';
        }
      } catch {
        // Plain text
      }

      if (!extractedUUID) {
        extractedUUID = cleanCode.replace(/^EDU-SISWA-/i, '').trim();
      }

      let studentProfiles: any[] | null = null;
      if (extractedUUID) {
        const { data } = await supabase.from('profiles').select('*').eq('id', extractedUUID);
        if (data && data.length > 0) studentProfiles = data;
      }

      if ((!studentProfiles || studentProfiles.length === 0) && extractedUUID && extractedUUID.length >= 8) {
        const fallbackName = jsonName || (jsonEmail ? jsonEmail.split('@')[0] : '') || `Siswa`;
        studentProfiles = [{
          id: extractedUUID,
          email: jsonEmail || `siswa_${extractedUUID.slice(0, 8)}@eduverse.school`,
          full_name: fallbackName,
          role: 'student',
          jurusan: jsonJurusan || 'Umum',
          qr_code: jsonCodeParam || cleanCode || `EDU-SISWA-${extractedUUID.slice(0, 8)}`,
        }];
      }

      if (!studentProfiles || studentProfiles.length === 0) {
        setScanFeedback({
          type: 'error',
          message: '❌ QR Code tidak terdaftar di database sekolah.',
        });
        setTimeout(() => setScanFeedback(null), 3500);
        return;
      }

      const student = studentProfiles[0];
      const targetClassId = selectedClass?.id || null;

      try {
        await (supabase as any).from('attendance_records').insert({
          student_id: student.id,
          profile_id: student.id,
          class_id: targetClassId,
          qr_code: student.qr_code || jsonCodeParam || cleanCode,
          attendance_type: 'qr',
          session: attendanceMode,
          session_id: attendanceMode,
          status: attendanceMode === 'pulang' ? 'pulang' : 'hadir',
          scanned_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn('Attendance DB insert notice:', dbErr);
      }

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        classId: targetClassId || undefined,
        studentName: student.full_name || student.email,
        avatarUrl: student.avatar_url,
        jurusan: student.jurusan || 'Teknik / Umum',
        qrCode: student.qr_code || jsonCodeParam || cleanCode,
        status: attendanceMode === 'pulang' ? 'Sakit' : 'Hadir',
        scannedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setAttendanceRecords((prev) => [newRecord, ...prev.filter((r) => r.qrCode !== newRecord.qrCode)]);

      setScanFeedback({
        type: 'success',
        message: `✅ Absensi ${attendanceMode.toUpperCase()} Berhasil: ${student.full_name} (${student.jurusan || 'Umum'})`,
      });
      setTimeout(() => setScanFeedback(null), 3500);
    } catch (err: any) {
      setScanFeedback({
        type: 'error',
        message: `⚠️ Error Absensi: ${err.message}`,
      });
      setTimeout(() => setScanFeedback(null), 3500);
    }
  };

  // Handlers for Creating Items inside Selected Class
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.code || !newCourse.name) return;

    try {
      const { data } = await (supabase as any).from('courses').insert({
        code: newCourse.code,
        name: newCourse.name,
        teacher_id: user?.id,
      }).select();

      const obj: CourseModule = {
        id: (data as any)?.[0]?.id || `c-${Date.now()}`,
        code: newCourse.code,
        name: newCourse.name,
        students: 0,
        term: 'Aktif',
      };

      setCourses([obj, ...courses]);
      setNewCourse({ code: '', name: '' });
      setShowCourseModal(false);
    } catch (err: any) {
      alert(`Gagal menyimpan mata pelajaran: ${err.message}`);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name) return;

    try {
      const generatedCode = 'EDU' + Math.random().toString(36).substring(2, 7).toUpperCase();
      console.log('📌 [Teacher Class Create]:', { name: newClass.name, generatedCode, teacher_id: user?.id });

      let createdId = `cls-${Date.now()}`;
      let data: any = null;
      let error: any = null;

      // Primary Insert Strategy: Insert full object with code & name embedding
      const res = await (supabase as any).from('classes').insert({
        name: `${newClass.name} [${generatedCode}]`,
        code: generatedCode,
        class_code: generatedCode,
        teacher_id: user?.id,
        course_name: newClass.courseName || 'Mata Pelajaran Umum',
        description: newClass.description || '',
        jurusan: newClass.jurusan || 'Semua Jurusan',
        semester: newClass.semester || 'Ganjil',
        academic_year: '2026/2027',
        is_active: true,
      }).select();

      data = res.data;
      error = res.error;

      // Fallback Strategy: If DB schema cache missing extra columns, try inserting name + academic_year
      if (error && error.message.includes('column')) {
        console.warn('⚠️ Primary class insert returned column notice, retrying with fail-safe payload:', error.message);
        const res2 = await (supabase as any).from('classes').insert({
          name: `${newClass.name} [${generatedCode}]`,
          academic_year: '2026/2027',
        }).select();
        data = res2.data;
        error = res2.error;
      }

      if (data && data.length > 0) {
        createdId = data[0].id;
        console.log('🎉 [Teacher Class Created in Supabase DB]:', data[0]);
      } else {
        console.warn('⚠️ Class insert response notice:', error?.message);
      }

      const obj: ClassItem = {
        id: createdId,
        name: newClass.name,
        code: generatedCode,
        courseName: newClass.courseName || 'Mata Pelajaran Umum',
        description: newClass.description || '',
        jurusan: newClass.jurusan || 'Semua Jurusan',
        semester: newClass.semester || 'Ganjil',
        academicYear: '2026/2027',
        isActive: true,
        studentCount: 0,
      };

      setClasses([obj, ...classes]);
      setNewClass({ name: '', courseName: '', description: '', jurusan: 'Semua Jurusan', semester: 'Ganjil' });
      setShowClassModal(false);

      alert(`✅ Kelas "${newClass.name}" berhasil dibuat!\n\nKode Kelas Unik: ${generatedCode}\n\nBagikan kode ini kepada siswa agar dapat bergabung.`);
    } catch (err: any) {
      console.error('❌ [Teacher Class Create Exception]:', err);
      alert(`Gagal membuat kelas: ${err.message}`);
    }
  };

  // Upload Material inside Selected Class
  const handleMaterialFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      let publicFileUrl = URL.createObjectURL(file);
      try {
        const filePath = `materials/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('materials')
          .upload(filePath, file);

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage.from('materials').getPublicUrl(filePath);
          if (urlData?.publicUrl) publicFileUrl = urlData.publicUrl;
        }
      } catch (err) {
        console.warn('Supabase storage upload fallback:', err);
      }

      setNewMaterial((prev) => ({
        ...prev,
        title: prev.title || file.name,
        fileName: file.name,
        fileType: ext || 'pdf',
        fileUrl: publicFileUrl,
      }));
    }
  };

  const handleUploadMaterialInClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title || !selectedClass) return;

    try {
      const { data } = await (supabase as any).from('materials').insert({
        class_id: selectedClass.id,
        teacher_id: user?.id,
        title: newMaterial.title,
        file_type: newMaterial.fileType,
        file_url: newMaterial.fileUrl || 'https://supabase.com/material.pdf',
        description: newMaterial.description,
      }).select();

      const obj: MaterialItem = {
        id: (data as any)?.[0]?.id || `m-${Date.now()}`,
        classId: selectedClass.id,
        title: newMaterial.title,
        fileType: newMaterial.fileType,
        fileUrl: newMaterial.fileUrl || 'https://supabase.com/material.pdf',
        fileName: newMaterial.fileName || 'Berkas_Materi.pdf',
        description: newMaterial.description,
        className: selectedClass.name,
        createdAt: new Date().toLocaleDateString('id-ID'),
      };

      setMaterials([obj, ...materials]);
      setNewMaterial({ title: '', fileType: 'pdf', fileUrl: '', fileName: '', description: '' });
      setShowMaterialModal(false);
      alert(`✅ Materi "${newMaterial.title}" berhasil diunggah ke kelas "${selectedClass.name}"!`);
    } catch (err: any) {
      alert(`Gagal mengunggah materi: ${err.message}`);
    }
  };

  // Create Assignment inside Selected Class
  const handleCreateAssignmentInClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title || !selectedClass) return;

    try {
      const { data } = await (supabase as any).from('assignments').insert({
        class_id: selectedClass.id,
        teacher_id: user?.id,
        title: newAssignment.title,
        description: newAssignment.description,
        due_date: newAssignment.dueDate ? new Date(newAssignment.dueDate).toISOString() : null,
        file_url: newAssignment.fileUrl || null,
        file_name: newAssignment.fileName || null,
        max_score: newAssignment.maxScore || 100,
      }).select();

      const obj: AssignmentItem = {
        id: (data as any)?.[0]?.id || `ass-${Date.now()}`,
        classId: selectedClass.id,
        title: newAssignment.title,
        description: newAssignment.description,
        dueDate: newAssignment.dueDate || 'Tanpa Tenggat',
        className: selectedClass.name,
        fileUrl: newAssignment.fileUrl,
        fileName: newAssignment.fileName,
        maxScore: newAssignment.maxScore || 100,
        createdAt: new Date().toLocaleDateString('id-ID'),
      };

      setAssignments([obj, ...assignments]);
      setNewAssignment({ title: '', description: '', dueDate: '', fileUrl: '', fileName: '', maxScore: 100 });
      setShowAssignmentModal(false);
      alert(`✅ Tugas "${newAssignment.title}" berhasil dibuat di kelas "${selectedClass.name}"!`);
    } catch (err: any) {
      alert(`Gagal membuat tugas: ${err.message}`);
    }
  };

  // Create Announcement inside Selected Class
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !selectedClass) return;

    try {
      const { data } = await (supabase as any).from('announcements').insert({
        class_id: selectedClass.id,
        teacher_id: user?.id,
        title: newAnnouncement.title,
        content: newAnnouncement.content,
      }).select();

      const obj: AnnouncementItem = {
        id: (data as any)?.[0]?.id || `ann-${Date.now()}`,
        classId: selectedClass.id,
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        createdAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      };

      setAnnouncements([obj, ...announcements]);
      setNewAnnouncement({ title: '', content: '' });
      setShowAnnouncementModal(false);
      alert(`✅ Pengumuman dipublikasikan ke kelas "${selectedClass.name}"!`);
    } catch (err: any) {
      alert(`Gagal mempublikasikan pengumuman: ${err.message}`);
    }
  };

  // Remove Student from Class
  const handleRemoveStudentFromClass = async (studentId: string, studentName: string) => {
    if (!selectedClass) return;
    if (!confirm(`Apakah Anda yakin ingin mengeluarkan ${studentName} dari kelas ${selectedClass.name}?`)) return;

    try {
      await (supabase as any).from('enrollments').delete().eq('class_id', selectedClass.id).eq('student_id', studentId);
      setEnrolledStudents((prev) => prev.filter((s) => s.id !== studentId));
      setClasses((prev) =>
        prev.map((c) => (c.id === selectedClass.id ? { ...c, studentCount: Math.max(0, c.studentCount - 1) } : c))
      );
      alert(`✅ Siswa ${studentName} telah dikeluarkan dari kelas.`);
    } catch (err: any) {
      alert(`Gagal mengeluarkan siswa: ${err.message}`);
    }
  };

  // Save Grade & Feedback for Submission
  const handleSaveGradeAndFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || gradeInput === '') return;

    try {
      await (supabase as any)
        .from('submissions')
        .update({ grade: Number(gradeInput), feedback: feedbackInput })
        .eq('id', selectedSubmission.id);

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSubmission.id ? { ...s, grade: Number(gradeInput), feedback: feedbackInput } : s
        )
      );

      alert(`✅ Nilai ${gradeInput} berhasil disimpan untuk ${selectedSubmission.studentName}!`);
      setSelectedSubmission(null);
      setGradeInput('');
      setFeedbackInput('');
    } catch (err: any) {
      alert(`Gagal menyimpan nilai: ${err.message}`);
    }
  };

  // Export Attendance to Excel (CSV)
  const handleExportExcel = () => {
    const recordsToExport = selectedClass
      ? attendanceRecords.filter((r) => r.classId === selectedClass.id || !r.classId)
      : attendanceRecords;

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Nama Siswa,Jurusan,Kode QR,Status,Waktu Scan']
        .concat(recordsToExport.map((r) => `"${r.studentName}","${r.jurusan}","${r.qrCode}","${r.status}","${r.scannedAt}"`))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Absensi_EduVerse_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Attendance to PDF
  const handleExportPDF = () => {
    const recordsToExport = selectedClass
      ? attendanceRecords.filter((r) => r.classId === selectedClass.id || !r.classId)
      : attendanceRecords;

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
              ${recordsToExport
                .map(
                  (r, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${r.studentName}</td>
                  <td>${r.jurusan}</td>
                  <td>${r.qrCode}</td>
                  <td>${r.status}</td>
                  <td>${r.scannedAt}</td>
                </tr>
              `
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

  // Class-specific filtered data
  const classMaterials = selectedClass ? materials.filter((m) => m.classId === selectedClass.id) : [];
  const classAssignments = selectedClass ? assignments.filter((a) => a.classId === selectedClass.id) : [];
  const classAnnouncements = selectedClass ? announcements.filter((a) => a.classId === selectedClass.id) : [];
  const classAttendanceRecords = selectedClass
    ? attendanceRecords.filter((r) => r.classId === selectedClass.id || !r.classId)
    : attendanceRecords;

  return (
    <div className="space-y-6 font-sans">
      {/* ========================================================= */}
      {/* SCREEN A: WORKSPACE HALAMAN KELAS GURU (If a class is selected) */}
      {/* ========================================================= */}
      {selectedClass ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Bar Navigation & Back Button */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-sm">
            <button
              onClick={() => setSelectedClass(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Kelas Utama
            </button>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                Kode Kelas: {selectedClass.code}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedClass.code);
                  alert(`✅ Kode Kelas "${selectedClass.code}" berhasil disalin ke clipboard! Bagikan ke siswa Anda.`);
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow hover:bg-blue-700 transition-all cursor-pointer"
              >
                Salin Kode 📋
              </button>
            </div>
          </div>

          {/* Teacher Class Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white shadow-xl space-y-3 border border-teal-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-500/20 text-teal-300 border border-teal-400/30">
                    {selectedClass.courseName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {selectedClass.isActive ? 'Kelas Aktif' : 'Kelas Ditutup'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white mt-1">{selectedClass.name}</h1>
                <p className="text-xs text-slate-300">
                  {selectedClass.jurusan} • {selectedClass.semester} • <strong>{enrolledStudents.length} Siswa Terdaftar</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowAnnouncementModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Megaphone className="w-4 h-4" /> + Pengumuman
                </button>
              </div>
            </div>
          </div>

          {/* Workspace Tabs Navbar (Beranda | Materi | Tugas | Absensi | Anggota) */}
          <div className="flex border-b border-border overflow-x-auto gap-2">
            <button
              onClick={() => setClassTab('beranda')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                classTab === 'beranda'
                  ? 'border-teal-600 text-teal-600 bg-teal-500/5 rounded-t-xl'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Beranda
            </button>
            <button
              onClick={() => setClassTab('materi')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                classTab === 'materi'
                  ? 'border-teal-600 text-teal-600 bg-teal-500/5 rounded-t-xl'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Upload className="w-4 h-4" /> Materi ({classMaterials.length})
            </button>
            <button
              onClick={() => setClassTab('tugas')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                classTab === 'tugas'
                  ? 'border-teal-600 text-teal-600 bg-teal-500/5 rounded-t-xl'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-4 h-4" /> Tugas ({classAssignments.length})
            </button>
            <button
              onClick={() => setClassTab('absensi')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                classTab === 'absensi'
                  ? 'border-teal-600 text-teal-600 bg-teal-500/5 rounded-t-xl'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Camera className="w-4 h-4" /> Absensi ({classAttendanceRecords.length})
            </button>
            <button
              onClick={() => setClassTab('anggota')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                classTab === 'anggota'
                  ? 'border-teal-600 text-teal-600 bg-teal-500/5 rounded-t-xl'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-500" /> Anggota Siswa ({enrolledStudents.length})
            </button>
          </div>

          {/* TAB 1: BERANDA KELAS */}
          {classTab === 'beranda' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Pengumuman Terbaru */}
                <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-amber-500" /> Pengumuman Kelas ({classAnnouncements.length})
                    </h3>
                    <button
                      onClick={() => setShowAnnouncementModal(true)}
                      className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                    >
                      + Buat Pengumuman
                    </button>
                  </div>

                  {classAnnouncements.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-3">Belum ada pengumuman diposting untuk kelas ini.</p>
                  ) : (
                    classAnnouncements.map((ann) => (
                      <div key={ann.id} className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-foreground">{ann.title}</h4>
                          <span className="text-[11px] text-muted-foreground">{ann.createdAt}</span>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-pre-line">{ann.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sidebar Info Kode Kelas & Pengaturan */}
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4 text-center">
                  <h3 className="text-sm font-bold text-foreground">Kode Kelas Unik</h3>
                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <span className="text-2xl font-mono font-extrabold text-blue-600 tracking-wider select-all">
                      {selectedClass.code}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedClass.code);
                      alert(`✅ Kode Kelas "${selectedClass.code}" berhasil disalin ke clipboard! Bagikan kode ini ke siswa.`);
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition-all cursor-pointer"
                  >
                    Bagikan / Salin Kode 📋
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATERI PEMBELAJARAN (Terisolasi per Class ID) */}
          {classTab === 'materi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-600" /> Materi Pembelajaran Kelas ({classMaterials.length})
                </h3>
                <button
                  onClick={() => setShowMaterialModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" /> + Upload Materi Baru
                </button>
              </div>

              {classMaterials.length === 0 ? (
                <div className="p-8 text-center bg-card border border-border rounded-3xl text-muted-foreground italic text-xs space-y-2">
                  <p>Belum ada materi diunggah di kelas ini.</p>
                  <button
                    onClick={() => setShowMaterialModal(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow inline-flex items-center gap-1 cursor-pointer"
                  >
                    + Upload Materi Sekarang
                  </button>
                </div>
              ) : (
                classMaterials.map((m) => (
                  <div key={m.id} className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {m.fileType}
                        </span>
                        <span className="text-xs text-muted-foreground">{m.createdAt}</span>
                      </div>
                      <h4 className="font-bold text-base text-foreground">{m.title}</h4>
                      <p className="text-xs text-muted-foreground">{m.description || m.fileName}</p>
                    </div>
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Unduh Berkas
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: TUGAS & SUBMISSIONS (Terisolasi per Class ID) */}
          {classTab === 'tugas' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" /> Daftar Tugas & Penilaian ({classAssignments.length})
                </h3>
                <button
                  onClick={() => setShowAssignmentModal(true)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" /> + Buat Tugas Baru
                </button>
              </div>

              {classAssignments.length === 0 ? (
                <div className="p-8 text-center bg-card border border-border rounded-3xl text-muted-foreground italic text-xs space-y-2">
                  <p>Belum ada tugas dibuat di kelas ini.</p>
                  <button
                    onClick={() => setShowAssignmentModal(true)}
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs shadow inline-flex items-center gap-1 cursor-pointer"
                  >
                    + Buat Tugas Sekarang
                  </button>
                </div>
              ) : (
                classAssignments.map((a) => (
                  <div key={a.id} className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-base text-foreground">{a.title}</h4>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 border border-teal-500/20">
                        Maksimal: {a.maxScore || 100} Poin
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                      <span>Tenggat: <strong>{a.dueDate}</strong></span>
                    </div>
                  </div>
                ))
              )}

              {/* Submissions Section */}
              <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" /> Jawaban & Penilaian Siswa ({submissions.length})
                </h3>

                <div className="space-y-3">
                  {submissions.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">Belum ada pengumpulan jawaban tugas dari siswa.</p>
                  ) : (
                    submissions.map((sub) => (
                      <div key={sub.id} className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserAvatar src={sub.avatarUrl} name={sub.studentName} size="md" />
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{sub.studentName}</h4>
                            <p className="text-xs text-muted-foreground">Dikirim: {sub.submittedAt} • Catatan: {sub.notes || '-'}</p>
                            {sub.grade !== undefined && sub.grade !== null ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 mt-1">
                                Nilai: {sub.grade} / 100 {sub.feedback ? `• Komentar: "${sub.feedback}"` : ''}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-1">
                                Belum Dinilai
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg bg-accent hover:bg-muted text-foreground transition-colors cursor-pointer"
                            title="Unduh Jawaban Siswa"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setGradeInput(sub.grade !== undefined ? sub.grade : '');
                              setFeedbackInput(sub.feedback || '');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow flex items-center gap-1 cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5" /> Beri Nilai
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ABSENSI KELAS */}
          {classTab === 'absensi' && (
            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Camera className="w-5 h-5 text-amber-600" /> Presensi Kamera QR Kelas ({classAttendanceRecords.length})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Pemindaian Otomatis Kamera HP / Laptop & Penyimpanan ke Supabase.</p>
                </div>
                <button
                  onClick={() => setShowScanModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" /> Pindai Kamera Otomatis
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="p-2.5">Siswa</th>
                      <th className="p-2.5">Jurusan</th>
                      <th className="p-2.5">Kode QR</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {classAttendanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-xs text-muted-foreground italic">
                          Belum ada data presensi untuk kelas ini. Klik "Pindai Kamera Otomatis" untuk memindai QR Code siswa.
                        </td>
                      </tr>
                    ) : (
                      classAttendanceRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/30">
                          <td className="p-2.5 flex items-center gap-2 font-bold text-foreground">
                            <UserAvatar src={r.avatarUrl} name={r.studentName} size="sm" />
                            <span>{r.studentName}</span>
                          </td>
                          <td className="p-2.5 text-muted-foreground">{r.jurusan}</td>
                          <td className="p-2.5 font-mono text-amber-600">{r.qrCode}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                              {r.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-muted-foreground">{r.scannedAt}</td>
                        </tr>
                      ))
                    )}
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
          )}

          {/* TAB 5: ANGGOTA SISWA TERDAFTAR */}
          {classTab === 'anggota' && (
            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Daftar Siswa Terdaftar Di Kelas Ini ({enrolledStudents.length})
              </h3>

              {enrolledStudents.length === 0 ? (
                <div className="p-8 text-center bg-card border border-border rounded-2xl text-muted-foreground italic text-xs">
                  Belum ada siswa bergabung menggunakan Kode Kelas {selectedClass.code}.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {enrolledStudents.map((st) => (
                    <div key={st.id} className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserAvatar src={st.avatarUrl} name={st.fullName} size="md" />
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{st.fullName}</h4>
                          <p className="text-xs text-muted-foreground">{st.email}</p>
                          <span className="text-[10px] text-muted-foreground">Bergabung: {st.joinedAt}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveStudentFromClass(st.id, st.fullName)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-500 transition-all cursor-pointer"
                        title="Keluarkan Siswa dari Kelas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================= */
        /* SCREEN B: MAIN OVERVIEW DASBOR UTAMA GURU (Default View) */
        /* ========================================================= */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white shadow-xl border border-teal-500/20">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" /> EduVerse LMS Guru Portal
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold mt-1">
                Selamat Datang, {user?.fullName || user?.email || 'Guru'}
              </h1>
              <p className="text-xs text-slate-300">
                Kelola kelas, materi, tugas, dan presensi siswa sekolah dalam satu dasbor modern.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClassModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" /> + Buat Kelas Baru
              </button>
            </div>
          </div>

          {/* Quick Overview Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm text-center">
              <span className="block font-extrabold text-2xl text-teal-600">{classes.length}</span>
              <span className="text-xs text-muted-foreground">Kelas Aktif</span>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm text-center">
              <span className="block font-extrabold text-2xl text-emerald-600">{materials.length}</span>
              <span className="text-xs text-muted-foreground">Total Materi</span>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm text-center">
              <span className="block font-extrabold text-2xl text-blue-600">{assignments.length}</span>
              <span className="text-xs text-muted-foreground">Total Tugas</span>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm text-center">
              <span className="block font-extrabold text-2xl text-indigo-600">
                {classes.reduce((acc, c) => acc + c.studentCount, 0)}
              </span>
              <span className="text-xs text-muted-foreground">Siswa Terdaftar</span>
            </div>
          </div>

          {/* Catalog Kelas Guru (Grid View) */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" /> Kelas & Rombel Pembelajaran Guru ({classes.length})
              </h3>
              <button
                onClick={() => setShowClassModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow flex items-center gap-1 cursor-pointer"
              >
                + Buat Kelas Baru
              </button>
            </div>

            {classes.length === 0 ? (
              <div className="p-8 text-center bg-muted/30 border border-border rounded-2xl space-y-2 text-xs text-muted-foreground">
                <p className="italic">Belum ada kelas dibuat. Klik "+ Buat Kelas Baru" untuk memulai.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-500/10 text-teal-600 border border-teal-500/20">
                          {cls.courseName}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {cls.code}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-lg text-foreground group-hover:text-teal-600 transition-colors">{cls.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{cls.jurusan} • {cls.semester}</p>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Siswa Terdaftar: <strong className="text-foreground">{cls.studentCount} Siswa</strong>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-border">
                      <button
                        onClick={() => setSelectedClass(cls)}
                        className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Buka Kelas <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* Modal: Create Class */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Buat Kelas Baru & Kode Kelas</h3>
              <button onClick={() => setShowClassModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Nama Kelas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: XII TKJ 1"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Mata Pelajaran *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jaringan Komputer & Fiber Optic"
                  value={newClass.courseName}
                  onChange={(e) => setNewClass({ ...newClass, courseName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Jurusan Target</label>
                  <input
                    type="text"
                    placeholder="Contoh: Teknik Komputer"
                    value={newClass.jurusan || ''}
                    onChange={(e) => setNewClass({ ...newClass, jurusan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Semester</label>
                  <select
                    value={newClass.semester || 'Ganjil'}
                    onChange={(e) => setNewClass({ ...newClass, semester: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-600 font-medium">
                💡 Kode Kelas Unik acak 8 karakter akan dibuat secara otomatis saat kelas disimpan.
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-600/30 cursor-pointer transition-all">
                Simpan Kelas Baru
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Material in Selected Class */}
      {showMaterialModal && selectedClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" /> Upload Materi ke Kelas: {selectedClass.name}
              </h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUploadMaterialInClass} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Judul Berkas Materi *</label>
                <input
                  type="text"
                  required
                  placeholder="Judul Materi..."
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Pilih Berkas (PDF / Word / PPT / Excel / Video / Gambar)</label>
                <input
                  type="file"
                  onChange={handleMaterialFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,image/*,audio/*,video/*"
                  className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                {newMaterial.fileName && <p className="text-[11px] font-semibold text-emerald-600">Berhasil dipilih: {newMaterial.fileName}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Atau Tautkan Link YouTube / Google Drive</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={newMaterial.fileUrl}
                  onChange={(e) => setNewMaterial({ ...newMaterial, fileUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan ringkas petunjuk materi..."
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer transition-all">
                Simpan & Publikasikan Materi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Assignment in Selected Class */}
      {showAssignmentModal && selectedClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" /> Buat Tugas Baru di Kelas: {selectedClass.name}
              </h3>
              <button onClick={() => setShowAssignmentModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAssignmentInClass} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Judul Tugas *</label>
                <input
                  type="text"
                  required
                  placeholder="Judul Tugas..."
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Tenggat Waktu</label>
                  <input
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Nilai Maksimal</label>
                  <input
                    type="number"
                    value={newAssignment.maxScore}
                    onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Petunjuk & Deskripsi Pengerjaan</label>
                <textarea
                  rows={3}
                  placeholder="Instruksi pengerjaan tugas..."
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-600/30 cursor-pointer transition-all">
                Simpan & Publikasikan Tugas
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Announcement */}
      {showAnnouncementModal && selectedClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" /> Buat Pengumuman Kelas
              </h3>
              <button onClick={() => setShowAnnouncementModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Judul Pengumuman *</label>
                <input
                  type="text"
                  required
                  placeholder="Judul Pengumuman..."
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Isi Pesan Pengumuman *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Pesan pengumuman untuk seluruh siswa..."
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 cursor-pointer transition-all">
                Publikasikan Pengumuman
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Grade Submission */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" /> Penilaian Jawaban Siswa
              </h3>
              <button onClick={() => setSelectedSubmission(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 bg-muted/40 p-3 rounded-xl text-xs">
              <p className="font-bold text-foreground">Siswa: {selectedSubmission.studentName}</p>
              <p className="text-muted-foreground">Catatan Siswa: {selectedSubmission.notes || '-'}</p>
              <a href={selectedSubmission.fileUrl} target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline inline-flex items-center gap-1 font-bold mt-1">
                <Download className="w-3.5 h-3.5" /> Unduh Berkas Jawaban
              </a>
            </div>

            <form onSubmit={handleSaveGradeAndFeedback} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Nilai (0 - 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  placeholder="Contoh: 90"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Komentar / Feedback Guru</label>
                <textarea
                  rows={3}
                  placeholder="Masukkan umpan balik atau apresiasi pengerjaan..."
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5" /> Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Camera QR Scanner */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-border pb-3 text-left">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-600" /> Pindai QR Code Absensi Otomatis
                </h3>
                <p className="text-[11px] text-muted-foreground">Kamera aktif terus untuk memindai siswa berurutan.</p>
              </div>
              <button onClick={() => setShowScanModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 p-1 rounded-xl bg-muted/60 border border-border">
              <button
                type="button"
                onClick={() => setAttendanceMode('masuk')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  attendanceMode === 'masuk'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ☀️ Sesi Masuk
              </button>
              <button
                type="button"
                onClick={() => setAttendanceMode('pulang')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  attendanceMode === 'pulang'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🌙 Sesi Pulang
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-amber-500/50 min-h-[260px] aspect-square flex items-center justify-center">
              <div id="reader" className="w-full h-full min-h-[260px] object-cover"></div>
            </div>

            {scanFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg animate-in zoom-in-95 ${
                  scanFeedback.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {scanFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{scanFeedback.message}</span>
              </div>
            )}

            {cameraError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
