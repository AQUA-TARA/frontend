import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('your-project')
);

// Centralized Supabase Client
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : {
      isMock: false,
      auth: {
        async getSession() {
          return { data: { session: null }, error: null };
        },
        async getUser() {
          return { data: { user: null }, error: null };
        },
        async signInWithPassword() {
          return {
            data: { user: null, session: null },
            error: new Error('Layanan autentikasi belum terkonfigurasi. Periksa kredensial Supabase.')
          };
        },
        async signUp() {
          return {
            data: { user: null, session: null },
            error: new Error('Layanan registrasi belum terkonfigurasi. Periksa kredensial Supabase.')
          };
        },
        async signOut() {
          return { error: null };
        },
        onAuthStateChange(callback) {
          return { data: { subscription: { unsubscribe: () => {} } } };
        }
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: new Error('Supabase client not configured') })
          }),
          gte: () => ({
            lte: async () => ({ data: [], error: null })
          }),
          then: (resolve) => resolve({ data: [], error: null })
        })
      })
    };

