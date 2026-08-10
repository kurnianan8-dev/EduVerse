const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function probeClassesTable() {
  console.log('====================================================');
  console.log('🔎 STEP 1 & 2 & 4: PROBING "classes" TABLE IN SUPABASE');
  console.log('====================================================\n');

  console.log('Supabase URL:', SUPABASE_URL);

  // 1. Select all rows from classes using anon key
  console.log('\n--- 1. SELECT * FROM public.classes (anon key) ---');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    console.log('HTTP Status:', res.status);
    const text = await res.text();
    console.log('Raw Response:', text);

    if (res.ok) {
      const rows = JSON.parse(text);
      console.log(`Total rows in "classes": ${rows.length}`);
      if (rows.length > 0) {
        console.log('All column names present in first row:');
        console.log(Object.keys(rows[0]));
        console.log('All Class Rows in DB:');
        console.log(JSON.stringify(rows, null, 2));
      }
    }
  } catch (err) {
    console.error('Error fetching classes:', err.message);
  }

  // 2. Select with SuperAdmin JWT token (in case RLS blocks anon SELECT)
  console.log('\n--- 2. SELECT * FROM public.classes (SuperAdmin JWT Token) ---');
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

    if (authRes.ok) {
      const authData = await authRes.json();
      const token = authData.access_token;
      console.log('✅ Authenticated JWT acquired for:', authData.user.email);

      const resJwt = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=*`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('HTTP Status with JWT:', resJwt.status);
      const textJwt = await resJwt.text();
      console.log('Raw Response with JWT:', textJwt);
      if (resJwt.ok) {
        const rowsJwt = JSON.parse(textJwt);
        console.log(`Total rows with JWT: ${rowsJwt.length}`);
        if (rowsJwt.length > 0) {
          console.log('Column names in JWT row:');
          console.log(Object.keys(rowsJwt[0]));
          console.log('All Rows:', JSON.stringify(rowsJwt, null, 2));
        }
      }
    } else {
      console.log('Auth login status:', authRes.status, await authRes.text());
    }
  } catch (err) {
    console.error('JWT Auth Error:', err.message);
  }

  console.log('\n====================================================');
}

probeClassesTable();
