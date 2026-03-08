import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (users) {
    const admin = users.users.find(u => u.email === 'steven@stevengolus.com' || u.app_metadata?.role === 'admin' || (u as any).user_metadata?.role === 'admin');
    console.log('Found user:', admin?.email || users.users[0]?.email);
  }
}

run();
