const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function testMinimalInsert() {
  console.log('====================================================');
  console.log('🔍 TESTING MINIMAL COLUMN INSERT ON CURRENT SUPABASE SCHEMA');
  console.log('====================================================\n');

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
  console.log('User Token Acquired:', authData.user.email);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/classes`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      name: 'Kelas 10 IPA 1 [EDUN378L]',
      academic_year: '2026/2027'
    })
  });

  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);

  console.log('\n====================================================');
}

testMinimalInsert();
