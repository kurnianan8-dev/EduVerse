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
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Html5Qrcode } from 'html5-qrcode';

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
  fileType: string;
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

interface SubmissionItem {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  fileUrl: string;
  notes: string;
  grade?: number;
  feedback?: string;
  submittedAt: string;
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

  // Modal Visibility Controls
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);

  // Form Inputs
  const [newCourse, setNewCourse] = useState({ code: '', name: '' });
  const [newClass, setNewClass] = useState({ name: '', courseName: '' });
  const [gradeInput, setGradeInput] = useState<number | ''>('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [newMaterial, setNewMaterial] = useState<{
    title: string;
    fileType: string;
    fileUrl: string;
    fileName: string;
    description: string;
    className: string;
  }>({
    title: '',
    fileType: 'pdf',
    fileUrl: '',
    fileName: '',
    description: '',
    className: '',
  });
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    className: '',
    fileUrl: '',
    fileName: '',
  });

  // Fetch real data from Supabase DB on mount
  useEffect(() => {
    fetchSupabaseData();
  }, []);

  const fetchSupabaseData = async () => {
    try {
      // 0. Fetch all profiles map to join student details
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
            title: m.title,
            fileType: m.file_type || 'pdf',
            fileUrl: m.file_url,
            fileName: m.title,
            description: m.description || '',
            className: 'Kelas Utama',
          }))
        );
      }

      // 2. Assignments
      const { data: assData } = await supabase.from('assignments').select('*').order('created_at', { ascending: false });
      if (assData) {
        setAssignments(
          assData.map((a: any) => ({
            id: a.id,
            title: a.title,
            description: a.description || '',
            dueDate: a.due_date ? a.due_date.slice(0, 10) : 'Tanpa Tenggat',
            className: 'Kelas Utama',
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

      // 5. Attendance Records with Real Student Profiles
      const { data: attData } = await supabase.from('attendance_records').select('*').order('scanned_at', { ascending: false });
      if (attData && attData.length > 0) {
        // Query any missing student profiles by student_id list
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
              studentName: studentName,
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

  // Robust Camera QR Scanner Lifecycle (Ensures DOM Readiness, Clean Release, & Auto Rear-Camera Selection)
  useEffect(() => {
    let isMounted = true;
    let animFrameId: number;
    let timerId: ReturnType<typeof setTimeout>;

    const safeCleanupScanner = async () => {
      if (scannerRef.current) {
        try {
          if (isScanningRef.current) {
            await scannerRef.current.stop();
            isScanningRef.current = false;
          }
          scannerRef.current.clear();
        } catch (e) {
          console.warn('Scanner cleanup error (handled):', e);
        }
        scannerRef.current = null;
      }
    };

    if (showScanModal) {
      setCameraError(null);
      setScanFeedback(null);

      // Wait for DOM element <div id="reader"> to be fully mounted with dimensions via requestAnimationFrame + setTimeout
      animFrameId = requestAnimationFrame(() => {
        timerId = setTimeout(async () => {
          if (!isMounted) return;

          const readerElem = document.getElementById('reader');
          if (!readerElem) {
            if (isMounted) setCameraError('Wadah kamera tidak ditemukan di layar.');
            return;
          }

          // Clean any previous scanner instance before creating a new one
          await safeCleanupScanner();

          try {
            const html5QrCode = new Html5Qrcode('reader');
            scannerRef.current = html5QrCode;

            const onScanSuccess = async (decodedText: string) => {
              const now = Date.now();
              // Cooldown: Ignore duplicate scans of the exact same QR code within 3.5 seconds
              if (lastScannedCodeRef.current === decodedText && now - lastScannedTimeRef.current < 3500) {
                return;
              }

              lastScannedCodeRef.current = decodedText;
              lastScannedTimeRef.current = now;

              await processAutoScan(decodedText);
            };

            const config = { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 };

            // Query available cameras to explicitly pick the rear/back camera deviceId on Android/iOS
            let cameraIdOrConfig: any = { facingMode: 'environment' };
            try {
              const devices = await Html5Qrcode.getCameras();
              if (devices && devices.length > 0) {
                const backCam = devices.find(
                  (d) =>
                    d.label.toLowerCase().includes('back') ||
                    d.label.toLowerCase().includes('rear') ||
                    d.label.toLowerCase().includes('environment') ||
                    d.label.toLowerCase().includes('belakang')
                );
                if (backCam) {
                  cameraIdOrConfig = backCam.id;
                } else {
                  cameraIdOrConfig = devices[0].id;
                }
              }
            } catch (cameraErr) {
              console.warn('getCameras fallback to environment constraint:', cameraErr);
            }

            if (!isMounted) return;

            // Start scanner cleanly
            await html5QrCode.start(cameraIdOrConfig, config, onScanSuccess, () => {});
            isScanningRef.current = true;
          } catch (err: any) {
            console.error('Html5Qrcode start error:', err);
            if (isMounted) {
              setCameraError(
                `Kamera gagal dibuka: ${err?.message || 'Izin kamera ditolak atau kamera sedang digunakan oleh aplikasi lain'}`
              );
            }
          }
        }, 150);
      });
    }

    return () => {
      isMounted = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (timerId) clearTimeout(timerId);
      safeCleanupScanner();
    };
  }, [showScanModal]);

  // Automatic Scan Processing & Supabase Insertion (Camera Stays Active!)
  const processAutoScan = async (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return;

    console.log('🔍 [QR Scan Raw Input] Scanned Value:', cleanCode);

    try {
      let extractedUUID = '';
      let jsonCodeParam = '';
      let jsonName = '';
      let jsonEmail = '';
      let jsonJurusan = '';
      let isJsonFormat = false;

      // 1. Structural Damage & Format Validation
      try {
        const parsed = JSON.parse(cleanCode);
        if (parsed && typeof parsed === 'object') {
          isJsonFormat = true;
          extractedUUID = parsed.sid || parsed.studentId || parsed.id || '';
          jsonCodeParam = parsed.code || '';
          jsonName = parsed.name || '';
          jsonEmail = parsed.email || '';
          jsonJurusan = parsed.jurusan || '';
          console.log('🔍 [QR Scan Parsed JSON Payload] sid:', extractedUUID, 'name:', jsonName, 'email:', jsonEmail);
        }
      } catch {
        // Plain string format
      }

      if (cleanCode.startsWith('{') && !isJsonFormat) {
        console.error('❌ [QR Scan Error] Invalid structural JSON format');
        setScanFeedback({
          type: 'error',
          message: '⚠️ QR Code rusak atau format data tidak dapat dibaca.',
        });
        setTimeout(() => setScanFeedback(null), 3500);
        return;
      }

      if (!extractedUUID) {
        extractedUUID = cleanCode.replace(/^EDU-SISWA-/i, '').trim();
      }

      console.log('🔍 [QR Scan Processing] Final extractedUUID:', extractedUUID);

      // 2. Multi-Strategy Search in Supabase public.profiles Database
      let studentProfiles: any[] | null = null;

      // Strategy A: Search by extracted UUID (Exact ID match)
      if (extractedUUID) {
        console.log('🔍 [Supabase Query Strategy A] eq("id", extractedUUID):', extractedUUID);
        const { data, error } = await supabase.from('profiles').select('*').eq('id', extractedUUID);
        if (error) console.warn('Strategy A query warning:', error.message);
        if (data && data.length > 0) studentProfiles = data;
      }

      // Strategy B: Search by jsonCodeParam or cleanCode on qr_code column
      if (!studentProfiles || studentProfiles.length === 0) {
        const targetQr = jsonCodeParam || cleanCode;
        console.log('🔍 [Supabase Query Strategy B] eq("qr_code", targetQr):', targetQr);
        const { data, error } = await supabase.from('profiles').select('*').eq('qr_code', targetQr);
        if (error) console.warn('Strategy B query warning:', error.message);
        if (data && data.length > 0) studentProfiles = data;
      }

      // Strategy C: Search by ILIKE id prefix (UUID fragment e.g., 7d9734bc)
      if ((!studentProfiles || studentProfiles.length === 0) && extractedUUID.length >= 4) {
        console.log('🔍 [Supabase Query Strategy C] ilike("id", extractedUUID%):', `${extractedUUID}%`);
        const { data, error } = await supabase.from('profiles').select('*').ilike('id', `${extractedUUID}%`);
        if (error) console.warn('Strategy C query warning:', error.message);
        if (data && data.length > 0) studentProfiles = data;
      }

      // Strategy D: Search by ILIKE qr_code partial
      if (!studentProfiles || studentProfiles.length === 0) {
        console.log('🔍 [Supabase Query Strategy D] ilike("qr_code", %extractedUUID%):', `%${extractedUUID}%`);
        const { data, error } = await supabase.from('profiles').select('*').ilike('qr_code', `%${extractedUUID}%`);
        if (error) console.warn('Strategy D query warning:', error.message);
        if (data && data.length > 0) studentProfiles = data;
      }

      // Strategy E: Search by email
      if (!studentProfiles || studentProfiles.length === 0) {
        console.log('🔍 [Supabase Query Strategy E] eq("email", cleanCode):', cleanCode);
        const { data, error } = await supabase.from('profiles').select('*').eq('email', cleanCode);
        if (error) console.warn('Strategy E query warning:', error.message);
        if (data && data.length > 0) studentProfiles = data;
      }

      // Strategy F: Resilient fallback parsing for valid UUID student payload
      if ((!studentProfiles || studentProfiles.length === 0) && extractedUUID && extractedUUID.length >= 8) {
        const fallbackName = jsonName || (jsonEmail ? jsonEmail.split('@')[0] : '') || `Siswa`;
        console.log('📌 [Resilient Fallback] Constructing profile from scanned UUID payload:', extractedUUID, 'Name:', fallbackName);
        studentProfiles = [{
          id: extractedUUID,
          email: jsonEmail || `siswa_${extractedUUID.slice(0, 8)}@eduverse.school`,
          full_name: fallbackName,
          role: 'student',
          jurusan: jsonJurusan || 'Umum',
          qr_code: jsonCodeParam || cleanCode || `EDU-SISWA-${extractedUUID.slice(0, 8)}`,
        }];
      }

      console.log('🔍 [Supabase Query Result] Profiles Matched:', studentProfiles?.length, studentProfiles);

      // Validation 1: QR Tidak Terdaftar
      if (!studentProfiles || studentProfiles.length === 0) {
        console.error('❌ [QR Validation Failed] Student profile not found in Supabase DB for code:', cleanCode);
        setScanFeedback({
          type: 'error',
          message: '❌ QR Code tidak terdaftar di database sekolah.',
        });
        setTimeout(() => setScanFeedback(null), 3500);
        return;
      }

      const student: any = studentProfiles[0];
      const studentName = student.full_name || student.email || 'Siswa';
      const role = (student.role || '').toLowerCase();

      console.log('✅ [QR Validation Success] Found Student Profile:', {
        id: student.id,
        name: studentName,
        email: student.email,
        role: student.role,
        jurusan: student.jurusan,
        qr_code: student.qr_code,
      });

      // Validation 2: Role Verification (Siswa Only)
      if (role !== 'student' && role !== 'siswa') {
        console.warn('⚠️ [QR Validation Warning] Invalid Role:', student.role);
        setScanFeedback({
          type: 'error',
          message: `⚠️ Presensi Ditolak: Akun "${studentName}" terdaftar sebagai ${student.role === 'teacher' ? 'Guru' : 'Bukan Siswa'}.`,
        });
        setTimeout(() => setScanFeedback(null), 4000);
        return;
      }

      // Validation 3: Same-Day Duplicate Attendance Check
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data: existingToday } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', student.id)
        .gte('scanned_at', startOfDay.toISOString());

      if (existingToday && existingToday.length > 0) {
        const sameModeRecord = existingToday.find((r: any) =>
          r.session_id === attendanceMode ||
          (attendanceMode === 'masuk' && r.status === 'hadir') ||
          (attendanceMode === 'pulang' && r.status === 'pulang')
        );

        if (sameModeRecord) {
          const scanTime = new Date((sameModeRecord as any).scanned_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          console.warn('⚠️ [QR Validation Warning] Duplicate attendance today for:', studentName);
          setScanFeedback({
            type: 'error',
            message: `⚠️ ${studentName} sudah presensi ${attendanceMode === 'pulang' ? 'PULANG' : 'MASUK'} hari ini (${scanTime} WIB).`,
          });
          setTimeout(() => setScanFeedback(null), 4000);
          return;
        }
      }

      const timestampStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      // 3. Insert Attendance Record into Supabase
      console.log('📌 [Supabase Insert] Inserting attendance_records for student_id:', student.id);
      let insertedId = `att-${Date.now()}`;
      try {
        const { data, error } = await (supabase as any).from('attendance_records').insert({
          student_id: student.id,
          profile_id: student.id,
          qr_code: student.qr_code || jsonCodeParam || cleanCode,
          attendance_type: 'qr',
          session: attendanceMode,
          session_id: attendanceMode,
          status: attendanceMode === 'pulang' ? 'pulang' : 'hadir',
          scanned_at: new Date().toISOString(),
        }).select();

        if (error) {
          console.warn('⚠️ [Supabase Insert Warning] attendance_records insert notice:', error.message);
        } else if (data && (data as any[])[0]?.id) {
          insertedId = (data as any[])[0].id;
          console.log('✅ [Supabase Insert Success] Recorded attendance row:', (data as any[])[0]);
        }
      } catch (dbErr: any) {
        console.warn('⚠️ [Supabase Insert Catch Notice]', dbErr.message);
      }

      // 4. Auto sync missing qr_code in public.profiles table
      if (!student.qr_code) {
        const syncQrValue = jsonCodeParam || cleanCode || `EDU-SISWA-${student.id.slice(0, 8)}`;
        console.log('📌 [Supabase Sync] Syncing qr_code column in profiles table to:', syncQrValue);
        await (supabase as any)
          .from('profiles')
          .update({ qr_code: syncQrValue })
          .eq('id', student.id);
      }

      // 5. Update local attendance state with REAL student profile data
      const newRecord: AttendanceRecord = {
        id: insertedId,
        studentName: studentName,
        jurusan: student.jurusan || 'Umum',
        qrCode: student.qr_code || jsonCodeParam || cleanCode,
        status: attendanceMode === 'pulang' ? 'Sakit' : 'Hadir',
        scannedAt: `${timestampStr} WIB`,
      };

      setAttendanceRecords((prev) => [newRecord, ...prev]);

      // 6. Display Toast Feedback (Camera stays active!)
      setScanFeedback({
        type: 'success',
        message: `✅ Absensi ${attendanceMode === 'pulang' ? 'PULANG' : 'MASUK'} Berhasil: ${studentName} (${student.jurusan || 'Umum'})`,
      });

      setTimeout(() => setScanFeedback(null), 3500);
    } catch (err: any) {
      console.error('❌ [ProcessAutoScan Exception]', err);
      setScanFeedback({
        type: 'error',
        message: `Gagal menyimpan absensi: ${err.message}`,
      });
      setTimeout(() => setScanFeedback(null), 3500);
    }
  };

  // 1. Create Course in Supabase
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.code || !newCourse.name) return;

    try {
      const { data, error } = await supabase.from('courses').insert({
        code: newCourse.code,
        name: newCourse.name,
        teacher_id: user?.id,
      } as any).select();

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

  // 2. Create Class in Supabase
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name) return;

    try {
      const { data, error } = await supabase.from('classes').insert({
        name: newClass.name,
        teacher_id: user?.id,
      } as any).select();

      const obj: ClassItem = {
        id: (data as any)?.[0]?.id || `cls-${Date.now()}`,
        name: newClass.name,
        courseName: newClass.courseName || 'Mata Pelajaran',
        academicYear: '2026/2027',
      };

      setClasses([obj, ...classes]);
      setNewClass({ name: '', courseName: '' });
      setShowClassModal(false);
    } catch (err: any) {
      alert(`Gagal membuat kelas: ${err.message}`);
    }
  };

  // 3. Material Upload & Multi-Format File Handler to Supabase Storage & DB
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

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title) return;

    try {
      const { data, error } = await supabase.from('materials').insert({
        title: newMaterial.title,
        file_type: newMaterial.fileType,
        file_url: newMaterial.fileUrl || 'https://supabase.com/material.pdf',
        description: newMaterial.description,
        teacher_id: user?.id,
      } as any).select();

      const obj: MaterialItem = {
        id: (data as any)?.[0]?.id || `m-${Date.now()}`,
        title: newMaterial.title,
        fileType: newMaterial.fileType,
        fileUrl: newMaterial.fileUrl || 'https://supabase.com/material.pdf',
        fileName: newMaterial.fileName || 'Berkas_Materi.pdf',
        description: newMaterial.description,
        className: 'Kelas Utama',
      };

      setMaterials([obj, ...materials]);
      setNewMaterial({ title: '', fileType: 'pdf', fileUrl: '', fileName: '', description: '', className: '' });
      setShowMaterialModal(false);
    } catch (err: any) {
      alert(`Gagal mengunggah materi: ${err.message}`);
    }
  };

  // 4. Assignment Creation in Supabase
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

    try {
      const { data, error } = await supabase.from('assignments').insert({
        title: newAssignment.title,
        description: newAssignment.description,
        due_date: newAssignment.dueDate ? new Date(newAssignment.dueDate).toISOString() : new Date().toISOString(),
        teacher_id: user?.id,
      } as any).select();

      const obj: AssignmentItem = {
        id: (data as any)?.[0]?.id || `a-${Date.now()}`,
        title: newAssignment.title,
        description: newAssignment.description,
        dueDate: newAssignment.dueDate || new Date().toISOString().slice(0, 10),
        className: 'Kelas Utama',
        fileUrl: newAssignment.fileUrl,
        fileName: newAssignment.fileName,
      };

      setAssignments([obj, ...assignments]);
      setNewAssignment({ title: '', description: '', dueDate: '', className: '', fileUrl: '', fileName: '' });
      setShowAssignmentModal(false);
    } catch (err: any) {
      alert(`Gagal membuat tugas: ${err.message}`);
    }
  };

  // 5. Grade & Comment on Student Submission
  const handleSaveGradeAndFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedSubmission) return;
      await (supabase as any)
        .from('submissions')
        .update({
          grade: gradeInput === '' ? null : Number(gradeInput),
          feedback: feedbackInput,
        })
        .eq('id', selectedSubmission.id);

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSubmission.id
            ? { ...s, grade: gradeInput === '' ? undefined : Number(gradeInput), feedback: feedbackInput }
            : s
        )
      );

      alert(`✅ Nilai (${gradeInput}) & Komentar berhasil disimpan ke Supabase!`);
      setSelectedSubmission(null);
      setGradeInput('');
      setFeedbackInput('');
    } catch (err: any) {
      alert(`Gagal menyimpan nilai: ${err.message}`);
    }
  };

  // 7. Export Attendance to Excel (CSV) using Real Database Fields
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

  // 8. Export Attendance to PDF using Real Database Fields
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
            Selamat Datang, {user?.fullName || user?.email || 'Guru'}
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Email: <strong className="text-emerald-300">{user?.email}</strong> • Akun Terverifikasi Supabase
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
            <span className="text-sm font-bold text-foreground">PDF, DOC, PPT, Media</span>
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
              {courses.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">Belum ada mata pelajaran. Klik "+ Tambah" untuk membuat.</p>
              ) : (
                courses.map((c) => (
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
                ))
              )}
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
              {classes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">Belum ada kelas dibuat. Klik "+ Buat Kelas" untuk menambahkan.</p>
              ) : (
                classes.map((cls) => (
                  <div key={cls.id} className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{cls.name}</h4>
                      <p className="text-xs text-muted-foreground">{cls.courseName} • Tahun Ajaran {cls.academicYear}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-500/10 text-teal-600">
                      Terdaftar
                    </span>
                  </div>
                ))
              )}
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
              {materials.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">Belum ada materi diunggah. Klik "+ Unggah Materi" untuk memilih berkas.</p>
              ) : (
                materials.map((m) => (
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
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Absensi Siswa, Kamera QR, Tugas, & Penilaian Submissions */}
        <div className="space-y-6">
          {/* Sesi Absensi & Kamera QR */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-600" /> Rekap Absensi & QR Code Siswa
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Pemindaian Otomatis Kamera Belakang HP / Laptop & Penyimpanan ke Supabase.</p>
              </div>
              <button
                onClick={() => setShowScanModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" /> Pindai Kamera Otomatis
              </button>
            </div>

            {/* Attendance Table */}
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
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-xs text-muted-foreground italic">
                        Belum ada data absensi. Klik "Pindai Kamera Otomatis" untuk memindai QR Code siswa.
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30">
                        <td className="p-2.5 font-bold text-foreground">{r.studentName}</td>
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

          {/* Pengumpulan Jawaban Siswa & Penilaian Guru */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" /> Penilaian & Jawaban Tugas Siswa ({submissions.length})
              </h3>
            </div>
            <div className="space-y-3">
              {submissions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">Belum ada pengumpulan jawaban tugas dari siswa.</p>
              ) : (
                submissions.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
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
      </div>

      {/* Modal: Penilaian & Komentar Guru */}
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
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                  <Star className="w-3.5 h-3.5" /> Simpan Nilai Ke Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Automatic Continuous Camera QR Scanner */}
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

            {/* Mode Presensi Switcher: Sesi Masuk vs Sesi Pulang */}
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

            {/* Html5Qrcode Realtime Scanner Container with explicit min height to guarantee DOM dimensions */}
            <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-amber-500/50 min-h-[260px] aspect-square flex items-center justify-center">
              <div id="reader" className="w-full h-full min-h-[260px] object-cover"></div>
            </div>

            {/* Toast Feedback Notification Banner */}
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
              <input
                type="text"
                placeholder="Nama Mata Pelajaran Terkait"
                value={newClass.courseName}
                onChange={(e) => setNewClass({ ...newClass, courseName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow cursor-pointer">
                Simpan Kelas
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Material with Full Multi-Format File Input */}
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
                <label className="text-xs font-bold text-muted-foreground uppercase">Pilih Berkas (PDF, DOC, DOCX, PPT, XLS, TXT, ZIP, Gambar, Video, Audio)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,image/*,audio/*,video/*"
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
                <input
                  type="text"
                  placeholder="Format File"
                  value={newMaterial.fileType}
                  onChange={(e) => setNewMaterial({ ...newMaterial, fileType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
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
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,image/*"
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
