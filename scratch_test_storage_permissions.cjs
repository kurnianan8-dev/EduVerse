const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function testStoragePermissions() {
  console.log('====================================================');
  console.log('🧪 TESTING STORAGE BUCKET "materials" PERMISSIONS');
  console.log('====================================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Sign in as Teacher / Superadmin
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'superadmin@eduverse.io',
    password: 'SuperAdmin2026!'
  });

  if (authErr || !authData.user) {
    console.error('❌ Auth Error:', authErr);
    return;
  }
  console.log('✅ Logged in as User ID:', authData.user.id);

  // 2. List buckets
  console.log('\n--- 1. Checking Storage Buckets ---');
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  console.log('Buckets list result:', buckets, 'Error:', bucketErr);

  // 3. Test uploading file
  const classId = 'bb72e75b-ec37-471e-b0ad-1044b8b9ee3f';
  const filePath = `${classId}/${Date.now()}_test_permission.pdf`;
  const fileBuffer = Buffer.from('%PDF-1.4 %Test PDF file content%');

  console.log('\n--- 2. Attempting Upload to bucket "materials", path:', filePath);
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('materials')
    .upload(filePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });

  console.log('Upload Data :', uploadData);
  console.log('Upload Error:', uploadErr);

  if (uploadErr) {
    console.error('❌ Upload failed! Reason:', uploadErr.message);
  } else {
    console.log('✅ Upload SUCCEEDED!');
    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(filePath);
    console.log('Public URL:', urlData?.publicUrl);

    // Test HTTP GET accessibility
    console.log('\n--- 3. Testing Public URL accessibility via HTTP GET ---');
    const httpRes = await fetch(urlData.publicUrl);
    console.log('HTTP Status:', httpRes.status, httpRes.statusText);
    console.log('Content-Type:', httpRes.headers.get('content-type'));
    if (httpRes.ok) {
      console.log('🎉 PUBLIC URL IS ACCESSIBLE! HTTP 200 OK!');
    } else {
      console.error('❌ HTTP status is not 200 OK:', await httpRes.text());
    }
  }

  console.log('====================================================');
}

testStoragePermissions();
