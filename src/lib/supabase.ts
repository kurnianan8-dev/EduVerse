import { createClient } from '@supabase/supabase-js';
import { env, isMockEnvironment } from '../config/env';
import { Database } from '../types/database.types';

export const supabase = createClient<Database>(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

if (isMockEnvironment) {
  console.info('🚀 EduVerse LMS running in Development / Mock Architecture Mode.');
}
