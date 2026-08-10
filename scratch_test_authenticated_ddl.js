import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function testAuthToken() {
  console.log('====================================================');
  console.log('🔑 TESTING AUTH & ACCESS TOKEN FOR CLASSES & ENROLLMENTS');
  console.log('====================================================\n');

  // 1. Sign in
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
    console.log('Auth login failed:', authRes.status, await authRes.text());
    return;
  }

  const authData = await authRes.json();
  const token = authData.access_token;
  console.log('✅ Auth JWT token acquired for:', authData.user?.email, 'ID:', authData.user?.id);

  // 2. Query classes with User Token
  const clsRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });

  console.log('Classes list status with JWT:', clsRes.status);
  const classesData = await clsRes.json();
  console.log('Classes count:', classesData.length, 'Data:', classesData);

  // 3. Test insert into classes with User Token
  console.log('\n--- Inserting test class with JWT Token ---');
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/classes`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      name: 'Kelas XII TKJ 1 - Test'
    })
  });

  console.log('Class Insert Status with JWT Token:', insertRes.status);
  const insertBody = await insertRes.text();
  console.log('Class Insert Response:', insertBody);

  console.log('\n====================================================');
}

testAuthToken();
