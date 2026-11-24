/* =====================================================================
   Plotter — Preview + Publish & Share
   Included by workspace.html and blank_workspace.html.
   - "Preview" opens the student player (play.html) in preview mode.
   - "Publish" opens a modal: visibility, tracking options, optional
     Creator Marketplace listing (70% creator share), then a share link.
   ===================================================================== */
(function(){
  const CSS = `
  .pub-bg{ position:fixed; inset:0; background:rgba(3,17,76,0.45); backdrop-filter:blur(3px); z-index:1000; display:none; align-items:center; justify-content:center; padding:20px; font-family:'Inter',system-ui,sans-serif; }
  .pub-bg.show{ display:flex; animation:pubFade .2s ease; }
  @keyframes pubFade{ from{ opacity:0; } }
  .pub{ background:#fff; color:#03114c; width:min(520px,100%); max-height:calc(100vh - 40px); overflow:auto; border-radius:20px; box-shadow:0 40px 100px rgba(3,17,76,0.35); position:relative; }
  .pub-head{ padding:24px 26px 0; }
  .pub-head h3{ font-family:'Fraunces',Georgia,serif; font-size:22px; font-weight:600; letter-spacing:-0.01em; }
  .pub-head p{ color:#5c6675; font-size:13.5px; margin-top:4px; }
  .pub-x{ position:absolute; top:16px; right:16px; width:34px; height:34px; border-radius:50%; display:grid; place-items:center; color:#5c6675; background:none; border:none; cursor:pointer; }
  .pub-x:hover{ background:#eceff4; color:#03114c; }
  .pub-x svg{ width:16px; height:16px; }
  .pub-body{ padding:20px 26px 6px; }
  .pub-sec{ margin-bottom:18px; }
  .pub-lbl{ font-size:11.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:#8b95a3; margin-bottom:8px; }
  .pub-vis{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .pub-vis label{ display:flex; gap:10px; align-items:flex-start; border:1.5px solid #dfe3ea; border-radius:12px; padding:12px; cursor:pointer; font-size:13px; transition:border-color .15s, background .15s; }
  .pub-vis label:has(input:checked){ border-color:#3c65a7; background:rgba(60,101,167,0.06); }
  .pub-vis input{ accent-color:#3c65a7; margin-top:2px; }
  .pub-vis b{ display:block; font-size:13.5px; }
  .pub-vis span{ color:#8b95a3; font-size:12px; }
  .pub-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 0; border-bottom:1px solid #e8ebf0; font-size:13.5px; }
  .pub-row:last-child{ border-bottom:none; }
  .pub-row small{ display:block; color:#8b95a3; font-size:12px; }
  .pub-sw{ position:relative; width:38px; height:22px; flex-shrink:0; }
  .pub-sw input{ position:absolute; opacity:0; inset:0; cursor:pointer; margin:0; }
  .pub-sw i{ position:absolute; inset:0; border-radius:999px; background:#d5dbe4; transition:background .15s; pointer-events:none; }
  .pub-sw i::after{ content:""; position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.2); transition:transform .15s; }
  .pub-sw input:checked + i{ background:#3c65a7; }
  .pub-sw input:checked + i::after{ transform:translateX(16px); }
  .pub-sw input:focus-visible + i{ outline:2px solid #3c65a7; outline-offset:2px; }
  .pub-sell{ border:1px solid #e8ebf0; border-radius:14px; padding:4px 14px; background:#f7f8fa; }
  .pub-sell-extra{ display:none; padding:4px 0 12px; }
  .pub-sell.on .pub-sell-extra{ display:block; }
  .pub-price{ display:flex; gap:10px; align-items:center; }
  .pub-price .in{ display:flex; align-items:center; background:#fff; border:1px solid #dfe3ea; border-radius:10px; padding:0 10px; width:110px; }
  .pub-price .in span{ color:#8b95a3; font-size:14px; }
  .pub-price input{ border:none; outline:none; padding:9px 4px; font-size:14px; width:100%; font-family:inherit; color:#03114c; }
  .pub-earn{ flex:1; font-size:12.5px; color:#5c6675; }
  .pub-earn b{ color:#03114c; font-size:14px; }
  .pub-foot{ display:flex; justify-content:flex-end; gap:10px; padding:16px 26px 22px; }
  .pub-btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:10px 18px; border-radius:10px; font-size:13.5px; font-weight:600; cursor:pointer; border:1px solid transparent; font-family:inherit; text-decoration:none; }
  .pub-btn svg{ width:15px; height:15px; }
  .pub-btn.pri{ background:linear-gradient(135deg,#3c65a7,#2f548f); color:#fff; box-shadow:0 6px 16px rgba(60,101,167,0.28); }
  .pub-btn.pri:hover{ filter:brightness(1.06); }
  .pub-btn.sec{ background:#fff; color:#03114c; border-color:#dfe3ea; }
  .pub-btn.sec:hover{ border-color:#3c65a7; color:#3c65a7; }
  .pub-done{ text-align:center; padding:30px 26px 8px; }
  .pub-check{ width:56px; height:56px; border-radius:50%; background:#e7f4ec; color:#2f8f5b; display:grid; place-items:center; margin:0 auto 14px; }
  .pub-check svg{ width:28px; height:28px; }
  .pub-link{ display:flex; gap:8px; margin:18px 0 10px; }
  .pub-link input{ flex:1; min-width:0; border:1px solid #dfe3ea; background:#f7f8fa; border-radius:10px; padding:10px 12px; font-size:13.5px; color:#03114c; font-family:inherit; }
  .pub-code{ display:inline-flex; gap:8px; align-items:center; font-size:13px; color:#5c6675; background:#f7f8fa; border:1px solid #e8ebf0; border-radius:10px; padding:8px 12px; }
  .pub-code b{ font-family:'Fraunces',Georgia,serif; font-size:18px; letter-spacing:.12em; color:#03114c; }
  .pub-note{ margin-top:14px; font-size:12.5px; color:#7a5212; background:#fdf3e1; border-radius:10px; padding:10px 12px; text-align:left; }
  .pub-done-actions{ display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:18px; }
  .pub-toast{ position:fixed; left:50%; bottom:28px; transform:translate(-50%,20px); opacity:0; pointer-events:none; background:#03114c; color:#fff; padding:11px 18px; border-radius:10px; font:500 13.5px 'Inter',sans-serif; box-shadow:0 12px 30px rgba(3,17,76,0.3); transition:opacity .2s, transform .2s; z-index:1100; }
  .pub-toast.show{ opacity:1; transform:translate(-50%,0); }
  @media (max-width:520px){ .pub-vis, .pub-done-actions{ grid-template-columns:1fr; } }
  `;

  const ICON = {
    x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
    copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
    chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  };

  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

  const bg = document.createElement('div');
  bg.className = 'pub-bg';
  bg.innerHTML = `<div class="pub" role="dialog" aria-modal="true" aria-labelledby="pubTitle"></div>`;
  document.body.appendChild(bg);
  const box = bg.firstElementChild;

  const toastEl = document.createElement('div'); toastEl.className = 'pub-toast'; document.body.appendChild(toastEl);
  function toast(msg){ toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => toastEl.classList.remove('show'), 2200); }

  const storyName = () => ((document.querySelector('.story-name') || {}).textContent || 'Untitled Project').trim();
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'story';
  const money = n => '$' + n.toFixed(2);

  function openForm(){
    box.innerHTML = `
      <button class="pub-x" data-close aria-label="Close">${ICON.x}</button>
      <div class="pub-head">
        <h3 id="pubTitle">Publish “${escapeHTML(storyName())}”</h3>
        <p>Share your story with students and choose how results are tracked.</p>
      </div>
      <div class="pub-body">
        <div class="pub-sec">
          <div class="pub-lbl">Who can play</div>
          <div class="pub-vis">
            <label><input type="radio" name="pubVis" value="class" checked><div><b>Anyone with the link</b><span>Students join with a link or class code</span></div></label>
            <label><input type="radio" name="pubVis" value="private"><div><b>Only me</b><span>Keep it as a private draft</span></div></label>
          </div>
        </div>
        <div class="pub-sec">
          <div class="pub-lbl">Student experience</div>
          <div class="pub-row"><div>Track results in Analytics<small>Scores, choices, and completion per student</small></div><label class="pub-sw"><input type="checkbox" id="pubTrack" checked aria-label="Track results"><i></i></label></div>
          <div class="pub-row"><div>Show quiz feedback<small>Explain right and wrong answers instantly</small></div><label class="pub-sw"><input type="checkbox" checked aria-label="Show quiz feedback"><i></i></label></div>
          <div class="pub-row"><div>Ask for student name<small>Required to match results to your class list</small></div><label class="pub-sw"><input type="checkbox" checked aria-label="Ask for student name"><i></i></label></div>
        </div>
        <div class="pub-sec">
          <div class="pub-lbl">Creator Marketplace</div>
          <div class="pub-sell" id="pubSell">
            <div class="pub-row"><div>Also sell as a template<small>Other educators can buy and adapt your story</small></div><label class="pub-sw"><input type="checkbox" id="pubSellToggle" aria-label="Sell on marketplace"><i></i></label></div>
            <div class="pub-sell-extra">
              <div class="pub-price">
                <div class="in"><span>$</span><input type="number" id="pubPrice" min="0" step="0.5" value="4" aria-label="Price in dollars"></div>
                <div class="pub-earn">You earn <b id="pubEarn">$2.80</b> per sale (70%)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="pub-foot">
        <button class="pub-btn sec" data-close>Cancel</button>
        <button class="pub-btn pri" id="pubGo">${ICON.check}Publish</button>
      </div>`;

    const sell = box.querySelector('#pubSell');
    box.querySelector('#pubSellToggle').addEventListener('change', e => sell.classList.toggle('on', e.target.checked));
    box.querySelector('#pubPrice').addEventListener('input', e => box.querySelector('#pubEarn').textContent = money(Math.max(0, +e.target.value || 0) * 0.7));
    box.querySelector('#pubGo').addEventListener('click', () => {
      const vis = box.querySelector('input[name=pubVis]:checked').value;
      const selling = box.querySelector('#pubSellToggle').checked;
      const price = Math.max(0, +box.querySelector('#pubPrice').value || 0);
      const track = box.querySelector('#pubTrack').checked;
      showDone({ vis, selling, price, track });
    });
    show();
  }

  function showDone({ vis, selling, price, track }){
    const name = storyName();
    if(vis === 'private'){
      box.innerHTML = `
        <button class="pub-x" data-close aria-label="Close">${ICON.x}</button>
        <div class="pub-done">
          <div class="pub-check">${ICON.check}</div>
          <h3 style="font-family:'Fraunces',serif;font-size:22px;font-weight:600">Saved as private</h3>
          <p style="color:#5c6675;font-size:13.5px;margin-top:4px">Only you can open “${escapeHTML(name)}”. Change visibility anytime to share it.</p>
        </div>
        <div class="pub-foot"><button class="pub-btn pri" data-close>Done</button></div>`;
      return;
    }
    const link = `https://plotter.app/play/${slug(name)}`;
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    box.innerHTML = `
      <button class="pub-x" data-close aria-label="Close">${ICON.x}</button>
      <div class="pub-done">
        <div class="pub-check">${ICON.check}</div>
        <h3 style="font-family:'Fraunces',serif;font-size:22px;font-weight:600">Your story is live!</h3>
        <p style="color:#5c6675;font-size:13.5px;margin-top:4px">Share this link with your students — no accounts needed.</p>
        <div class="pub-link"><input readonly value="${link}" id="pubLink" aria-label="Share link"><button class="pub-btn pri" id="pubCopy">${ICON.copy}Copy</button></div>
        <div class="pub-code">Class code <b>${code}</b></div>
        ${selling ? `<div class="pub-note">Your marketplace listing (${money(price)}, you earn ${money(price * 0.7)} per sale) was submitted for review. <a href="marketplace.html#sell" style="color:#3c65a7;font-weight:600">View listing →</a></div>` : ''}
        <div class="pub-done-actions">
          <a class="pub-btn sec" href="${studentUrl()}" target="_blank" rel="noopener">${ICON.play}Open as student</a>
          ${track ? `<a class="pub-btn sec" href="analytics.html">${ICON.chart}View analytics</a>` : `<button class="pub-btn sec" data-close>Done</button>`}
        </div>
      </div>
      <div style="height:22px"></div>`;
    box.querySelector('#pubCopy').addEventListener('click', () => {
      const inp = box.querySelector('#pubLink');
      inp.select();
      (navigator.clipboard ? navigator.clipboard.writeText(inp.value) : Promise.reject()).catch(() => document.execCommand('copy'));
      toast('Link copied to clipboard');
    });
  }

  function show(){ bg.classList.add('show'); const f = box.querySelector('input, button:not([data-close])'); if(f) f.focus(); }
  function hide(){ bg.classList.remove('show'); }
  bg.addEventListener('click', e => { if(e.target === bg || e.target.closest('[data-close]')) hide(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && bg.classList.contains('show')) hide(); });

  /* The story builder (blank workspace) compiles your story for the player; the demo editor plays the demo lesson. */
  function studentUrl(){
    const u = typeof window.plotterPreviewUrl === 'function' ? window.plotterPreviewUrl() : 'play.html';
    return u + (u.includes('?') ? '&' : '?') + 'mode=student';
  }

  function escapeHTML(s){ return s.replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c])); }

  /* ---- wire the top-bar buttons ---- */
  document.querySelectorAll('.wtop-actions button').forEach(b => {
    const t = b.textContent.trim();
    // story-builder.js (blank workspace) provides the URL of the story you built
    if(t === 'Preview') b.addEventListener('click', () => window.open(typeof window.plotterPreviewUrl === 'function' ? window.plotterPreviewUrl() : 'play.html', '_blank'));
    if(t === 'Publish') b.addEventListener('click', openForm);
  });
})();
