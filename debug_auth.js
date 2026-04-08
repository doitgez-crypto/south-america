import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tblppttmjzthnolnzrjr.supabase.co';
const supabaseKey = 'sb_publishable_rsBnwMB38uqmr7E_-hY0Zw_m_H7wOop';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  console.log('Attempting to create user chenmesi12@gmail.com...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'chenmesi12@gmail.com',
    password: '123456',
  });
  
  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
        console.log('User already exists! Attempting to login instead...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: 'chenmesi12@gmail.com',
          password: '123456',
        });
        if (loginError) {
            console.error('Login Error:', loginError.message);
        } else {
            console.log('Login successful! User ID:', loginData.user.id);
        }
    } else {
        console.error('Signup Error:', signUpError.message);
    }
  } else {
    console.log('Signup Successful! User ID:', signUpData.user?.id);
  }
  process.exit(0);
}

checkUser();
