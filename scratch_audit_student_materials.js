const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

async function auditStudentMaterials() {
  console.log('====================================================');
  console.log('🔎 AUDITING DATA INTEGRITY FOR STUDENT MATERIALS');
  console.log('====================================================\n');

  // 1. Authenticate Teacher (or Student) to query REST API
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
  console.log('✅ Authenticated. Token acquired.');

  // 2. Query public.materials
  console.log('\n--- 1. SELECT * FROM public.materials ---');
  const matRes = await fetch(`${SUPABASE_URL}/rest/v1/materials?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
  });
  const materials = await matRes.json();
  console.log(`Total materials in DB: ${materials.length}`);
  if (materials.length > 0) {
    console.log('Sample Material:', JSON.stringify(materials[0], null, 2));
  }

  // 3. Query public.enrollments
  console.log('\n--- 2. SELECT * FROM public.enrollments ---');
  const enrollRes = await fetch(`${SUPABASE_URL}/rest/v1/enrollments?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
  });
  const enrollments = await enrollRes.json();
  console.log(`Total enrollments in DB: ${enrollments.length}`);
  if (enrollments.length > 0) {
    console.log('Sample Enrollment:', JSON.stringify(enrollments[0], null, 2));
  }

  // 4. Query public.classes
  console.log('\n--- 3. SELECT * FROM public.classes ---');
  const clsRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
  });
  const classes = await clsRes.json();
  console.log(`Total classes in DB: ${classes.length}`);
  if (classes.length > 0) {
    console.log('Sample Class:', JSON.stringify(classes[0], null, 2));
  }

  // 5. Cross-Reference class_id links
  console.log('\n--- 4. CROSS-REFERENCING CLASS_ID LINKS ---');
  materials.forEach((m, idx) => {
    console.log(`\nMaterial #${idx + 1}: "${m.title}"`);
    console.log(`  Material ID       : ${m.id}`);
    console.log(`  Material class_id : ${m.class_id}`);
    console.log(`  Material teacher_id: ${m.teacher_id}`);

    const matchingClass = classes.find(c => String(c.id) === String(m.class_id));
    console.log(`  Matching Class    : ${matchingClass ? `"${matchingClass.name}" (ID: ${matchingClass.id})` : '❌ NONE MATCHED!'}`);

    const matchingEnrollments = enrollments.filter(e => String(e.class_id) === String(m.class_id));
    console.log(`  Enrolled Students : ${matchingEnrollments.length} enrollment(s) found for this class_id`);
    matchingEnrollments.forEach(e => {
      console.log(`    -> student_id: ${e.student_id || e.user_id} | status: ${e.status}`);
    });
  });

  console.log('\n====================================================');
}

auditStudentMaterials();
