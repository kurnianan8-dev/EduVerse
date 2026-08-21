const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function fixStorageRls() {
  console.log('====================================================');
  console.log('🛠️ TESTING STORAGE RLS POLICIES FOR BUCKET "materials"');
  console.log('====================================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Sign in as Superadmin
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'superadmin@eduverse.io',
    password: 'SuperAdmin2026!'
  });

  const token = authData?.session?.access_token;
  console.log('Auth Token acquired.');

  // Try creating policies using SQL or checking if bucket exists
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `
        INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true) ON CONFLICT (id) DO UPDATE SET public = true;
        DROP POLICY IF EXISTS "Allow Uploads to materials bucket" ON storage.objects;
        CREATE POLICY "Allow Uploads to materials bucket" ON storage.objects FOR INSERT TO authenticated, anon WITH CHECK (bucket_id = 'materials');
        DROP POLICY IF EXISTS "Allow Public Read on materials bucket" ON storage.objects;
        CREATE POLICY "Allow Public Read on materials bucket" ON storage.objects FOR SELECT TO public USING (bucket_id = 'materials');
      `
    })
  });

  console.log('RPC Status:', res.status);
  console.log('RPC Response:', await res.text());

  console.log('====================================================');
}

fixStorageRls();
