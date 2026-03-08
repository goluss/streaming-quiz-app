import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // Sign in as the admin user. We reset the password for the test. We can use supabase admin api to re-issue or create a test admin user.
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Create a tempoary admin user for testing
  const email = 'testadmin' + Date.now() + '@example.com';
  const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true
  });
  
  if (authErr) return console.log('Create error:', authErr);
  
  await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', authUser.user.id);
  
  // Login as this user
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email,
    password: 'password123'
  });
  
  if (loginErr) return console.log('Login error:', loginErr);
  
  // Try the insert
  const { data: cohort } = await supabaseAdmin.from('cohorts').select('id').limit(1).single();
  const { data: session } = await supabaseAdmin.from('cohort_sessions').select('id').eq('cohort_id', cohort!.id).limit(1).single();

  console.log('Inserting with JWT:', loginData.session?.access_token.substring(0, 10) + '...');
  
  const { data: insertData, error: insertErr } = await supabase
    .from('cohort_resources')
    .insert({
      cohort_id: cohort!.id,
      session_id: session!.id,
      title: 'JWT Test',
      url: '#',
      type: 'link',
      section_title: 'Materials'
    })
    .select();
    
    console.log('Result:', insertErr || insertData);
    
    // Cleanup
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
}

run();
