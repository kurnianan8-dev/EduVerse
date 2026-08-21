const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function debugStudentAssignments() {
  console.log('====================================================');
  console.log('🔎 DEBUGGING STUDENT ASSIGNMENTS QUERY');
  console.log('====================================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Sign in as Student
  const { data: studentAuth, error: studentErr } = await supabase.auth.signInWithPassword({
    email: 'siswa1@eduverse.io',
    password: 'SiswaPass2026!'
  });

  if (studentErr || !studentAuth.user) {
    console.error('❌ Student Auth error:', studentErr);
    return;
  }

  const userId = studentAuth.user.id;
  console.log('✅ Logged in as Student ID:', userId);

  // 2. Fetch Enrollments for Student
  console.log('\n--- 1. Fetching Enrollments for student_id:', userId, '---');
  let enrollQuery = await supabase.from('enrollments').select('class_id').eq('student_id', userId);
  if (enrollQuery.error || !enrollQuery.data || enrollQuery.data.length === 0) {
    console.log('Trying fallback query eq user_id...');
    enrollQuery = await supabase.from('enrollments').select('class_id').eq('user_id', userId);
  }

  console.log('Enrollments data:', enrollQuery.data, 'Error:', enrollQuery.error);

  const classIds = enrollQuery.data ? enrollQuery.data.map(e => e.class_id).filter(Boolean) : [];
  console.log('Class IDs found:', classIds);

  // 3. Fetch Classes for Student
  console.log('\n--- 2. Fetching Classes for classIds ---');
  const { data: clsData, error: clsErr } = await supabase.from('classes').select('*').in('id', classIds);
  console.log('Classes found:', clsData ? clsData.map(c => ({ id: c.id, name: c.name })) : [], 'Error:', clsErr);

  // 4. Fetch ALL assignments in database
  console.log('\n--- 3. Fetching ALL assignments in public.assignments ---');
  const { data: allAss, error: allAssErr } = await supabase.from('assignments').select('*');
  console.log('All Assignments in DB:', allAss, 'Error:', allAssErr);

  // 5. Fetch Assignments for student classIds
  console.log('\n--- 4. Fetching assignments for classIds:', classIds, '---');
  let assignmentsQuery = supabase.from('assignments').select('*').order('created_at', { ascending: false });
  if (classIds.length > 0) {
    assignmentsQuery = assignmentsQuery.in('class_id', classIds);
  }
  const { data: studentAss, error: assErr } = await assignmentsQuery;
  console.log('Assignments for Student classIds:', studentAss, 'Error:', assErr);

  // 6. Fetch Submissions for Student
  console.log('\n--- 5. Fetching Submissions for student_id:', userId, '---');
  const { data: subData, error: subErr } = await supabase.from('submissions').select('*').eq('student_id', userId);
  console.log('Submissions found for Student:', subData, 'Error:', subErr);

  console.log('====================================================');
}

debugStudentAssignments();
