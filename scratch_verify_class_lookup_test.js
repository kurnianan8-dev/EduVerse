const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function verifyClassLookupTest() {
  console.log('====================================================');
  console.log('🧪 VERIFYING CLASS LOOKUP QUERY & SEARCH LOGIC');
  console.log('====================================================\n');

  // 1. Fetch all classes currently in DB (using anon key or authenticated token)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  const rows = await res.json();
  console.log(`1. Total rows currently in "classes" table: ${rows.length}`);

  if (rows.length === 0) {
    console.log('\n⚠️ DATABASE WARNING: "classes" table currently has 0 rows in Supabase.');
    console.log('Reason: Class creation attempts were blocked by Row Level Security (RLS 42501) or missing column "code" (PGRST204).');
    console.log('Action Required: Please run "supabase/05_fix_classes_columns_and_rls.sql" in your Supabase SQL Editor.');
    return;
  }

  // 2. Test lookup on first row
  const target = rows[0];
  const targetCode = target.code || target.class_code || (target.name.match(/\[(EDU[A-Z0-9]+)\]/i)?.[1]) || 'EDUN378L';
  console.log('\n2. Testing SELECT Lookup for Class Code:', targetCode);

  const rawInputs = [
    targetCode,
    `  ${targetCode.toLowerCase()}  `,
    targetCode.toLowerCase(),
    ` ${targetCode.toUpperCase()} `
  ];

  for (const raw of rawInputs) {
    const cleanCode = raw.trim().toUpperCase();
    console.log(`\n🔍 Searching raw input: ${JSON.stringify(raw)} -> Cleaned: "${cleanCode}"`);

    // Multi-strategy lookup
    const found = rows.find((c) => {
      const cCode = (c.code || c.class_code || '').toString().trim().toUpperCase();
      const cName = (c.name || '').toString().trim().toUpperCase();
      return cCode === cleanCode || cName.includes(cleanCode);
    });

    if (found) {
      console.log(`✅ MATCH FOUND! Class ID: ${found.id}, Name: ${found.name}`);
    } else {
      console.log(`❌ NO MATCH FOUND for code "${cleanCode}"`);
    }
  }

  console.log('\n====================================================');
}

verifyClassLookupTest();
