import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: user, error } = await supabase.from('profiles').select('*').eq('email', 'steven@stevengolus.com');
  console.log('User profile:', user, error);
}

run();
