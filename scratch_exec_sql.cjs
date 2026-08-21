const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function testExec() {
  console.log('Testing DB endpoints for table creation...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'superadmin@eduverse.io',
    password: 'SuperAdmin2026!'
  });

  console.log('User auth token acquired.');
}

testExec();
