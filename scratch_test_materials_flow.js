const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function testMaterialsFlow() {
  console.log('====================================================');
  console.log('🧪 TESTING MATERIALS INSERT & SELECT FLOW');
  console.log('====================================================\n');

  // 1. Authenticate Teacher
  const teacherAuth = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@eduverse.io', password: 'SuperAdmin2026!' })
  });

  if (!teacherAuth.ok) {
    console.error('Teacher Auth Failed:', teacherAuth.status, await teacherAuth.text());
    return;
  }

  const teacherData = await teacherAuth.json();
  const teacherToken = teacherData.access_token;
  const teacherId = teacherData.user.id;
  console.log('✅ 1. Teacher Logged In. ID:', teacherId);

  // 2. Fetch existing classes to get a valid class_id
  const classRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${teacherToken}` }
  });

  const classes = await classRes.json();
  console.log(`Classes count in DB: ${classes.length}`);

  let testClassId = classes?.[0]?.id;
  if (!testClassId) {
    console.error('No classes found in DB. Creating test class...');
    // Create school & course & class if needed
    const schRes = await fetch(`${SUPABASE_URL}/rest/v1/schools?select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${teacherToken}` }
    });
    const schools = await schRes.json();
    const schoolId = schools?.[0]?.id;

    const crsRes = await fetch(`${SUPABASE_URL}/rest/v1/courses?select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${teacherToken}` }
    });
    const courses = await crsRes.json();
    const courseId = courses?.[0]?.id;

    const newClsRes = await fetch(`${SUPABASE_URL}/rest/v1/classes`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${teacherToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: 'Kelas Agama Buddha [EDUBUD1]',
        code: 'EDUBUD1',
        class_code: 'EDUBUD1',
        school_id: schoolId,
        course_id: courseId,
        teacher_id: teacherId,
        academic_year: '2026/2027'
      })
    });
    const newCls = await newClsRes.json();
    testClassId = newCls?.[0]?.id;
  }

  console.log('✅ 2. Target Class ID:', testClassId);

  // 3. Insert Material as Teacher
  console.log('\n📌 3. Teacher Uploads Material into class_id:', testClassId);
  const matTitle = 'Pengenalan Pendidikan Agama Buddha ' + Date.now();
  const matPayload = {
    class_id: testClassId,
    teacher_id: teacherId,
    title: matTitle,
    file_type: 'pdf',
    file_url: 'https://sgeuusdwmulifctzvnic.supabase.co/storage/v1/object/public/materials/sample_agama.pdf',
    description: 'Modul Bab 1 Pembelajaran Agama Buddha'
  };

  const matInsertRes = await fetch(`${SUPABASE_URL}/rest/v1/materials`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${teacherToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(matPayload)
  });

  console.log('Material INSERT Status:', matInsertRes.status);
  const matInsertText = await matInsertRes.text();
  console.log('Material INSERT Response:', matInsertText);

  if (!matInsertRes.ok) {
    console.error('❌ Material INSERT failed in Supabase!');
    return;
  }

  const createdMat = JSON.parse(matInsertText)[0];
  console.log('🎉 Material Created ID:', createdMat.id);

  // 4. Query Materials as Authenticated User (Student View)
  console.log(`\n🔍 4. Student queries "materials" for class_id: "${testClassId}"...`);
  const studentMatRes = await fetch(`${SUPABASE_URL}/rest/v1/materials?class_id=eq.${testClassId}&select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${teacherToken}`
    }
  });

  console.log('Student SELECT Status:', studentMatRes.status);
  const studentMatText = await studentMatRes.text();
  console.log('Student SELECT Response:', studentMatText);

  const studentMats = JSON.parse(studentMatText);
  console.log(`\n✅ Total materials fetched for class: ${studentMats.length}`);

  console.log('\n====================================================');
}

testMaterialsFlow();
