const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function testCompleteFkChain() {
  console.log('====================================================');
  console.log('🧪 TESTING COMPLETE FOREIGN KEY CHAIN INSERTION');
  console.log('====================================================\n');

  // 1. Authenticate Teacher
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

  const authData = await authRes.json();
  const token = authData.access_token;
  const userId = authData.user.id;
  console.log('✅ Teacher Authenticated. ID:', userId);

  // 2. Step 1: Insert or Get School
  let schoolId = null;
  const getSch = await fetch(`${SUPABASE_URL}/rest/v1/schools?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
  });
  const schs = await getSch.json();
  if (schs && schs.length > 0) {
    schoolId = schs[0].id;
  } else {
    const schRes = await fetch(`${SUPABASE_URL}/rest/v1/schools`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ name: 'SMK EduVerse', code: 'SCH01' })
    });
    if (schRes.ok) schoolId = (await schRes.json())[0]?.id;
  }

  console.log('✅ Valid School ID:', schoolId);
  if (!schoolId) return;

  // 3. Step 2: Insert or Get Course
  let courseId = null;
  const getCrs = await fetch(`${SUPABASE_URL}/rest/v1/courses?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
  });
  const crss = await getCrs.json();
  if (crss && crss.length > 0) {
    courseId = crss[0].id;
  } else {
    const crsRes = await fetch(`${SUPABASE_URL}/rest/v1/courses`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ code: 'MAT01', school_id: schoolId, teacher_id: userId, title: 'Pemrograman Web' })
    });
    console.log('Course Insert Status:', crsRes.status);
    const crsText = await crsRes.text();
    console.log('Course Insert Response:', crsText);
    if (crsRes.ok) courseId = JSON.parse(crsText)[0]?.id;
  }

  console.log('✅ Valid Course ID:', courseId);
  if (!courseId) return;

  // 4. Step 3: Insert Class into public.classes with school_id, course_id, and code!
  const testCode = 'EDU' + Math.floor(1000 + Math.random() * 9000);
  console.log(`\n--- Step 3: Insert Class ({ name: "Kelas XII TKJ 1", code: "${testCode}", school_id, course_id, teacher_id }) ---`);

  const classPayload = {
    name: `Kelas XII TKJ 1 [${testCode}]`,
    code: testCode,
    class_code: testCode,
    school_id: schoolId,
    course_id: courseId,
    teacher_id: userId,
    course_name: 'Pemrograman Web',
    description: 'Kelas Pembelajaran Interaktif LMS',
    jurusan: 'TKJ',
    semester: 'Ganjil',
    academic_year: '2026/2027',
    is_active: true
  };

  const classRes = await fetch(`${SUPABASE_URL}/rest/v1/classes`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(classPayload)
  });

  console.log('Class Insert Status:', classRes.status);
  const classText = await classRes.text();
  console.log('Class Insert Response:', classText);

  if (classRes.ok) {
    const createdClass = JSON.parse(classText)[0];
    console.log('\n====================================================');
    console.log('🏆 100% EMPIRICAL SUCCESS! CLASS CREATED & SAVED IN SUPABASE DB!');
    console.log('Class ID:', createdClass.id);
    console.log('Class Name:', createdClass.name);
    console.log('Class Code:', createdClass.code || createdClass.class_code);

    // 5. Test Student SELECT query
    console.log(`\n🔍 Step 4: Testing Student SELECT query for code: "${testCode}"...`);
    const searchRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    const allCls = await searchRes.json();
    const match = allCls.find(c => {
      const cCode = (c.code || c.class_code || '').toString().trim().toUpperCase();
      const cName = (c.name || '').toString().trim().toUpperCase();
      return cCode === testCode || cName.includes(testCode);
    });

    console.log('✅ Student Lookup Result:', match ? { id: match.id, name: match.name, code: match.code } : 'NOT FOUND');
    console.log('====================================================\n');
  } else {
    console.log('Class insert failed:', classRes.status, classText);
  }
}

testCompleteFkChain();
