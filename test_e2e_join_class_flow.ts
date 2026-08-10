import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testE2EJoinClassFlow() {
  console.log('--- 🧪 STARTING E2E CLASS CREATION & JOIN FLOW TEST ---');

  // 1. Sign in as test user
  const email = `test_student_${Date.now()}@eduverse.school`;
  const password = 'TestPassword123!';

  console.log('1. Signing up test student user:', email);
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Siswa Uji Coba',
        role: 'student',
        jurusan: 'Teknik Komputer',
      },
    },
  });

  const userId = authData.user?.id || 'd3b07384-d113-40e8-a15d-5310e54d6824';
  console.log('User ID:', userId);

  // 2. Fetch existing classes in DB
  const { data: existingClasses, error: fetchErr } = await supabase.from('classes').select('*');
  console.log('2. Existing Classes in DB:', existingClasses, 'Fetch Error:', fetchErr?.message);

  let targetClass = existingClasses?.[0];

  if (!targetClass) {
    console.log('Creating a test class as Teacher...');
    const generatedCode = 'EDU' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const { data: createdClass, error: createErr } = await (supabase as any)
      .from('classes')
      .insert({
        name: 'XII TKJ 1',
        code: generatedCode,
        course_name: 'Jaringan Komputer',
        teacher_id: userId,
        jurusan: 'Teknik Komputer',
        semester: 'Ganjil',
        is_active: true,
      })
      .select();

    console.log('Class Creation Result:', createdClass, 'Error:', createErr?.message);
    targetClass = createdClass?.[0];
  }

  if (targetClass) {
    const rawInput = `  ${(targetClass.code || 'EDU8XK21').toLowerCase()}   `;
    const cleanCode = rawInput.trim().toUpperCase();
    console.log('3. Student enters raw code:', JSON.stringify(rawInput), '-> Trimmed & Cleaned:', cleanCode);

    // Search classes table case-insensitively using code column
    const { data: foundClasses, error: searchErr } = await (supabase as any)
      .from('classes')
      .select('*')
      .ilike('code', cleanCode);

    console.log('4. Class Search Result:', foundClasses, 'Error:', searchErr?.message);

    if (foundClasses && foundClasses.length > 0) {
      const cls = foundClasses[0];
      console.log('✅ Found Class ID:', cls.id, 'Name:', cls.name, 'Code:', cls.code);

      // Check if student already enrolled
      const { data: existingEnroll, error: checkEnrollErr } = await (supabase as any)
        .from('enrollments')
        .select('*')
        .eq('class_id', cls.id)
        .eq('student_id', userId);

      console.log('5. Existing Enrollment Check:', existingEnroll, 'Error:', checkEnrollErr?.message);

      if (!existingEnroll || existingEnroll.length === 0) {
        // Perform Enrollment Insert
        const enrollPayload = {
          class_id: cls.id,
          student_id: userId,
          status: 'active',
          enrolled_at: new Date().toISOString(),
        };

        console.log('6. Inserting Enrollment Payload:', enrollPayload);
        const { data: insertedEnroll, error: insertErr } = await (supabase as any)
          .from('enrollments')
          .insert(enrollPayload)
          .select();

        console.log('🎉 Enrollment Inserted Successfully:', insertedEnroll, 'Insert Error:', insertErr?.message);
      } else {
        console.log('ℹ️ Student is already enrolled in this class.');
      }
    }
  }

  console.log('--- 🏁 E2E JOIN CLASS LOGIC TEST FINISHED ---');
}

testE2EJoinClassFlow();
