import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('Invalid Supabase URL').or(z.string().min(1)),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase Anon Key is required'),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

const _env = envSchema.safeParse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://mock-eduverse.supabase.co',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key-eduverse-dev-mode',
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
});

if (!_env.success) {
  console.warn('⚠️ Invalid Environment Variables:', _env.error.format());
}

export const env = _env.success
  ? _env.data
  : {
      VITE_SUPABASE_URL: 'https://mock-eduverse.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'mock-anon-key-eduverse-dev-mode',
      VITE_APP_ENV: 'development' as const,
    };

export const isMockEnvironment =
  env.VITE_SUPABASE_URL.includes('mock-eduverse') ||
  env.VITE_SUPABASE_ANON_KEY.includes('mock-anon-key');
