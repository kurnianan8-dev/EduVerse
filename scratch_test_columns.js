const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function testClassesColumns() {
  console.log('====================================================');
  console.log('🧪 TESTING "classes" TABLE COLUMNS VIA POSTGREST INSERT');
  console.log('====================================================\n');

  const testPayloads = [
    { name: 'Test Class Minimal' },
    { name: 'Test Class Code', code: 'EDU8XK21' },
    { name: 'Test Class ClassCode', class_code: 'EDU8XK21' },
    { name: 'Test Class Both', code: 'EDU8XK21', class_code: 'EDU8XK21' },
    { name: 'Test Class Full', name: 'XII TKJ 1', code: 'EDU8XK21', class_code: 'EDU8XK21', course_name: 'Networking', description: 'Test desc', jurusan: 'TKJ', semester: 'Ganjil', is_active: true }
  ];

  for (const [index, payload] of testPayloads.entries()) {
    console.log(`\n--- Test #${index + 1}: Payload ${JSON.stringify(payload)} ---`);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/classes`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    console.log(`Status: ${res.status}`);
    const body = await res.text();
    console.log(`Response: ${body}`);
  }

  console.log('\n====================================================');
}

testClassesColumns();
