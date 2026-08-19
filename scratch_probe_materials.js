const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function probeMaterialsTable() {
  console.log('====================================================');
  console.log('🔍 AUDITING SUPABASE "materials" TABLE SCHEMA & DATA');
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
    console.error('Teacher Auth Error:', authRes.status, await authRes.text());
    return;
  }

  const authData = await authRes.json();
  const token = authData.access_token;
  const userId = authData.user.id;
  console.log('✅ Teacher Authenticated. User ID:', userId);

  // 2. Fetch all rows from public.materials
  console.log('\n--- 1. SELECT * FROM public.materials (Teacher Token) ---');
  const matRes = await fetch(`${SUPABASE_URL}/rest/v1/materials?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });

  console.log('HTTP Status:', matRes.status);
  const text = await matRes.text();
  console.log('Raw Response:', text);

  let rows = [];
  try { rows = JSON.parse(text); } catch (e) {}

  console.log(`Total rows in "materials": ${rows.length}`);
  if (rows.length > 0) {
    console.log('Columns in "materials":', Object.keys(rows[0]));
    console.log('Rows sample:', JSON.stringify(rows.slice(0, 3), null, 2));
  }

  // 3. Test probe inserting a row into public.materials
  console.log('\n--- 2. Test INSERT into public.materials (Teacher Token) ---');
  const testPayload = {
    title: 'Test Material ' + Date.now(),
    description: 'Test material description',
    file_url: 'https://example.com/test.pdf',
    type: 'pdf',
    teacher_id: userId
  };

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/materials`, {
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

  console.log('\n====================================================');
}

probeMaterialsTable();
