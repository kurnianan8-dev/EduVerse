const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function testInsertWithSchoolId() {
  console.log('====================================================');
  console.log('🧪 TESTING TEACHER INSERT WITH school_id');
  console.log('====================================================\n');

  // 1. Authenticate
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
  console.log('✅ Teacher Auth Token Acquired. User ID:', userId);

  // 2. Fetch teacher profile to check if profile has school_id
  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });

  const profData = await profRes.json();
  console.log('Teacher Profile:', profData);
  const userSchoolId = profData?.[0]?.school_id || '00000000-0000-0000-0000-000000000001';
  console.log('Using school_id:', userSchoolId);

  // 3. Test insert with school_id & code EDU0ZLFQ
  const testPayload = {
    name: 'Kelas XI TKJ 1 [EDU0ZLFQ]',
    code: 'EDU0ZLFQ',
    class_code: 'EDU0ZLFQ',
    school_id: userSchoolId,
    teacher_id: userId,
    course_name: 'Pemrograman Web',
    description: 'Kelas Praktikum Web',
    jurusan: 'TKJ',
    semester: 'Ganjil',
    academic_year: '2026/2027',
    is_active: true
  };

  console.log('\n📌 Attempting Class INSERT into Supabase DB...');
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/classes`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(testPayload)
  });

  console.log('INSERT Status:', insertRes.status);
  const insertText = await insertRes.text();
  console.log('INSERT Response:', insertText);

  if (insertRes.ok) {
    const createdClass = JSON.parse(insertText)[0];
    console.log('\n🎉 SUCCESS! Class inserted into Supabase DB!');
    console.log('Created Class Row:', createdClass);

    // 4. Test Student SELECT query
    console.log('\n🔍 Testing Student SELECT query for EDU0ZLFQ...');
    const searchRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    const studentRows = await searchRes.json();
    const found = studentRows.find(r => {
      const cCode = (r.code || r.class_code || '').toString().trim().toUpperCase();
      const cName = (r.name || '').toString().trim().toUpperCase();
      return cCode === 'EDU0ZLFQ' || cName.includes('EDU0ZLFQ');
    });

    console.log('✅ Student Lookup Result:', found ? { id: found.id, name: found.name, code: found.code } : 'NOT FOUND');
  }

  console.log('\n====================================================');
}

testInsertWithSchoolId();
