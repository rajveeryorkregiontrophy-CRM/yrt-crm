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

// ============================================================
// ROLES
//   'management' — full access (Rajveer + one other)
//   'process'    — Sales Orders only. Locked out of every other page.
//
// This is the UI half of the gate. The REAL enforcement is Row Level Security
// in Postgres (05_roles_and_rls.sql): a process user querying Supabase directly
// gets zero rows from every business table. This just makes the app behave
// correctly instead of showing them empty screens.
// ============================================================
// Cloudflare Pages serves these WITHOUT the .html extension — the live URL is
// /order?id=... not /order.html?id=... So compare on the bare page name, or the
// gate never matches and every process user gets bounced back to the timeline.
const PROCESS_PAGES = ['index','order','login',''];

function currentPage(){
  let last = (location.pathname.split('/').pop() || '').toLowerCase();
  last = last.split('?')[0].split('#')[0];   // belt and braces
  return last.replace(/\.html$/,'');        // 'order.html' and 'order' both -> 'order'
}

let _profile = null;

// Resolve the signed-in user's role.
//
// This goes through the me() SECURITY DEFINER function, NOT a select on profiles.
// Reading the table directly can fail if RLS or a missing grant gets in the way —
// and the old fallback then silently demoted management to 'process', which is
// exactly why Rajveer was being shown the production view. me() runs as the owner
// and cannot be blocked, so the role is always the truth.
export async function getProfile(){
  if(_profile) return _profile;
  const { data:{ user } } = await supabase.auth.getUser();
  if(!user) return null;

  const { data, error } = await supabase.rpc('me');
  const row = Array.isArray(data) ? data[0] : data;

  if(error || !row || !row.role){
    // Do NOT guess a role. A wrong guess either exposes data or locks someone out.
    console.error('[auth] Could not resolve role for', user.email, error);
    throw new Error('Could not determine your role. Run 08_fix_role_resolution.sql, then reload.');
  }

  _profile = { id:row.id, email:row.email, full_name:row.full_name, role:row.role };
  return _profile;
}
export function isManagement(){ return _profile?.role === 'management'; }
export function roleOf(){ return _profile?.role || null; }

// Block the page until we confirm a valid session AND that this role may see it.
export async function requireAuth(){
  showAuthLoader();
  const { data } = await supabase.auth.getSession();
  if(!data?.session){
    location.replace('login.html');
    return new Promise(()=>{});
  }
  const profile = await getProfile();
  const page = currentPage();
  if(profile?.role !== 'management' && !PROCESS_PAGES.includes(page)){
    // Process user tried to reach a page they're not allowed on (typed the URL, etc.)
    location.replace('index.html');
    return new Promise(()=>{});
  }
  // Apply the role class BEFORE anything is allowed to paint. index.html keeps
  // the whole app hidden until 'role-ready' lands, which is what stops a process
  // user seeing a flash of the management layout (sidebar, Inquiries, Quotations).
  const root = document.documentElement;
  root.classList.add(profile?.role === 'management' ? 'role-management' : 'role-process');
  root.classList.add('role-ready');
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
  _profile = null;
  try{ await supabase.auth.signOut(); }catch(e){}
  // Belt and braces: if signOut fails (offline, expired token), nuke the local
  // session anyway so the user is never trapped on a page they can't leave.
  try{ Object.keys(localStorage).filter(k=>k.startsWith('sb-')).forEach(k=>localStorage.removeItem(k)); }catch(e){}
  location.replace('login.html');
}

// ============================================================
// Realtime: live fulfillment sync across all open pages.
// Call subscribeFulfillment(cb) — cb runs (debounced) whenever any
// fulfillment-related row changes anywhere. Pages re-fetch + re-render.
//   const unsub = subscribeFulfillment(() => reloadMyView());
// Returns an unsubscribe function.
// ============================================================
export function subscribeFulfillment(cb, opts){
  opts = opts || {};
  const tables = opts.tables || ['quote_items','po_items','quote_item_allocations','purchase_orders'];
  let timer=null;
  const fire=()=>{ clearTimeout(timer); timer=setTimeout(()=>{ try{cb();}catch(e){console.warn('realtime cb error',e);} }, 180); };
  const channel = supabase.channel('yrt-fulfillment-'+Math.random().toString(36).slice(2));
  tables.forEach(t=>{
    channel.on('postgres_changes', { event:'*', schema:'public', table:t }, fire);
  });
  channel.subscribe();
  return ()=>{ try{ supabase.removeChannel(channel); }catch(e){} };
}