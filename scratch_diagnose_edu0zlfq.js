const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function diagnoseEDU0ZLFQ() {
  console.log('====================================================');
  console.log('🔍 DIAGNOSING "public.classes" & CODE "EDU0ZLFQ"');
  console.log('====================================================\n');

  // 1. Authenticate as SuperAdmin/Teacher
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
  console.log('✅ Auth Token Acquired for User ID:', authData.user.id);

  // A. Check if ANY rows exist in public.classes
  console.log('\n--- DIAGNOSIS A: All Rows in public.classes ---');
  const allRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });

  console.log('SELECT All Status:', allRes.status);
  const allRowsText = await allRes.text();
  console.log('SELECT All Response:', allRowsText);

  let rows = [];
  try { rows = JSON.parse(allRowsText); } catch (e) {}

  console.log(`\nA. Total rows in DB: ${rows.length}`);

  // B. Check if code EDU0ZLFQ exists in DB
  console.log('\n--- DIAGNOSIS B: Searching specifically for EDU0ZLFQ ---');
  const foundCodeRow = rows.find(r => {
    const codeVal = (r.code || r.class_code || '').toString().trim().toUpperCase();
    const nameVal = (r.name || '').toString().trim().toUpperCase();
    return codeVal === 'EDU0ZLFQ' || nameVal.includes('EDU0ZLFQ');
  });

  console.log('B. Found EDU0ZLFQ Row in DB?:', foundCodeRow ? foundCodeRow : 'NOT FOUND IN DATABASE!');

  // C. Test inserting a row as Teacher right now with full payload
  console.log('\n--- DIAGNOSIS C: Test Teacher INSERT with full payload ---');
  const testPayload = {
    name: 'Kelas XI TKJ 1 [EDU0ZLFQ]',
    code: 'EDU0ZLFQ',
    class_code: 'EDU0ZLFQ',
    teacher_id: authData.user.id,
    course_name: 'Jaringan Komputer',
    description: 'Kelas Praktikum Jaringan Komputer',
    jurusan: 'TKJ',
    semester: 'Ganjil',
    academic_year: '2026/2027',
    is_active: true
  };

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

  console.log('C. Teacher INSERT Status:', insertRes.status);
  const insertText = await insertRes.text();
  console.log('C. Teacher INSERT Response:', insertText);

  // D & E. Test Student SELECT query
  console.log('\n--- DIAGNOSIS D & E: Student SELECT lookup test for EDU0ZLFQ ---');
  const studentSearchRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });

  const studentRows = await studentSearchRes.json();
  const searchMatch = studentRows.find(r => {
    const cCode = (r.code || r.class_code || '').toString().trim().toUpperCase();
    const cName = (r.name || '').toString().trim().toUpperCase();
    return cCode === 'EDU0ZLFQ' || cName.includes('EDU0ZLFQ');
  });

  console.log('D & E. Student SELECT Search Result for EDU0ZLFQ:', searchMatch ? searchMatch : 'NOT FOUND');

  console.log('\n====================================================');
}

diagnoseEDU0ZLFQ();
