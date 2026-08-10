import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testAuthAndInsert() {
  console.log('====================================================');
  console.log('🔑 TESTING AUTH & ROW LEVEL SECURITY (RLS) FOR CLASSES');
  console.log('====================================================\n');

  // 1. Sign up/in a teacher
  const email = `teacher_test_${Date.now()}@eduverse.school`;
  const password = 'TeacherPassword123!';

  console.log('1. Signing up test teacher:', email);
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Guru Tes LMS',
        role: 'guru'
      }
    }
  });

  console.log('Auth result user ID:', authData?.user?.id, 'Error:', authErr?.message);

  if (authData?.session) {
    const userSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    });

    console.log('\n2. Attempting insert into classes with authenticated teacher token...');
    const { data: clsRes, error: clsErr } = await userSupabase
      .from('classes')
      .insert({
        name: 'Kelas 10 IPA 1',
        academic_year: '2026/2027'
      })
      .select();

    console.log('Class insert result:', clsRes, 'Error:', clsErr);
  } else {
    console.log('No session returned directly. Trying sign in...');
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    console.log('Sign in result session:', !!signInData?.session, 'Err:', signInErr?.message);

    if (signInData?.session) {
      const userSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${signInData.session.access_token}`
          }
        }
      });

      console.log('\n2. Attempting insert into classes with authenticated token...');
      const { data: clsRes, error: clsErr } = await userSupabase
        .from('classes')
        .insert({
          name: 'Kelas 10 IPA 1',
          academic_year: '2026/2027'
        })
        .select();

      console.log('Class insert result:', clsRes, 'Error:', clsErr);
    }
  }

  console.log('\n====================================================');
}

testAuthAndInsert();
