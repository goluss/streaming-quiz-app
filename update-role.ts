import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // They are an admin in metadata but student in profiles.
  // The RLS policy for `cohort_resources` checks ` profiles.role = 'admin' `.
  const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('email', 'steven@stevengolus.com');
  console.log('Fixed profile role:', error || 'Success');
}

run();
