import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sgeuusdwmulifctzvnic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-gyCsnf0MF0qOahxiZ80FA_V9_9_4Om';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectColumns() {
  console.log('--- 🔎 TESTING CLASS INSERT WITH NAME ONLY ---');

  const { data, error } = await supabase.from('classes').insert({
    name: 'Kelas Tes 1',
  } as any).select();

  console.log('Insert Result:', data, 'Error:', error);
}

inspectColumns();
