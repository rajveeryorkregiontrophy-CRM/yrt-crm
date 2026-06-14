// ============================================================
// YRT CRM — Auth gate (shared by every page)
// Import at the top of each page's module script:
//   import { requireAuth, signOut, currentUser } from './auth.js';
//   const session = await requireAuth();   // redirects to login if not signed in
// ============================================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(
  'https://hhnoldgvtjsmjxlowgaq.supabase.co',
  'sb_publishable_ZpLMMKMw_SaImF-dWAS1vg_yyMUOW_f'
);

// Block the page until we confirm a valid session. If none, bounce to login.
export async function requireAuth(){
  const { data } = await supabase.auth.getSession();
  if(!data?.session){
    location.replace('login.html');
    // never resolves — page is navigating away
    return new Promise(()=>{});
  }
  return data.session;
}

export async function currentUser(){
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export async function signOut(){
  await supabase.auth.signOut();
  location.replace('login.html');
}