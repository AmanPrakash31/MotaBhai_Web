
import { createClient } from '@supabase/supabase-js';
import 'server-only'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase URL, anon key, or service role key.');
}

// Client for public, client-side access
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations with elevated privileges
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
