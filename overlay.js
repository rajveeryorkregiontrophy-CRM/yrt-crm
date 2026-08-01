// ── App windows ─────────────────────────────────────────────────────
// Opens a record page (order.html, po.html) as an overlay window on top
// of the current page. The page loads in an <iframe>, so its code stays
// fully separate — no merging. The frame reports its content size and
// the window hugs it: a small inquiry gets a small card, a full order a
// tall one. Direct URLs still open the same pages standalone.
//
// frame → parent messages: {yrt:'height',h} {yrt:'width',w}
//                          {yrt:'close',refresh} {yrt:'navigate',href}
// parent → frame:          {yrt:'requestClose'}  (backdrop / Esc / Back)

let _win = null, _onclose = null, _pushed = false;

export function openWindow(url, { width = 1240, onClose = null } = {}) {
  closeWindow(false);
  _onclose = onClose;
  const ov = document.createElement('div');
  ov.id = 'yrt-win-ov';
  ov.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(8,10,14,.72);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:24px;opacity:0;transition:opacity .18s;';
  const fr = document.createElement('iframe');
  fr.src = url + (url.includes('?') ? '&' : '?') + 'embed=1';
  fr.style.cssText = 'width:min(' + width + 'px,96vw);height:min(420px,92vh);border:1px solid #423a63;border-radius:16px;background:#141221;box-shadow:0 32px 80px -24px rgba(0,0,0,.9);transition:height .18s ease,width .18s ease;';
  ov.appendChild(fr);
  document.body.appendChild(ov);
  requestAnimationFrame(() => { ov.style.opacity = '1'; });
  const askClose = () => { try { fr.contentWindow.postMessage({ yrt: 'requestClose' }, '*'); } catch (e) { closeWindow(false); } };
  ov.addEventListener('click', e => { if (e.target === ov) askClose(); });
  const esc = e => { if (e.key === 'Escape') askClose(); };
  document.addEventListener('keydown', esc);
  document.documentElement.style.overflow = 'hidden';
  _win = { ov, fr, esc, askClose };

  // Browser Back closes the window instead of leaving the page.
  history.pushState({ yrtWin: 1 }, '');
  _pushed = true;

  // If the frame ever navigates somewhere that isn't a record page
  // (order / po), break out: close the window and go there for real.
  fr.addEventListener('load', () => {
    try {
      const loc = fr.contentWindow.location;
      if (!loc || loc.href === 'about:blank') return;
      if (!/\/(order|po)(\.html)?$/.test(loc.pathname)) {
        const href = loc.href;
        closeWindow(false);
        window.location.href = href;
      }
    } catch (e) { /* cross-origin frame: leave it alone */ }
  });
}

export function closeWindow(refresh) {
  if (!_win) return;
  document.removeEventListener('keydown', _win.esc);
  _win.ov.remove();
  _win = null;
  document.documentElement.style.overflow = '';
  if (_pushed) { _pushed = false; try { history.back(); } catch (e) {} }
  const cb = _onclose; _onclose = null;
  if (refresh && cb) cb();
}

window.addEventListener('popstate', () => {
  if (_win) {
    // put the state entry back, then close through the page's own guard
    history.pushState({ yrtWin: 1 }, '');
    _win.askClose();
  }
});

window.addEventListener('message', e => {
  const d = e.data || {};
  if (!d.yrt || !_win) return;
  if (d.yrt === 'height') _win.fr.style.height = 'min(' + Math.ceil(d.h) + 'px,92vh)';
  else if (d.yrt === 'width') _win.fr.style.width = 'min(' + Math.ceil(d.w) + 'px,96vw)';
  else if (d.yrt === 'close') closeWindow(d.refresh !== false);
  else if (d.yrt === 'navigate') window.location.href = d.href;
});
