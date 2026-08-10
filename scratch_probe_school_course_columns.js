const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function probeColumns() {
  console.log('====================================================');
  console.log('🔎 PROBING "schools" AND "courses" MINIMAL INSERTS');
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
  const userId = authData.user.id;

  // 1. Try school insert with just name
  console.log('1. Trying schools insert payload { name: "SMK EduVerse" }...');
  const schRes = await fetch(`${SUPABASE_URL}/rest/v1/schools`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ name: 'SMK EduVerse' })
  });

  console.log('Schools Insert Status:', schRes.status);
  const schText = await schRes.text();
  console.log('Schools Insert Response:', schText);

  // 2. Try courses insert with just code / name / title / course_name
  console.log('\n2. Trying courses insert payload { code: "MAT-01" }...');
  const crsRes = await fetch(`${SUPABASE_URL}/rest/v1/courses`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ code: 'MAT-01' })
  });

  console.log('Courses Insert Status:', crsRes.status);
  const crsText = await crsRes.text();
  console.log('Courses Insert Response:', crsText);

  console.log('\n====================================================');
}

probeColumns();
