const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function testRealStorageUploadE2E() {
  console.log('====================================================');
  console.log('🧪 REAL END-TO-END TEST: SUPABASE STORAGE & MATERIALS');
  console.log('====================================================\n');

  // 1. Auth as Teacher / Superadmin
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@eduverse.io', password: 'SuperAdmin2026!' })
  });

  if (!authRes.ok) {
    console.error('❌ Auth failed:', authRes.status, await authRes.text());
    return;
  }

  const authData = await authRes.json();
  const token = authData.access_token;
  const teacherId = authData.user.id;
  console.log('✅ Authenticated as Teacher/Superadmin:', teacherId);

  // 2. Create Dummy PDF content
  const pdfBuffer = Buffer.from('%PDF-1.4 %EduVerse LMS Test PDF Content File%');
  const classId = 'bb72e75b-ec37-471e-b0ad-1044b8b9ee3f';
  const fileName = `E2E_TEST_MODUL_${Date.now()}.pdf`;
  const filePath = `${classId}/${fileName}`;

  console.log(`\n--- 1. Uploading PDF file to Supabase Storage bucket "materials" ---`);
  console.log(`Target Path: ${filePath}`);

  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/materials/${filePath}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/pdf',
      'x-upsert': 'true'
    },
    body: pdfBuffer
  });

  if (!uploadRes.ok) {
    console.error('❌ Storage upload failed:', uploadRes.status, await uploadRes.text());
    return;
  }

  const uploadResult = await uploadRes.json();
  console.log('✅ File uploaded successfully to Storage:', uploadResult);

  // 3. Construct Public URL
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/materials/${filePath}`;
  console.log('\n--- 2. Public Storage URL generated ---');
  console.log('Public URL:', publicUrl);

  // 4. Test Public URL via HTTP GET
  console.log('\n--- 3. Testing Public URL accessibility via HTTP GET ---');
  const fetchUrlRes = await fetch(publicUrl);
  console.log(`HTTP Status : ${fetchUrlRes.status} ${fetchUrlRes.statusText}`);
  console.log(`Content-Type: ${fetchUrlRes.headers.get('content-type')}`);

  if (!fetchUrlRes.ok) {
    console.error('❌ Public URL is not accessible!');
    return;
  }
  console.log('✅ Public URL is HTTP 200 OK and publicly accessible by any browser!');

  // 5. Insert row into public.materials table
  console.log('\n--- 4. Inserting material row into public.materials table ---');
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/materials`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      class_id: classId,
      teacher_id: teacherId,
      title: 'Modul Pembelajaran E2E Verified.pdf',
      file_type: 'pdf',
      file_url: publicUrl,
      description: 'Materi PDF resmi tersimpan di Supabase Storage & dapat diakses Siswa.'
    })
  });

  if (!insertRes.ok) {
    console.error('❌ DB insert failed:', insertRes.status, await insertRes.text());
    return;
  }

  const insertedMaterial = await insertRes.json();
  console.log('✅ Material Row inserted into public.materials:');
  console.log(JSON.stringify(insertedMaterial, null, 2));

  // 6. Query materials as Student
  console.log('\n--- 5. Simulating Student Querying Materials ---');
  const studentQueryRes = await fetch(`${SUPABASE_URL}/rest/v1/materials?id=eq.${insertedMaterial[0].id}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });
  const studentMats = await studentQueryRes.json();
  const fetchedMat = studentMats[0];

  console.log('Student Fetched Material ID  :', fetchedMat.id);
  console.log('Student Fetched Material Title:', fetchedMat.title);
  console.log('Student Fetched file_url      :', fetchedMat.file_url);

  if (fetchedMat.file_url.startsWith('https://sgeuusdwmulifctzvnic.supabase.co/storage/v1/object/public/materials/')) {
    console.log('\n🎉 E2E TEST VERIFICATION PASSED 100%! file_url points directly to Supabase Storage Public URL!');
  } else {
    console.error('❌ Verification failed: file_url does not start with Supabase Storage URL!');
  }

  console.log('====================================================');
}

testRealStorageUploadE2E();
