import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gzjcabumvacvltqgqofo.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_lGGKeZG-jBO_tPVNYqrw3g_QDJHhVwA';

export const supabase = createClient(supabaseUrl, supabaseKey);
