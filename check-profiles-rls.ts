import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data, error } = await supabase.rpc('run_sql', { sql: 'select * from pg_policies where tablename = \'profiles\''});
  if (error) {
     console.log('Cant run RPC, fallback to reading migration files');
  } else {
     console.log(data);
  }
}

run();
