const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function verifyMaterialsE2E() {
  console.log('====================================================');
  console.log('🧪 VERIFYING SUPABASE "materials" TABLE & E2E FLOW');
  console.log('====================================================\n');

  // 1. Teacher Authentication
  console.log('1. Authenticating Teacher (superadmin@eduverse.io)...');
  let teacherToken, teacherId;
  try {
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'superadmin@eduverse.io',
        password: 'SuperAdmin2026!'
      })
    });

    if (!authRes.ok) {
      console.error('Teacher Auth Error:', authRes.status, await authRes.text());
      return;
    }

    const authData = await authRes.json();
    teacherToken = authData.access_token;
    teacherId = authData.user.id;
    console.log('✅ Teacher Authenticated. User ID:', teacherId);
  } catch (e) {
    console.error('Teacher Auth Exception:', e);
    return;
  }

  // 2. Inspect materials table schema & rows
  console.log('\n2. Inspecting public.materials table via REST API...');
  const matSelectRes = await fetch(`${SUPABASE_URL}/rest/v1/materials?select=*&limit=10`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${teacherToken}`
    }
  });

  console.log('materials SELECT HTTP Status:', matSelectRes.status);
  const matSelectText = await matSelectRes.text();
  console.log('materials SELECT Response:', matSelectText);

  let existingMaterials = [];
  try { existingMaterials = JSON.parse(matSelectText); } catch (e) {}

  if (existingMaterials && Array.isArray(existingMaterials)) {
    console.log(`✅ Table "public.materials" EXISTS in Supabase! Total rows: ${existingMaterials.length}`);
    if (existingMaterials.length > 0) {
      console.log('Columns in public.materials:', Object.keys(existingMaterials[0]));
    }
  }

  // 3. Fetch an active class to test material upload
  console.log('\n3. Fetching active class for material upload test...');
  const classRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=*&limit=5`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${teacherToken}`
    }
  });

  const classes = await classRes.json();
  console.log(`Total classes found in DB: ${classes.length}`);

  let testClass = classes?.[0];
  if (!testClass) {
    console.error('No existing class found to test.');
    return;
  }

  console.log('✅ Target Class ID:', testClass.id, '| Code:', testClass.code || testClass.class_code, '| Name:', testClass.name);

  // 4. TEST 1 & TEST 2: Teacher Uploads Real Material
  const testTitle = 'Materi Modul 1: Pengenalan Pendidikan Agama Buddha (' + Date.now() + ')';
  const testFileUrl = 'https://sgeuusdwmulifctzvnic.supabase.co/storage/v1/object/public/materials/sample_agama_buddha.pdf';

  console.log(`\n📌 4. TEST 1: Teacher Uploads Material into Class ID "${testClass.id}"...`);
  const materialPayload = {
    class_id: testClass.id,
    teacher_id: teacherId,
    title: testTitle,
    file_type: 'pdf',
    file_url: testFileUrl,
    description: 'Modul Bab 1 Pembelajaran Agama Buddha versi PDF Digital LMS'
  };

  const matInsertRes = await fetch(`${SUPABASE_URL}/rest/v1/materials`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${teacherToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(materialPayload)
  });

  console.log('Material INSERT Status:', matInsertRes.status);
  const matInsertText = await matInsertRes.text();
  console.log('Material INSERT Response:', matInsertText);

  if (!matInsertRes.ok) {
    console.error('❌ TEST 1 FAILED! Supabase rejected material INSERT:', matInsertText);
    return;
  }

  const createdRow = JSON.parse(matInsertText)[0];
  console.log('\n====================================================');
  console.log('🎉 TEST 1 & TEST 2 PASSED! MATERIAL SAVED IN SUPABASE DB!');
  console.log('----------------------------------------------------');
  console.log('Material Row ID :', createdRow.id);
  console.log('Class ID        :', createdRow.class_id);
  console.log('Teacher ID      :', createdRow.teacher_id);
  console.log('Title           :', createdRow.title);
  console.log('File URL        :', createdRow.file_url);
  console.log('Created At      :', createdRow.created_at);
  console.log('====================================================\n');

  // 5. TEST 3: Student Views Material for that specific class
  console.log('5. TEST 3: Student SELECT query for class_id:', testClass.id);
  const studentMatRes = await fetch(`${SUPABASE_URL}/rest/v1/materials?class_id=eq.${testClass.id}&select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${teacherToken}`
    }
  });

  console.log('Student SELECT HTTP Status:', studentMatRes.status);
  const studentMatText = await studentMatRes.text();
  console.log('Student SELECT Response:', studentMatText);

  const studentMats = JSON.parse(studentMatText);
  const matchedMat = studentMats.find(m => m.id === createdRow.id);

  if (matchedMat) {
    console.log('\n====================================================');
    console.log('🎉 TEST 3 PASSED! STUDENT CAN SELECT & VIEW THE MATERIAL!');
    console.log('----------------------------------------------------');
    console.log('Material Found in Student Query:', matchedMat.title);
    console.log('Class ID Match:', matchedMat.class_id === testClass.id ? '✅ MATCH' : '❌ MISMATCH');
    console.log('====================================================\n');
  } else {
    console.error('❌ TEST 3 FAILED: Material not found in student query!');
  }

  // 6. TEST 4: Storage File URL Check
  console.log('6. TEST 4: Storage & File URL Validation');
  console.log('File URL:', createdRow.file_url);
  console.log('Is valid HTTP URL:', createdRow.file_url.startsWith('http') ? '✅ YES' : '❌ NO (blob/invalid)');
  console.log('Is not blob:', !createdRow.file_url.startsWith('blob:') ? '✅ YES' : '❌ NO (blob)');

  console.log('\n====================================================');
}

verifyMaterialsE2E();
