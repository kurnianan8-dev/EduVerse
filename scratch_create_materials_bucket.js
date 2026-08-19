const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function createMaterialsBucket() {
  console.log('====================================================');
  console.log('📦 CREATING SUPABASE STORAGE BUCKET "materials"');
  console.log('====================================================\n');

  // 1. Auth as Superadmin / Teacher
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@eduverse.io', password: 'SuperAdmin2026!' })
  });

  if (!authRes.ok) {
    console.error('❌ Auth failed:', authRes.status, await authRes.text());
    return;
  }

  const authData = await authRes.json();
  const token = authData.access_token;
  console.log('✅ Authenticated. Token acquired.');

  // 2. List current buckets
  console.log('\n--- 1. Listing existing Storage Buckets ---');
  const listRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
  });
  const buckets = await listRes.json();
  console.log('Existing Buckets:', JSON.stringify(buckets, null, 2));

  const hasMaterialsBucket = Array.isArray(buckets) && buckets.some(b => b.name === 'materials' || b.id === 'materials');

  if (!hasMaterialsBucket) {
    console.log('\n--- 2. Creating "materials" Bucket ---');
    const createRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 'materials',
        name: 'materials',
        public: true,
        file_size_limit: 52428800, // 50MB
        allowed_mime_types: ['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'text/plain']
      })
    });

    console.log(`Create Bucket Response Status: ${createRes.status} ${createRes.statusText}`);
    const createData = await createRes.json();
    console.log('Create Bucket Result:', JSON.stringify(createData, null, 2));
  } else {
    console.log('✅ Bucket "materials" already exists.');
  }

  console.log('====================================================');
}

createMaterialsBucket();
