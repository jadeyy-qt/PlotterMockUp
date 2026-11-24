/* =====================================================================
   Plotter — "Coming soon" safety net for the prototype

   Anything that isn't built yet shows a short message instead of doing
   nothing (or opening a missing page). Loaded on every page.

     <button data-soon>…</button>                 → default message
     <a href="#" data-soon="Custom text">…</a>    → custom message
     links to characters.html                      → Character library note
     links to #section that doesn't exist          → default message

   Other scripts can call window.plotterSoon('message') too.
   Works for content added later (e.g. the injected sidebar).
   ===================================================================== */
(function(){
  const DEFAULT = 'Coming soon in the full version of Plotter.';
  const CHARACTERS = 'The Character library is coming soon — for now, find every character in the editor’s Characters panel.';

  const css = document.createElement('style');
  css.textContent = `
    .soon-toast{ position:fixed; left:50%; bottom:28px; transform:translate(-50%, 16px); opacity:0; pointer-events:none; z-index:10000;
      display:flex; align-items:center; gap:10px; max-width:min(520px, calc(100% - 32px));
      background:#03114c; color:#fff; padding:11px 16px; border-radius:12px; box-shadow:0 14px 34px rgba(3,17,76,0.35);
      font:500 13.5px/1.45 'Inter', system-ui, sans-serif; transition:opacity .2s, transform .2s; }
    .soon-toast.show{ opacity:1; transform:translate(-50%, 0); }
    .soon-toast svg{ width:18px; height:18px; flex-shrink:0; color:#9fc0ef; }`;
  document.head.appendChild(css);

  let el = null, timer = null;
  function show(msg){
    if(!el){
      el = document.createElement('div');
      el.className = 'soon-toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span></span>';
    el.querySelector('span').textContent = msg || DEFAULT;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(timer); timer = setTimeout(() => el.classList.remove('show'), 2800);
  }
  window.plotterSoon = show;

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-soon], a[href]');
    if(!t) return;
    let msg = null;
    if(t.hasAttribute('data-soon')) msg = t.getAttribute('data-soon') || DEFAULT;
    else {
      const href = t.getAttribute('href') || '';
      if(/(^|\/)characters\.html(\?|#|$)/.test(href)) msg = CHARACTERS;
      else if(href.length > 1 && href[0] === '#' && !document.getElementById(href.slice(1))) msg = DEFAULT;
    }
    if(msg){ e.preventDefault(); e.stopImmediatePropagation(); show(msg); }
  }, true);
})();
