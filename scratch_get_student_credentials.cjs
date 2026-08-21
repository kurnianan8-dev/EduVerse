const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function getStudentCredentials() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('--- Checking profiles table for student profiles ---');
  const { data: profs, error: profErr } = await supabase.from('profiles').select('id, full_name, email, role').limit(10);
  console.log('Profiles list:', profs, 'Error:', profErr);

  console.log('\n--- Checking assignments table ---');
  const { data: assData, error: assErr } = await supabase.from('assignments').select('*');
  console.log('Assignments in DB:', assData, 'Error:', assErr);

  console.log('\n--- Checking enrollments table ---');
  const { data: enrData, error: enrErr } = await supabase.from('enrollments').select('*');
  console.log('Enrollments in DB:', enrData, 'Error:', enrErr);
}

getStudentCredentials();
