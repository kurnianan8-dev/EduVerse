const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function probeDatabaseDesign() {
  console.log('====================================================');
  console.log('🔎 PROBING DATABASE DESIGN & TEACHER PAYLOAD CONSTRAINTS');
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

  if (!authRes.ok) {
    console.error('Auth error:', authRes.status, await authRes.text());
    return;
  }

  const authData = await authRes.json();
  const token = authData.access_token;
  const userId = authData.user.id;
  console.log('✅ Teacher JWT acquired. User ID:', userId);

  // 2. Fetch Teacher Profile from profiles table
  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });

  const profs = await profRes.json();
  console.log('\n--- 1. Teacher Profile Data ---');
  console.log(profs);

  // 3. Fetch Schools Table
  const schoolRes = await fetch(`${SUPABASE_URL}/rest/v1/schools?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });

  const schoolsText = await schoolRes.text();
  console.log('\n--- 2. Schools Table Query ---');
  console.log('HTTP Status:', schoolRes.status);
  console.log('Response:', schoolsText);

  // 4. Fetch Courses Table
  const courseRes = await fetch(`${SUPABASE_URL}/rest/v1/courses?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });

  const coursesText = await courseRes.text();
  console.log('\n--- 3. Courses Table Query ---');
  console.log('HTTP Status:', courseRes.status);
  console.log('Response:', coursesText);

  // 5. Test inserting a School and Course if none exist
  let validSchoolId = profs?.[0]?.school_id;
  let validCourseId = null;

  let schools = [];
  try { schools = JSON.parse(schoolsText); } catch(e) {}
  if (schools && schools.length > 0) {
    validSchoolId = schools[0].id;
  }

  let courses = [];
  try { courses = JSON.parse(coursesText); } catch(e) {}
  if (courses && courses.length > 0) {
    validCourseId = courses[0].id;
  }

  console.log('\nExisting validSchoolId:', validSchoolId, 'validCourseId:', validCourseId);

  // If schools table is empty, attempt creating a default school row
  if (!validSchoolId) {
    console.log('\n📌 Attempting to seed a default row into "schools" table...');
    const createSchoolRes = await fetch(`${SUPABASE_URL}/rest/v1/schools`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: 'SMK EduVerse Indonesia',
        code: 'SCH-EDU-01',
        address: 'Jakarta, Indonesia'
      })
    });
    console.log('Create School Status:', createSchoolRes.status);
    const createdSchoolText = await createSchoolRes.text();
    console.log('Create School Response:', createdSchoolText);
    try {
      const createdSchools = JSON.parse(createdSchoolText);
      if (createdSchools && createdSchools.length > 0) validSchoolId = createdSchools[0].id;
    } catch(e) {}
  }

  // If courses table is empty, attempt creating a default course row
  if (!validCourseId) {
    console.log('\n📌 Attempting to seed a default row into "courses" table...');
    const createCourseRes = await fetch(`${SUPABASE_URL}/rest/v1/courses`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        code: 'MAT-GENERAL',
        name: 'Mata Pelajaran Umum'
      })
    });
    console.log('Create Course Status:', createCourseRes.status);
    const createdCourseText = await createCourseRes.text();
    console.log('Create Course Response:', createdCourseText);
    try {
      const createdCourses = JSON.parse(createdCourseText);
      if (createdCourses && createdCourses.length > 0) validCourseId = createdCourses[0].id;
    } catch(e) {}
  }

  // 6. Test Teacher Class INSERT with validSchoolId and validCourseId
  console.log('\n📌 Testing Teacher Class INSERT with validSchoolId & validCourseId...');
  const testCode = 'EDU' + Math.floor(1000 + Math.random() * 9000);
  const classPayload = {
    name: `Kelas XII TKJ 1 [${testCode}]`,
    code: testCode,
    class_code: testCode,
    teacher_id: userId,
    school_id: validSchoolId,
    course_id: validCourseId,
    course_name: 'Pemrograman Web & Jaringan',
    description: 'Kelas Pembelajaran Interaktif LMS',
    jurusan: 'TKJ',
    semester: 'Ganjil',
    academic_year: '2026/2027',
    is_active: true
  };

  console.log('Class INSERT Payload:', JSON.stringify(classPayload, null, 2));

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/classes`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(classPayload)
  });

  console.log('Class INSERT Status:', insertRes.status);
  const insertText = await insertRes.text();
  console.log('Class INSERT Response:', insertText);

  if (insertRes.ok) {
    const insertedClass = JSON.parse(insertText)[0];
    console.log('\n🎉 SUCCESS! CLASS CREATED & PERMANENTLY SAVED IN SUPABASE DB!');
    console.log('Row ID:', insertedClass.id);
    console.log('Saved Code:', insertedClass.code || insertedClass.class_code);

    // 7. Verify Student SELECT lookup
    console.log(`\n🔍 Verifying Student SELECT lookup for code: "${testCode}"...`);
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
  }

  console.log('\n====================================================');
}

probeDatabaseDesign();
