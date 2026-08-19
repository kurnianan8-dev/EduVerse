const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function inspectSpecificMaterial() {
  console.log('====================================================');
  console.log('🔎 INSPECTING ROW 873a8fd4-6dd3-4e58-9628-e83c3b62d06c');
  console.log('====================================================\n');

  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@eduverse.io', password: 'SuperAdmin2026!' })
  });

  if (!authRes.ok) {
    console.error('Auth failed:', authRes.status, await authRes.text());
    return;
  }

  const authData = await authRes.json();
  const token = authData.access_token;

  // Query specific row
  const matRes = await fetch(`${SUPABASE_URL}/rest/v1/materials?id=eq.873a8fd4-6dd3-4e58-9628-e83c3b62d06c`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
  });
  const materials = await matRes.json();
  console.log('Material Row Data:', JSON.stringify(materials, null, 2));

  // Also query ALL rows in materials
  const allMatRes = await fetch(`${SUPABASE_URL}/rest/v1/materials?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
  });
  const allMaterials = await allMatRes.json();
  console.log('\nAll Materials Rows Count:', allMaterials.length);
  console.log('All Materials Rows:', JSON.stringify(allMaterials, null, 2));

  console.log('====================================================');
}

inspectSpecificMaterial();
