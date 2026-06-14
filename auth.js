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
  showAuthLoader();
  const { data } = await supabase.auth.getSession();
  if(!data?.session){
    location.replace('login.html');
    return new Promise(()=>{});
  }
  hideAuthLoader();
  return data.session;
}

// brief branded loading overlay while we verify the session
function showAuthLoader(){
  if(document.getElementById('__auth_loader'))return;
  const css=document.createElement('style');
  css.textContent='#__auth_loader{position:fixed;inset:0;background:#0f1115;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;z-index:9999;}#__auth_loader .l{width:50px;height:50px;border-radius:13px;background:#1f2229;border:1px solid #353b47;color:#eef0f4;display:grid;place-items:center;font-family:Archivo,sans-serif;font-weight:800;font-size:15px;letter-spacing:.04em;animation:__ap 1.4s ease-in-out infinite;}#__auth_loader .s{width:28px;height:28px;border:2.5px solid #353b47;border-top-color:#f4f6fb;border-radius:50%;animation:__as .7s linear infinite;}@keyframes __as{to{transform:rotate(360deg)}}@keyframes __ap{0%,100%{opacity:.55;transform:scale(.97)}50%{opacity:1;transform:scale(1)}}';
  document.head.appendChild(css);
  const el=document.createElement('div');el.id='__auth_loader';
  el.innerHTML='<div class="l">YRT</div><div class="s"></div>';
  document.documentElement.appendChild(el);
}
function hideAuthLoader(){
  const el=document.getElementById('__auth_loader');
  if(el){el.style.transition='opacity .25s';el.style.opacity='0';setTimeout(()=>el.remove(),260);}
}

export async function currentUser(){
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export async function signOut(){
  await supabase.auth.signOut();
  location.replace('login.html');
}