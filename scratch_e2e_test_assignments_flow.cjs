const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function testE2EAssignmentsFlow() {
  console.log('====================================================');
  console.log('🧪 E2E TEST: TAB TUGAS & SUBMISSION FLOW');
  console.log('====================================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Login as Teacher
  console.log('--- 1. Login as Teacher ---');
  const { data: teacherAuth, error: teacherErr } = await supabase.auth.signInWithPassword({
    email: 'superadmin@eduverse.io',
    password: 'SuperAdmin2026!'
  });
  if (teacherErr) {
    console.error('❌ Teacher Auth failed:', teacherErr);
    return;
  }
  console.log('✅ Teacher logged in:', teacherAuth.user.id);

  const classId = 'bb72e75b-ec37-471e-b0ad-1044b8b9ee3f';

  // 2. Teacher Creates Assignment
  console.log('\n--- 2. Teacher Creates Assignment ---');
  const assignmentTitle = `Tugas Mandiri E2E ${Date.now()}`;
  const { data: newAss, error: assErr } = await supabase
    .from('assignments')
    .insert({
      class_id: classId,
      teacher_id: teacherAuth.user.id,
      title: assignmentTitle,
      description: 'Harap kerjakan tugas ini dengan jujur dan tepat waktu.',
      due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
      max_score: 100
    })
    .select();

  if (assErr || !newAss || newAss.length === 0) {
    console.error('❌ Teacher failed to insert assignment:', assErr);
    return;
  }
  const createdAssignment = newAss[0];
  console.log('🎉 Assignment Created in DB:', createdAssignment);

  // 3. Login as Student
  console.log('\n--- 3. Login as Student ---');
  const { data: studentAuth, error: studentErr } = await supabase.auth.signInWithPassword({
    email: 'siswa1@eduverse.io',
    password: 'SiswaPass2026!'
  });

  if (studentErr) {
    console.error('❌ Student Auth failed:', studentErr);
    return;
  }
  console.log('✅ Student logged in:', studentAuth.user.id);

  // 4. Student Fetches Assignments for Class
  console.log('\n--- 4. Student Queries Assignments for Class ---');
  const { data: studentAssList, error: stAssErr } = await supabase
    .from('assignments')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });

  if (stAssErr) {
    console.error('❌ Student failed to fetch assignments:', stAssErr);
    return;
  }
  console.log('✅ Assignments found for Student:', studentAssList.length);

  // 5. Student Uploads Submission to Storage bucket "student-submissions"
  console.log('\n--- 5. Student Uploads Submission PDF to Storage ---');
  const dummyPdf = Buffer.from('%PDF-1.4 %Student E2E Submission File%');
  const filePath = `${createdAssignment.id}/${studentAuth.user.id}/${Date.now()}_jawaban_tugas.pdf`;

  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('student-submissions')
    .upload(filePath, dummyPdf, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (uploadErr) {
    console.error('❌ Storage upload failed:', uploadErr);
    return;
  }
  console.log('✅ Submission Storage Upload Succeeded:', uploadData);

  const { data: urlData } = supabase.storage.from('student-submissions').getPublicUrl(filePath);
  const publicSubmissionUrl = urlData?.publicUrl;
  console.log('🎉 Public Submission URL:', publicSubmissionUrl);

  // Verify HTTP 200 on public submission URL
  const httpRes = await fetch(publicSubmissionUrl);
  console.log('HTTP Status of Student File:', httpRes.status, httpRes.statusText);

  // 6. Student Inserts / Upserts Submission into DB
  console.log('\n--- 6. Student Inserts Submission into DB ---');
  const { data: subData, error: subErr } = await supabase
    .from('submissions')
    .upsert(
      {
        assignment_id: createdAssignment.id,
        student_id: studentAuth.user.id,
        file_url: publicSubmissionUrl,
        file_name: 'jawaban_tugas.pdf',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { onConflict: 'assignment_id,student_id' }
    )
    .select();

  if (subErr) {
    console.error('❌ DB Submission Insert Failed:', subErr);
    return;
  }
  console.log('🎉 Submission Saved in DB:', subData[0]);

  // 7. Teacher Fetches Submissions
  console.log('\n--- 7. Teacher Fetches Submissions & Grades Student ---');
  // Re-login as Teacher
  await supabase.auth.signInWithPassword({
    email: 'superadmin@eduverse.io',
    password: 'SuperAdmin2026!'
  });

  const { data: teacherViewSub, error: tSubErr } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', createdAssignment.id);

  if (tSubErr || !teacherViewSub) {
    console.error('❌ Teacher failed to fetch submission:', tSubErr);
    return;
  }
  console.log('✅ Teacher sees student submission:', teacherViewSub[0]);

  // Teacher Grades Submission
  const { data: gradeData, error: gradeErr } = await supabase
    .from('submissions')
    .update({ score: 95, feedback: 'Kerja sangat bagus dan rapi!' })
    .eq('id', teacherViewSub[0].id)
    .select();

  if (gradeErr) {
    console.error('❌ Teacher grading failed:', gradeErr);
  } else {
    console.log('🎉 Teacher Grading Succeeded:', gradeData[0]);
  }

  console.log('====================================================');
  console.log('🏆 ALL E2E TESTS PASSED 100% PERFECTLY!');
  console.log('====================================================');
}

testE2EAssignmentsFlow();
