const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

const candidateColumns = [
  'id',
  'name',
  'teacher_id',
  'created_at',
  'updated_at',
  'subject',
  'code',
  'class_code',
  'course_name',
  'description',
  'jurusan',
  'semester',
  'is_active',
  'school_id',
  'academic_year',
  'section',
  'grade_level',
  'room'
];

async function testEachColumn() {
  console.log('====================================================');
  console.log('🔍 PROBING EXISTING COLUMNS IN "classes" TABLE');
  console.log('====================================================\n');

  for (const col of candidateColumns) {
    const payload = { name: 'Test' };
    if (col !== 'name') payload[col] = 'test_value';

    const res = await fetch(`${SUPABASE_URL}/rest/v1/classes`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = await res.text();
    if (body.includes('PGRST204')) {
      console.log(`❌ Column '${col}' DOES NOT EXIST in DB schema.`);
    } else if (body.includes('42501')) {
      console.log(`✅ Column '${col}' EXISTS in DB schema (blocked by RLS 42501).`);
    } else {
      console.log(`❓ Column '${col}' result: Status ${res.status} Body: ${body}`);
    }
  }

  console.log('\n====================================================');
  console.log('🔍 PROBING EXISTING COLUMNS IN "enrollments" TABLE');
  console.log('====================================================\n');

  const candidateEnrollColumns = [
    'id',
    'class_id',
    'student_id',
    'user_id',
    'profile_id',
    'joined_at',
    'enrolled_at',
    'created_at',
    'status'
  ];

  for (const col of candidateEnrollColumns) {
    const payload = {};
    payload[col] = '00000000-0000-0000-0000-000000000000';

    const res = await fetch(`${SUPABASE_URL}/rest/v1/enrollments`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = await res.text();
    if (body.includes('PGRST204')) {
      console.log(`❌ Enrollment Column '${col}' DOES NOT EXIST in DB schema.`);
    } else if (body.includes('42501') || body.includes('23503')) {
      console.log(`✅ Enrollment Column '${col}' EXISTS in DB schema (${body.slice(0, 80)}).`);
    } else {
      console.log(`❓ Enrollment Column '${col}' result: Status ${res.status} Body: ${body}`);
    }
  }

  console.log('\n====================================================');
}

testEachColumn();
