const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function auditAssignmentsAndSubmissions() {
  console.log('====================================================');
  console.log('🔎 AUDITING ASSIGNMENTS AND SUBMISSIONS TABLES IN SUPABASE');
  console.log('====================================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Check assignments table
  console.log('--- 1. Testing query to public.assignments ---');
  const { data: assData, error: assErr } = await supabase.from('assignments').select('*').limit(5);
  if (assErr) {
    console.error('❌ Error querying assignments table:', assErr.message, assErr.code);
  } else {
    console.log('✅ assignments table exists. Rows found:', assData.length);
    if (assData.length > 0) {
      console.log('Sample Assignment row:', JSON.stringify(assData[0], null, 2));
    }
  }

  // 2. Check submissions table
  console.log('\n--- 2. Testing query to public.submissions ---');
  const { data: subData, error: subErr } = await supabase.from('submissions').select('*').limit(5);
  if (subErr) {
    console.error('❌ Error querying submissions table:', subErr.message, subErr.code);
  } else {
    console.log('✅ submissions table exists. Rows found:', subData.length);
    if (subData.length > 0) {
      console.log('Sample Submission row:', JSON.stringify(subData[0], null, 2));
    }
  }

  // 3. Check storage buckets
  console.log('\n--- 3. Checking Storage Bucket "student-submissions" ---');
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  console.log('Storage Buckets found:', buckets ? buckets.map(b => b.name) : [], 'Error:', bErr);

  console.log('====================================================');
}

auditAssignmentsAndSubmissions();
