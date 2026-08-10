import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectClassesSchema() {
  console.log('--- 🔍 INSPECTING CLASSES & ENROLLMENTS TABLE SCHEMAS ---');

  // Insert dummy with empty object to see column error hint
  const { data, error } = await supabase.from('classes').insert({} as any).select();
  console.log('Classes Insert Error Hint:', error);

  // Select 1 row from classes
  const { data: clsData, error: clsErr } = await supabase.from('classes').select('*').limit(1);
  console.log('Classes select:', clsData, clsErr);

  // Select 1 row from enrollments
  const { data: enrData, error: enrErr } = await supabase.from('enrollments').select('*').limit(1);
  console.log('Enrollments select:', enrData, enrErr);
}

inspectClassesSchema();
