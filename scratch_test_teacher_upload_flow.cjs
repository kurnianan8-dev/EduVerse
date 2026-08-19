const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function testTeacherUploadFlow() {
  console.log('====================================================');
  console.log('🧪 TESTING TEACHER UPLOAD FLOW');
  console.log('====================================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Sign in as Teacher
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'superadmin@eduverse.io',
    password: 'SuperAdmin2026!'
  });

  if (authErr || !authData.user) {
    console.error('❌ Auth error:', authErr);
    return;
  }

  console.log('✅ Logged in as Teacher/Superadmin:', authData.user.id);

  // 2. Test uploading file to Supabase Storage bucket "materials"
  const dummyBuffer = Buffer.from('%PDF-1.4 %EduVerse LMS Test File%');
  const classId = 'bb72e75b-ec37-471e-b0ad-1044b8b9ee3f';
  const filePath = `${classId}/${Date.now()}_test_upload.pdf`;

  console.log('\n--- 1. Testing Storage Upload to bucket "materials" ---');
  console.log('Target Path:', filePath);

  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('materials')
    .upload(filePath, dummyBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (uploadErr) {
    console.error('❌ Storage upload failed:', uploadErr);
  } else {
    console.log('✅ Storage upload SUCCEEDED:', uploadData);

    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(filePath);
    console.log('🎉 Public URL generated:', urlData?.publicUrl);

    // Test insert into public.materials table
    console.log('\n--- 2. Testing Insert into public.materials ---');
    const { data: matData, error: matErr } = await supabase
      .from('materials')
      .insert({
        class_id: classId,
        teacher_id: authData.user.id,
        title: 'Materi Test Teacher Upload.pdf',
        file_type: 'pdf',
        file_url: urlData?.publicUrl,
        description: 'Test upload dari Teacher Dashboard'
      })
      .select();

    if (matErr) {
      console.error('❌ DB insert failed:', matErr);
    } else {
      console.log('🎉 DB insert SUCCEEDED:', matData);
    }
  }

  console.log('====================================================');
}

testTeacherUploadFlow();
