import { createClient } from './node_modules/@supabase/supabase-js/dist/main/index.js';

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runJoinClassMigration() {
  console.log('🚀 Running 04_fix_join_class_and_enrollments SQL migration checks...');

  try {
    // Check classes table columns
    const { data: classesData, error: classesErr } = await supabase.from('classes').select('*').limit(1);
    console.log('Classes Table sample:', classesData, 'Error:', classesErr?.message);

    // Check enrollments table columns
    const { data: enrollData, error: enrollErr } = await supabase.from('enrollments').select('*').limit(1);
    console.log('Enrollments Table sample:', enrollData, 'Error:', enrollErr?.message);

    console.log('✅ Migration checks completed!');
  } catch (err) {
    console.error('❌ Migration script error:', err);
  }
}

runJoinClassMigration();
