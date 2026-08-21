const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function testSupabaseConnection() {
  console.log('====================================================');
  console.log('🔎 AUDITING DATABASE TABLES FOR ASSIGNMENTS');
  console.log('====================================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Check if public.assignments table exists
  console.log('--- 1. Checking public.assignments table ---');
  const { data: assData, error: assErr } = await supabase.from('assignments').select('*').limit(1);
  if (assErr) {
    console.error('❌ Table public.assignments status:', assErr.message, 'Code:', assErr.code);
  } else {
    console.log('✅ Table public.assignments EXISTS! Sample data:', assData);
  }

  // 2. Check if public.submissions table exists
  console.log('\n--- 2. Checking public.submissions table ---');
  const { data: subData, error: subErr } = await supabase.from('submissions').select('*').limit(1);
  if (subErr) {
    console.error('❌ Table public.submissions status:', subErr.message, 'Code:', subErr.code);
  } else {
    console.log('✅ Table public.submissions EXISTS! Sample data:', subData);
  }

  console.log('====================================================');
}

testSupabaseConnection();
