import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testJoinFlow() {
  console.log('--- 🧪 STARTING E2E JOIN CLASS LOGIC TEST ---');

  // 1. Fetch any class from DB
  const { data: classes, error: clsErr } = await supabase.from('classes').select('*').limit(5);
  console.log('1. Classes sample in DB:', classes, 'Err:', clsErr?.message);

  let targetClass = classes?.[0];

  if (!targetClass) {
    console.log('Creating a test class with column code...');
    const testCode = 'EDU' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const { data: newCls, error: createErr } = await (supabase as any).from('classes').insert({
      name: 'Kelas XI TKJ 1',
      code: testCode,
      course_name: 'Pemrograman Web',
      jurusan: 'Teknik Informasi',
      semester: 'Ganjil',
      is_active: true,
    }).select();

    console.log('Created test class:', newCls, 'Err:', createErr?.message);
    targetClass = newCls?.[0];
  }

  if (targetClass) {
    // 2. Test code search logic with trim and case insensitivity
    const testInputCode = (targetClass.code || 'EDU8XK21').toLowerCase();
    const cleanCode = testInputCode.trim().toUpperCase();
    console.log('🔍 Inputted Code:', testInputCode, 'Cleaned Code:', cleanCode);

    const { data: searchResults, error: searchErr } = await (supabase as any)
      .from('classes')
      .select('*')
      .ilike('code', cleanCode);

    console.log('2. Search Results for Code:', searchResults, 'Err:', searchErr?.message);

    if (searchResults && searchResults.length > 0) {
      const matchedClass = searchResults[0];
      console.log('✅ Matched Class ID:', matchedClass.id, 'Name:', matchedClass.name, 'Code:', matchedClass.code, 'IsActive:', matchedClass.is_active);

      // 3. Test enrollments check
      const testStudentId = '7d9734bc-b0de-4059-8046-e489a71202f7';
      const { data: enrollCheck, error: enrollCheckErr } = await (supabase as any)
        .from('enrollments')
        .select('*')
        .eq('class_id', matchedClass.id)
        .eq('student_id', testStudentId);

      console.log('3. Enrollment Check Result:', enrollCheck, 'Err:', enrollCheckErr?.message);

      if (!enrollCheck || enrollCheck.length === 0) {
        console.log('📌 Inserting test enrollment...');
        const { data: inserted, error: insertErr } = await (supabase as any).from('enrollments').insert({
          class_id: matchedClass.id,
          student_id: testStudentId,
          status: 'active',
          enrolled_at: new Date().toISOString(),
        }).select();

        console.log('🎉 Enrollment Inserted Successfully:', inserted, 'Err:', insertErr?.message);
      } else {
        console.log('ℹ️ Student is already enrolled in class.');
      }
    }
  }

  console.log('--- 🏁 E2E JOIN CLASS LOGIC TEST COMPLETED ---');
}

testJoinFlow();
