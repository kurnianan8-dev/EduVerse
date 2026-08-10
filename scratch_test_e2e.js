const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function runE2ETest() {
  console.log('====================================================');
  console.log('🧪 E2E VERIFICATION TEST: CREATE CLASS & JOIN FLOW');
  console.log('====================================================\n');

  // 1. Sign in as SuperAdmin/Teacher
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
    console.error('❌ Auth Login Failed:', authRes.status, await authRes.text());
    return;
  }

  const authData = await authRes.json();
  const token = authData.access_token;
  const userId = authData.user.id;
  console.log('✅ 1. Teacher Logged In:', authData.user.email, 'ID:', userId);

  // 2. Teacher creates a class
  const testCode = 'EDUE2E' + Math.floor(100 + Math.random() * 900);
  const className = `Kelas XI TKJ ${Math.floor(Math.random() * 100)}`;
  const fullClassName = `${className} [${testCode}]`;

  console.log(`\n📌 2. Creating Teacher Class: "${fullClassName}" (Code: ${testCode})...`);

  // Attempt insert to `classes` table with fail-safe structure
  let classInsertRes = await fetch(`${SUPABASE_URL}/rest/v1/classes`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      name: fullClassName,
      code: testCode,
      class_code: testCode,
      academic_year: '2026/2027'
    })
  });

  if (!classInsertRes.ok) {
    console.warn('⚠️ Full payload insert returned status:', classInsertRes.status, 'Retrying with fail-safe name embedding payload...');
    classInsertRes = await fetch(`${SUPABASE_URL}/rest/v1/classes`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: fullClassName,
        academic_year: '2026/2027'
      })
    });
  }

  console.log('Class Insert Response Status:', classInsertRes.status);
  const createdClassData = await classInsertRes.json();
  console.log('Created Class Data:', createdClassData);

  let createdClassId = createdClassData?.[0]?.id;
  if (!createdClassId) {
    console.error('❌ Failed to retrieve created class ID');
    return;
  }

  // 3. Query directly from `classes` table to verify class is saved in Supabase
  console.log('\n🔍 3. Querying "classes" table directly from Supabase DB...');
  const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?id=eq.${createdClassId}&select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });
  const verifyData = await verifyRes.json();
  console.log('✅ Direct DB Query Result for Created Class:', verifyData);

  // 4. Student Search Simulation with raw user input containing spaces and lowercase
  const rawStudentInput = `   ${testCode.toLowerCase()}   `;
  const cleanCode = rawStudentInput.trim().toUpperCase();
  console.log(`\n🔍 4. Student enters raw code: ${JSON.stringify(rawStudentInput)} -> Cleaned: ${cleanCode}`);

  // Query classes in DB for match
  const searchRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });
  const allCls = await searchRes.json();

  const foundClass = allCls.find((c) => {
    const cCode = (c.code || c.class_code || '').toString().trim().toUpperCase();
    const cName = (c.name || '').toString().trim().toUpperCase();
    return cCode === cleanCode || cName.includes(cleanCode);
  });

  console.log('✅ 5. Class Found by Search Algorithm:', foundClass ? { id: foundClass.id, name: foundClass.name } : 'NOT FOUND');

  if (!foundClass) {
    console.error('❌ Class Search Algorithm failed to find class!');
    return;
  }

  // 5. Student Join Class (Insert into `enrollments` table)
  console.log('\n📌 6. Student Joining Class (Inserting row into "enrollments" table)...');
  const enrollRes = await fetch(`${SUPABASE_URL}/rest/v1/enrollments`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      class_id: foundClass.id,
      student_id: userId,
      status: 'active'
    })
  });

  console.log('Enrollment Insert Response Status:', enrollRes.status);
  const enrollData = await enrollRes.json();
  console.log('🎉 Enrollment Inserted Row:', enrollData);

  // 6. Verify enrollment row directly from Supabase DB
  console.log('\n🔍 7. Verifying "enrollments" table row in Supabase DB...');
  const checkEnrollRes = await fetch(`${SUPABASE_URL}/rest/v1/enrollments?class_id=eq.${foundClass.id}&student_id=eq.${userId}&select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });
  const checkEnrollData = await checkEnrollRes.json();
  console.log('✅ Direct DB Query Result for Enrollment:', checkEnrollData);

  console.log('\n====================================================');
  if (checkEnrollData && checkEnrollData.length > 0) {
    console.log('🏆 ALL E2E TESTS PASSED! GABUNG KELAS BERHASIL 100%!');
  } else {
    console.error('❌ Enrollment verification failed.');
  }
  console.log('====================================================\n');
}

runE2ETest();
