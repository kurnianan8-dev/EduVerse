const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function testClassCreation() {
  console.log('====================================================');
  console.log('🧪 TESTING CLASS INSERT INTO SUPABASE "classes" TABLE');
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
  console.log('✅ Authenticated JWT acquired for:', authData.user.email);

  // 2. Test payloads
  const testPayloads = [
    {
      name: 'Kelas 10 IPA 1 [EDUN378L]',
      academic_year: '2026/2027'
    },
    {
      name: 'Kelas 10 IPA 1',
      code: 'EDUN378L',
      academic_year: '2026/2027'
    },
    {
      name: 'Kelas 10 IPA 1',
      class_code: 'EDUN378L',
      academic_year: '2026/2027'
    }
  ];

  for (const [idx, payload] of testPayloads.entries()) {
    console.log(`\n--- Test Payload #${idx + 1}:`, JSON.stringify(payload));
    const res = await fetch(`${SUPABASE_URL}/rest/v1/classes`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    console.log(`HTTP Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response Body: ${text}`);
  }

  console.log('\n====================================================');
}

testClassCreation();
