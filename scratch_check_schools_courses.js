const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function checkSchoolsAndCourses() {
  console.log('====================================================');
  console.log('🔍 FETCHING EXISTING SCHOOLS AND COURSES ROWS');
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

  // 1. Fetch schools
  const schoolRes = await fetch(`${SUPABASE_URL}/rest/v1/schools?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });

  const schools = await schoolRes.json();
  console.log(`Schools count: ${schools.length}`);
  console.log('Schools:', schools);

  // 2. Fetch courses
  const courseRes = await fetch(`${SUPABASE_URL}/rest/v1/courses?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });

  const courses = await courseRes.json();
  console.log(`\nCourses count: ${courses.length}`);
  console.log('Courses:', courses);

  console.log('\n====================================================');
}

checkSchoolsAndCourses();
