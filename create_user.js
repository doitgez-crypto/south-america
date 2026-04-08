import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tblppttmjzthnolnzrjr.supabase.co';
const supabaseKey = 'sb_publishable_rsBnwMB38uqmr7E_-hY0Zw_m_H7wOop';
const supabase = createClient(supabaseUrl, supabaseKey);

async function signUp() {
  const { data, error } = await supabase.auth.signUp({
    email: 'chenmesi12@gmail.com',
    password: '123456',
  });
  if (error) {
    console.error('Error signing up:', error.message);
  } else {
    console.log('User signed up successfully:', data?.user?.id);
    
    // Configure profile
    if (data?.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: 'chenmesi12@gmail.com',
        username: 'Chen',
        trip_id: 'c8a2d1e4-3f5b-4a6c-8d9e-1b2c3d4e5f60'
      });
      if (profileError) {
         console.error('Error creating profile:', profileError.message);
      } else {
         console.log('Profile configured with shared trip_id.');
      }
    }
  }
  process.exit(0);
}

signUp();
