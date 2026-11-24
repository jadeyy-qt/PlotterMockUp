/* =====================================================================
   Plotter — Story Builder for blank_workspace.html

   One editor: every scene has its own canvas. You build a scene by
   dragging elements onto it, and connect scenes with choices.

     • Scene strip (bottom)  — switch / add scenes; shows what's unfinished
     • Canvas                — the selected scene; drag characters, shapes,
                               props, backgrounds; the Dialogue box shows the
                               scene's lines and Choice pills are its paths
     • Story map             — every scene as a node, every path as an arrow
     • Inspector             — element properties when something is selected,
                               otherwise Scene · Dialogue · Choices
     • Preview               — compiles the story and plays it in play.html

   Relies on the canvas engine already in blank_workspace.html (globals):
   stage, stageScroll, createPlaced, wirePlaced, ensureHandle, selectPlaced,
   deselect, updateEmptyState, placedCount, stageImage, stageColor,
   paintStage, renderInspector, colorFieldHTML, wireColorFields,
   openInspector, markDirty, backgrounds, CHARACTERS.
   ===================================================================== */
(function(){
  const STORE_KEY = 'plotter.story.v2';
  const PLAY_KEY  = 'plotter.playStory';
  const STAGE_W = 640, STAGE_H = 400;
  const MAX_CHOICES = 4;
  const BOX_PH = 'Type a line of dialogue…';

  /* ------------------------------------------------------------------ styles */
  const css = document.createElement('style');
  css.textContent = `
  .mode-btn-group, #scenePanel, #inspSceneMode{ display:none !important; }
  .sb-hide{ display:none !important; }
  .sb-viewtoggle{ display:inline-flex; gap:2px; padding:3px; background:var(--panel-3); border-radius:10px; }
  .sb-viewtoggle button{ display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:600; color:var(--text-dim); background:none; border:none; cursor:pointer; font-family:inherit; }
  .sb-viewtoggle button svg{ width:13px; height:13px; }
  .sb-viewtoggle button.active{ background:#fff; color:var(--text); box-shadow:0 1px 4px rgba(3,17,76,0.08); }
  .sb-view{ display:none; flex:1; min-height:0; position:relative; overflow:hidden; }
  .sb-view.on{ display:flex; }

  /* canvas extras: dialogue box placeholder, path labels under choice pills */
  .p-dialogue .txt:empty::before{ content:attr(data-ph); color:#8b95a3; font-style:italic; }
  .p-dialogue.narr .txt{ font-style:italic; }
  .p-dialogue .sp-chip[contenteditable="false"]{ cursor:inherit; }
  .p-choice::after{ content:'→ ' attr(data-dest); position:absolute; left:2px; top:calc(100% + 3px); white-space:nowrap;
    font-size:10px; font-weight:700; color:#fff; background:rgba(3,17,76,0.72); padding:1px 7px; border-radius:5px; pointer-events:none; }
  .p-choice[data-dest="not linked"]::after{ background:#b7791f; }
  .p-choice[data-correct="1"] .placed-shell{ box-shadow: inset 4px 0 0 #2f8f5b; }
  .sb-canvas-tip{ position:absolute; top:12px; left:50%; transform:translateX(-50%); z-index:3; background:#fff; border:1px solid var(--border);
    border-radius:999px; padding:6px 14px; font-size:12px; color:var(--text-dim); box-shadow:0 4px 14px rgba(3,17,76,0.08); pointer-events:none; white-space:nowrap; transition:opacity .3s; }
  .sb-canvas-tip b{ color:var(--text); }

  /* scene strip */
  .sb-strip{ flex-shrink:0; display:flex; align-items:stretch; gap:10px; padding:10px 14px 12px; border-top:1px solid var(--border-soft); background:var(--panel); overflow-x:auto; min-height:118px; }
  .sb-strip-head{ flex-shrink:0; width:128px; display:flex; flex-direction:column; justify-content:space-between; padding:2px 4px 2px 0; border-right:1px solid var(--border-soft); margin-right:2px; }
  .sb-strip-head h4{ font-family:var(--font-display); font-size:12px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); }
  .sb-health{ font-size:11px; line-height:1.4; display:flex; gap:5px; align-items:flex-start; color:var(--text-dim); }
  .sb-health svg{ width:13px; height:13px; flex-shrink:0; margin-top:1px; }
  .sb-health.ok{ color:#1d5e3b; } .sb-health.warn{ color:#9a6712; }
  .sb-reset{ background:none; border:none; padding:0; text-align:left; font-size:10.5px; color:var(--text-faint); cursor:pointer; font-family:inherit; }
  .sb-reset:hover{ color:var(--text); text-decoration:underline; }
  .sb-card{ flex-shrink:0; width:136px; border-radius:10px; border:1.5px solid var(--border); background:#fff; cursor:pointer; overflow:hidden; text-align:left; padding:0; font-family:inherit; transition:border-color .15s, box-shadow .15s, transform .15s; }
  .sb-card:hover{ border-color:var(--accent); transform:translateY(-1px); }
  .sb-card.sel{ border-color:var(--accent); box-shadow:0 0 0 3px rgba(60,101,167,0.22); }
  .sb-card .th{ height:56px; background:#e4e9f0 center/cover; position:relative; }
  .sb-card .th .n{ position:absolute; top:5px; left:5px; background:rgba(3,17,76,0.85); color:#fff; font-size:10px; font-weight:700; padding:1px 6px; border-radius:5px; }
  .sb-card .th .st{ position:absolute; top:5px; right:5px; background:#2f8f5b; color:#fff; font-size:9px; font-weight:700; padding:1px 6px; border-radius:5px; letter-spacing:.04em; }
  .sb-card .th .el{ position:absolute; bottom:4px; right:5px; background:rgba(255,255,255,0.9); color:var(--text-dim); font-size:9.5px; font-weight:600; padding:0 5px; border-radius:4px; }
  .sb-card .bd{ padding:5px 8px 7px; }
  .sb-card .nm{ font-size:11.5px; font-weight:700; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sb-card .tp{ font-size:10.5px; color:var(--text-faint); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sb-card .tp.warn{ color:#9a6712; font-weight:600; }
  .sb-card .tp.end{ color:var(--text); font-weight:600; }
  .sb-joint{ flex-shrink:0; align-self:center; width:22px; height:22px; margin:0 -6px; border-radius:50%; display:grid; place-items:center; background:#fff; border:1.5px solid var(--accent); color:var(--accent); z-index:1; }
  .sb-joint svg{ width:12px; height:12px; }
  .sb-joint.lin{ border-color:#8b95a3; border-style:dashed; color:#5c6675; }
  .sb-joint.none{ width:0; border:none; background:none; margin:0 -5px; }
  .sb-card.add{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; border-style:dashed; color:var(--text-faint); font-size:12px; font-weight:600; }
  .sb-card.add b{ font-size:22px; line-height:1; color:var(--accent); }
  .sb-card.add:hover{ color:var(--accent); }

  /* story map */
  .sb-map{ flex:1; min-width:0; overflow:hidden; position:relative; background:radial-gradient(circle, rgba(3,17,76,0.09) 1px, transparent 1.5px) 0 0/18px 18px; cursor:grab; user-select:none; touch-action:none; }
  .sb-map.panning, .sb-map.panning .sb-node{ cursor:grabbing; }
  .sb-map-world{ position:absolute; left:0; top:0; transform-origin:0 0; will-change:transform; }
  .sb-map-inner{ position:relative; }
  .sb-map-zoom{ position:absolute; right:14px; bottom:14px; z-index:3; display:flex; align-items:center; gap:2px; background:#fff; border:1px solid var(--border); border-radius:10px; padding:3px; box-shadow:0 4px 14px rgba(3,17,76,0.10); cursor:default; }
  .sb-map-zoom button{ min-width:30px; height:28px; padding:0 8px; border:none; background:none; border-radius:7px; font:600 14px/1 inherit; font-family:inherit; color:var(--text); cursor:pointer; }
  .sb-map-zoom button:hover{ background:var(--panel-3); }
  .sb-map-zoom .pct{ font-size:12px; min-width:52px; font-variant-numeric:tabular-nums; }
  .sb-map-zoom .fit{ font-size:12px; border-left:1px solid var(--border); border-radius:0 7px 7px 0; }
  .sb-keys-bg{ position:fixed; inset:0; z-index:2000; background:rgba(3,17,76,0.42); display:none; align-items:center; justify-content:center; padding:20px; }
  .sb-keys-bg.show{ display:flex; }
  .sb-keys{ background:#fff; border-radius:18px; width:min(720px,100%); max-height:calc(100vh - 40px); overflow:auto; padding:22px 26px 24px; box-shadow:0 30px 80px rgba(3,17,76,0.35); position:relative; font-family:inherit; }
  .sb-keys h3{ font-family:var(--font-display, Georgia, serif); font-size:20px; font-weight:600; color:var(--text); margin-bottom:2px; }
  .sb-keys .sub{ font-size:12.5px; color:var(--text-faint); margin-bottom:16px; }
  .sb-keys-x{ position:absolute; top:14px; right:14px; width:32px; height:32px; border-radius:50%; border:none; background:none; color:var(--text-dim); cursor:pointer; font-size:18px; }
  .sb-keys-x:hover{ background:var(--panel-3); }
  .sb-keys-grid{ display:grid; grid-template-columns:1fr 1fr; gap:18px 28px; }
  .sb-keys-grid h4{ font-size:11px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--text-faint); margin-bottom:6px; }
  .sb-keys-row{ display:flex; justify-content:space-between; align-items:center; gap:12px; padding:5px 0; font-size:12.5px; color:var(--text-dim); border-bottom:1px solid var(--border-soft, #e8ebf0); }
  .sb-keys-row:last-child{ border-bottom:none; }
  .sb-keys-row span:last-child{ display:flex; gap:4px; flex-shrink:0; }
  .sb-keys kbd{ font:600 11px/1 inherit; font-family:inherit; color:var(--text); background:var(--panel-2, #f7f8fa); border:1px solid var(--border); border-bottom-width:2px; border-radius:6px; padding:4px 7px; min-width:22px; text-align:center; }
  @media (max-width:640px){ .sb-keys-grid{ grid-template-columns:1fr; } }
  .sb-map-hint{ position:absolute; left:14px; bottom:16px; z-index:3; font-size:11px; color:var(--text-faint); background:rgba(255,255,255,0.85); padding:3px 8px; border-radius:6px; pointer-events:none; }
  .sb-map svg.edges{ position:absolute; left:0; top:0; overflow:visible; pointer-events:none; }
  .sb-node{ position:absolute; width:190px; background:#fff; border:1.5px solid var(--border); border-radius:12px; overflow:hidden; cursor:pointer; box-shadow:0 4px 14px rgba(3,17,76,0.08); transition:border-color .15s, transform .15s; }
  .sb-node:hover{ border-color:var(--accent); transform:translateY(-2px); }
  .sb-node.sel{ border-color:var(--accent); box-shadow:0 0 0 3px rgba(60,101,167,0.25), 0 8px 20px rgba(3,17,76,0.12); }
  .sb-node.orphan{ border-style:dashed; opacity:.85; }
  .sb-node .th{ height:62px; background:#dfe5ee center/cover; position:relative; }
  .sb-node .th .n{ position:absolute; top:6px; left:6px; background:rgba(3,17,76,0.85); color:#fff; font-size:10.5px; font-weight:700; padding:2px 7px; border-radius:5px; }
  .sb-node .th .start{ position:absolute; top:6px; right:6px; background:#2f8f5b; color:#fff; font-size:10px; font-weight:700; padding:2px 7px; border-radius:5px; letter-spacing:.03em; }
  .sb-node .bd{ padding:8px 10px 9px; }
  .sb-node .nm{ font-size:12.5px; font-weight:700; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sb-node .tp{ font-size:11px; color:var(--text-faint); margin-top:1px; display:flex; align-items:center; gap:4px; }
  .sb-node .tp.warn{ color:#9a6712; font-weight:600; } .sb-node .tp.end{ color:#03114c; font-weight:600; }
  .sb-node .tp svg{ width:11px; height:11px; }
  .sb-edge-lbl{ position:absolute; transform:translate(-50%,-50%); background:#fff; border:1px solid var(--border); border-radius:999px; padding:2px 9px; font-size:10.5px; font-weight:600; color:var(--text-dim); white-space:nowrap; max-width:150px; overflow:hidden; text-overflow:ellipsis; pointer-events:none; box-shadow:0 2px 6px rgba(3,17,76,0.06); }
  .sb-edge-lbl.ok{ border-color:#2f8f5b; color:#1d5e3b; }
  .sb-map-legend{ position:absolute; left:12px; top:12px; z-index:3; display:inline-flex; cursor:default; gap:14px; background:#fff; border:1px solid var(--border); border-radius:10px; padding:7px 12px; font-size:11.5px; color:var(--text-dim); }
  .sb-map-legend span{ display:inline-flex; align-items:center; gap:6px; }
  .sb-map-legend i{ width:18px; height:0; border-top:2px solid #3c65a7; display:inline-block; }
  .sb-map-legend i.d{ border-top-style:dashed; border-color:#8b95a3; }
  .sb-col-lbl{ position:absolute; top:-22px; font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--text-faint); }

  /* inspector (scene mode) */
  .sb-tabs{ display:flex; margin:-16px -18px 16px; border-bottom:1px solid var(--border-soft); }
  .sb-tab{ flex:1; text-align:center; padding:12px 2px; font-size:12px; font-weight:700; color:var(--text-faint); border:none; border-bottom:2px solid transparent; background:none; font-family:var(--font-display); cursor:pointer; }
  .sb-tab.active{ color:var(--accent); border-color:var(--accent); }
  .sb-tab .ct{ display:inline-block; min-width:16px; padding:0 4px; margin-left:3px; border-radius:8px; background:var(--panel-3); color:var(--text-dim); font-family:Inter,sans-serif; font-size:10px; line-height:16px; }
  .sb-sec + .sb-sec{ margin-top:20px; }
  .sb-lbl{ display:block; font-family:var(--font-display); font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--accent); margin-bottom:9px; }
  .sb-help{ font-size:11.5px; color:var(--text-faint); line-height:1.5; margin:-3px 0 10px; }
  .sb-in, .sb-sel, .sb-ta{ width:100%; background:var(--panel-2); border:1px solid var(--border); border-radius:9px; padding:8px 10px; color:var(--text); font-size:13px; outline:none; font-family:inherit; }
  .sb-in:focus, .sb-sel:focus, .sb-ta:focus{ border-color:var(--accent); background:#fff; }
  .sb-ta{ resize:vertical; min-height:58px; line-height:1.5; }
  .sb-sel.sm, .sb-in.sm{ padding:6px 8px; font-size:12px; border-radius:7px; }
  .sb-bgs{ display:grid; grid-template-columns:repeat(3,1fr); gap:7px; }
  .sb-bg{ aspect-ratio:4/3; border-radius:8px; background:#e4e9f0 center/cover; border:2px solid transparent; cursor:pointer; position:relative; padding:0; }
  .sb-bg span{ position:absolute; left:0; right:0; bottom:0; font-size:9.5px; font-weight:600; color:#fff; background:linear-gradient(transparent, rgba(3,17,76,0.75)); padding:8px 4px 3px; border-radius:0 0 6px 6px; text-align:center; }
  .sb-bg.none{ display:grid; place-items:center; font-size:11px; color:var(--text-faint); background:repeating-linear-gradient(45deg,#eef1f6 0 6px,#f7f8fa 6px 12px); }
  .sb-bg.sel{ border-color:var(--accent); box-shadow:0 0 0 2px rgba(60,101,167,0.25); }
  .sb-row{ display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:13px; color:var(--text); }
  .sb-row small{ display:block; font-size:11.5px; color:var(--text-faint); }
  .sb-sw{ position:relative; width:36px; height:20px; flex-shrink:0; }
  .sb-sw input{ position:absolute; inset:0; opacity:0; margin:0; cursor:pointer; }
  .sb-sw i{ position:absolute; inset:0; border-radius:999px; background:#d5dbe4; transition:background .15s; pointer-events:none; }
  .sb-sw i::after{ content:""; position:absolute; top:3px; left:3px; width:14px; height:14px; border-radius:50%; background:#fff; transition:transform .15s; box-shadow:0 1px 2px rgba(0,0,0,.2); }
  .sb-sw input:checked + i{ background:var(--accent); }
  .sb-sw input:checked + i::after{ transform:translateX(16px); }
  .sb-sw input:disabled + i{ opacity:.45; }
  .sb-actions{ display:grid; grid-template-columns:1fr 1fr; gap:6px; }
  .sb-mini{ display:flex; align-items:center; justify-content:center; gap:6px; padding:8px; border-radius:9px; border:1px solid var(--border); background:#fff; font-size:12px; font-weight:600; color:var(--text-dim); cursor:pointer; font-family:inherit; }
  .sb-mini:hover:not(:disabled){ border-color:var(--accent); color:var(--accent); }
  .sb-mini:disabled{ opacity:.45; cursor:default; }
  .sb-mini.danger:hover{ border-color:#c2414b; color:#c2414b; }
  .sb-mini svg{ width:13px; height:13px; }
  .sb-item{ background:var(--panel-2); border:1px solid var(--border); border-radius:11px; padding:10px; margin-bottom:8px; }
  .sb-item.focus{ border-color:var(--accent); background:#fff; }
  .sb-item.ok{ border-color:#2f8f5b; }
  .sb-item-top{ display:flex; align-items:center; gap:6px; margin-bottom:7px; }
  .sb-num{ font-size:10.5px; font-weight:700; color:var(--accent); background:#eceff4; padding:2px 7px; border-radius:6px; font-family:var(--font-display); white-space:nowrap; }
  .sb-icon{ width:24px; height:24px; border-radius:6px; border:none; background:none; color:var(--text-faint); cursor:pointer; display:grid; place-items:center; padding:0; flex-shrink:0; }
  .sb-icon:hover:not(:disabled){ background:#e6eaf0; color:var(--text); }
  .sb-icon:disabled{ opacity:.3; cursor:default; }
  .sb-icon svg{ width:13px; height:13px; }
  .sb-grow{ flex:1; min-width:0; }
  .sb-add{ width:100%; padding:9px; border-radius:9px; border:1px dashed var(--border); background:none; color:var(--text-faint); font-size:12.5px; font-weight:600; cursor:pointer; font-family:inherit; }
  .sb-add:hover:not(:disabled){ color:var(--accent); border-color:var(--accent); }
  .sb-add:disabled{ opacity:.45; cursor:default; }
  .sb-link{ display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-faint); margin-top:6px; }
  .sb-link svg{ width:13px; height:13px; color:var(--accent); flex-shrink:0; }
  .sb-quiz{ background:#fff; border:1px solid var(--border); border-radius:12px; padding:11px 12px; margin-bottom:12px; }
  .sb-quiz.on{ border-color:var(--accent); background:rgba(60,101,167,0.04); }
  .sb-quiz-extra{ display:none; margin-top:9px; padding-top:9px; border-top:1px solid var(--border-soft); align-items:center; justify-content:space-between; font-size:12px; color:var(--text-dim); }
  .sb-quiz.on .sb-quiz-extra{ display:flex; }
  .sb-correct{ display:none; align-items:center; gap:5px; font-size:11px; font-weight:600; color:var(--text-faint); cursor:pointer; margin-left:auto; white-space:nowrap; }
  .sb-correct input{ accent-color:#2f8f5b; margin:0; }
  .quiz .sb-correct{ display:inline-flex; }
  .sb-correct:has(input:checked){ color:#2f8f5b; }
  .sb-fb{ display:none; margin-top:6px; }
  .quiz .sb-fb{ display:block; }
  .sb-callout{ display:flex; gap:8px; font-size:12px; line-height:1.5; padding:10px 12px; border-radius:10px; background:#fdf3e1; color:#7a5212; margin-bottom:12px; }
  .sb-callout svg{ width:15px; height:15px; flex-shrink:0; margin-top:1px; }
  .sb-callout.info{ background:rgba(60,101,167,0.07); color:#2f4f86; }
  .sb-linenav{ display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-dim); margin-bottom:8px; }
  .sb-linenav .sb-grow{ text-align:center; font-weight:600; color:var(--text); }
  .sb-toast{ position:fixed; left:50%; bottom:28px; transform:translate(-50%,20px); opacity:0; pointer-events:none; background:#03114c; color:#fff; padding:10px 16px; border-radius:10px; font:500 13px Inter,sans-serif; box-shadow:0 12px 30px rgba(3,17,76,0.3); transition:opacity .2s, transform .2s; z-index:1100; }
  .sb-toast.show{ opacity:1; transform:translate(-50%,0); }
  `;
  document.head.appendChild(css);

  /* ------------------------------------------------------------------ helpers */
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const h  = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const uid = p => (p || 's') + Math.random().toString(36).slice(2, 8);
  const BGS = typeof backgrounds !== 'undefined' ? backgrounds : [];
  const LIB = typeof CHARACTERS !== 'undefined' ? CHARACTERS : [];
  const charName = c => (LIB[c] || {}).name || 'Character';
  const ICON = {
    up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
    down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2m2 0-1 14H7L6 6"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    branch:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 8v8M18 10c0 4-6 3-11.2 6.6"/></svg>',
    flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
    warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/></svg>',
    ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
    info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    canvas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8"/></svg>',
    map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="5" rx="1"/><rect x="15" y="3" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M9 5.5h6M6 8v8.5a2 2 0 0 0 2 2h7"/></svg>',
  };
  const toastEl = document.createElement('div'); toastEl.className = 'sb-toast'; document.body.appendChild(toastEl);
  function toast(m, ms){ toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => toastEl.classList.remove('show'), ms || 2200); }

  /* ------------------------------------------------------------------ model
     scene = { id, name,
               layout:{ color, image, els:[{cls,left,top,data,shell}] },   ← the canvas
               lines:[{who,text}],           who = 'n' (narrator) or character index
               prompt, choices:[{id,text,to,fb}], quiz:{on,points,correctId},
               next, ending, endingTitle }
  --------------------------------------------------------------------------- */
  let story = load() || { scenes: [] };
  let curId = null;
  let lineIdx = 0;
  let tab = 'scene';
  let view = 'canvas';
  let restoring = false;

  function load(){ try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch(e){ return null; } }
  var onPersist;   // set by the undo history below (var: may be called before it is assigned)
  function persist(){ try { localStorage.setItem(STORE_KEY, JSON.stringify(story)); } catch(e){} if(onPersist) onPersist(); }
  const cur  = () => story.scenes.find(s => s.id === curId) || null;
  const byId = id => story.scenes.find(s => s.id === id) || null;
  const idx  = id => story.scenes.findIndex(s => s.id === id);
  const bgOf = s => s.layout && s.layout.image || '';

  function newScene(name){
    return { id:uid(), name: name || `Scene ${story.scenes.length + 1}`,
             layout:{ color:'#f7f8fa', image:'', els:[] }, lines:[], prompt:'',
             choices:[], quiz:{ on:false, points:10, correctId:null }, next:null, ending:false, endingTitle:'' };
  }
  function kind(s){
    if(s.choices.length) return 'branch';
    if(s.ending) return 'ending';
    if(s.next && byId(s.next)) return 'linear';
    return 'dead';
  }
  function kindLabel(s){
    const k = kind(s);
    if(k === 'branch') return `${s.choices.length} path${s.choices.length > 1 ? 's' : ''}${s.quiz.on ? ' · quiz' : ''}`;
    if(k === 'ending') return s.endingTitle || 'Ending';
    if(k === 'linear') return '→ ' + byId(s.next).name;
    return 'No next step yet';
  }
  function outs(s){
    if(s.choices.length) return s.choices.filter(c => c.to && byId(c.to)).map(c => ({ to:c.to, label:c.text, ok: s.quiz.on && s.quiz.correctId === c.id }));
    if(!s.ending && s.next && byId(s.next)) return [{ to:s.next, label:'', linear:true }];
    return [];
  }
  function reachable(){
    const seen = new Set(), q = story.scenes[0] ? [story.scenes[0].id] : [];
    while(q.length){ const id = q.shift(); if(seen.has(id)) continue; seen.add(id); const s = byId(id); if(s) outs(s).forEach(o => q.push(o.to)); }
    return seen;
  }
  function health(){
    const r = reachable();
    const dead = story.scenes.filter(s => kind(s) === 'dead').length;
    const loose = story.scenes.reduce((n, s) => n + s.choices.filter(c => !c.to || !byId(c.to)).length, 0);
    const orphan = story.scenes.filter(s => !r.has(s.id)).length;
    const endings = story.scenes.filter(s => s.ending && !s.choices.length && r.has(s.id)).length;
    return { dead, loose, orphan, endings, ok: !dead && !loose && !orphan && endings > 0 };
  }
  const speakersOnCanvas = () => [...new Set($$('.p-sprite.has-img', stage).map(el => +el.dataset.charIndex))];

  /* ------------------------------------------------------------------ canvas ⇄ scene */
  function serialize(el){
    const data = { ...el.dataset }; delete data.id; delete data.wired;
    const shell = el.querySelector('.placed-shell');
    return { cls: el.className.replace(/\bselected\b/g, '').trim(), left: parseFloat(el.style.left) || 0, top: parseFloat(el.style.top) || 0, data, shell: shell ? shell.outerHTML : '' };
  }
  function snapshot(){
    const s = cur(); if(!s || restoring) return;
    s.layout = { color: stageColor, image: stageImage, els: $$('.placed', stage).map(serialize) };
  }
  function restore(s){
    restoring = true;
    if(typeof deselect === 'function') deselect();
    $$('.placed', stage).forEach(el => el.remove());
    const L = s.layout || { color:'#f7f8fa', image:'', els:[] };
    L.els.forEach(spec => {
      const el = document.createElement('div');
      el.className = spec.cls;
      Object.entries(spec.data || {}).forEach(([k, v]) => el.dataset[k] = v);
      el.dataset.id = uid('el');
      el.style.left = spec.left + 'px'; el.style.top = spec.top + 'px';
      el.innerHTML = `<div class="placed-del" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6 6 18M6 6l12 12"/></svg></div>` + spec.shell;
      ensureHandle(el);
      stage.appendChild(el);
      wirePlaced(el);
    });
    $$('.placed [contenteditable]', stage).forEach(ed => ed.contentEditable = 'false');   // drag first, double-click to edit
    placedCount = L.els.length;
    stageImage = L.image || ''; stageColor = L.color || '#f7f8fa';
    paintStage(); updateEmptyState();
    restoring = false;
    renderBox(); renderPills();
  }

  /* Read story data back from the canvas (typing in the box/pills, deleted or duplicated pills). */
  function syncFromCanvas(){
    const s = cur(); if(!s || restoring) return;
    // one dialogue box per scene
    const boxes = $$('.p-dialogue', stage);
    boxes.slice(1).forEach(b => { b.remove(); placedCount--; toast('A scene has one dialogue box — add more lines instead.'); });
    if(boxes.length > 1) updateEmptyState();
    const box = boxes[0];
    if(box){
      const t = box.querySelector('.txt').textContent;
      if(s.lines[lineIdx]) s.lines[lineIdx].text = t;
      else if(t.trim()){ s.lines.push({ who: defaultSpeaker(), text:t }); lineIdx = s.lines.length - 1; renderBox(); }
    }
    // choice pills ⇄ choices
    const seen = new Set();
    $$('.p-choice', stage).forEach(p => {
      const text = p.querySelector('.placed-shell').textContent.trim();
      let c = s.choices.find(x => x.id === p.dataset.choiceId);
      if(!c || seen.has(c.id)){                          // duplicated pill → new path
        c = { id:uid('c'), text, to:null, fb:'' }; s.choices.push(c); p.dataset.choiceId = c.id;
      }
      c.text = text; seen.add(c.id);
    });
    const before = s.choices.length;
    s.choices = s.choices.filter(c => seen.has(c.id));
    if(s.choices.length < before && !clearing) toast('Choice removed');
    if(!s.choices.find(c => c.id === s.quiz.correctId)) s.quiz.correctId = s.choices[0] ? s.choices[0].id : null;
    if(!s.choices.length) s.quiz.on = false;
    if(s.choices.length){ s.ending = false; s.next = null; }
    renderPills();
  }

  function defaultSpeaker(){ const sp = speakersOnCanvas(); return sp.length ? sp[0] : 'n'; }

  /* Paint the current line into the dialogue box. */
  function renderBox(){
    const box = $('.p-dialogue', stage); if(!box) return;
    const s = cur(); const l = s && s.lines[lineIdx];
    const chip = box.querySelector('.sp-chip'), txt = box.querySelector('.txt');
    chip.contentEditable = 'false'; chip.dataset.noedit = '1';   // speaker comes from the Dialogue tab
    txt.dataset.ph = BOX_PH;
    const narr = !l || l.who === 'n';
    chip.style.display = narr ? 'none' : '';
    chip.textContent = narr ? '' : charName(l.who);
    box.classList.toggle('narr', !!l && l.who === 'n');
    if(document.activeElement !== txt) txt.textContent = l ? l.text : '';
  }
  /* Keep pill texts and their "→ destination" labels in step with the model. */
  function renderPills(){
    const s = cur(); if(!s) return;
    $$('.p-choice', stage).forEach(p => {
      const c = s.choices.find(x => x.id === p.dataset.choiceId); if(!c) return;
      const t = byId(c.to);
      p.dataset.dest = t ? t.name : 'not linked';
      p.dataset.correct = s.quiz.on && s.quiz.correctId === c.id ? '1' : '0';
      const sh = p.querySelector('.placed-shell');
      if(document.activeElement !== sh && sh.textContent !== c.text) sh.textContent = c.text;
    });
  }

  function addPill(c, x, y){
    const el = createPlaced('choice', x, y, null);
    el.querySelector('.placed-shell').textContent = c.text || 'New choice';
    el.dataset.choiceId = c.id;
    renderPills();
    return el;
  }
  function ensureBox(x, y){
    let box = $('.p-dialogue', stage);
    if(!box){ box = createPlaced('dialogue', x ?? STAGE_W/2, y ?? STAGE_H - 70, null); renderBox(); }
    return box;
  }

  /* ------------------------------------------------------------------ hooks into the canvas engine */
  let saveT = null, clearing = false;
  const origMarkDirty = window.markDirty;
  window.markDirty = function(){
    origMarkDirty();
    if(restoring) return;
    clearTimeout(saveT);
    saveT = setTimeout(() => { syncFromCanvas(); snapshot(); persist(); renderStrip(); refreshCounts(); renderTip(); }, 120);
  };
  // immediate sync while typing on the canvas
  stage.addEventListener('input', e => {
    if(e.target.closest('.p-dialogue .txt') || e.target.closest('.p-choice')){ syncFromCanvas(); persist(); refreshCounts(); }
  });

  // Dropping "Dialogue box" or "Choice pill" adds story content instead of loose decorations.
  stageScroll.addEventListener('drop', e => {
    const type = e.dataTransfer.getData('type');
    if(type !== 'dialogue' && type !== 'choice') return;
    e.preventDefault(); e.stopPropagation();
    stage.classList.remove('drag-over');
    const s = cur(); if(!s) return;
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / zoom, y = (e.clientY - r.top) / zoom;
    if(type === 'dialogue'){
      const had = !!$('.p-dialogue', stage);
      const box = ensureBox(x, y);
      if(had){ s.lines.push({ who: defaultSpeaker(), text:'' }); lineIdx = s.lines.length - 1; renderBox(); }
      selectPlaced(box);
      renderInspector(box);
      setTimeout(() => startEditing(box, box.querySelector('.txt')), 30);
      toast(had ? `Line ${lineIdx + 1} added — type it in the box` : 'Dialogue box added — type the first line');
    } else {
      if(s.choices.length >= MAX_CHOICES){ toast(`A scene can have up to ${MAX_CHOICES} choices`); return; }
      const c = { id:uid('c'), text:'', to:null, fb:'' };
      s.choices.push(c); s.ending = false; s.next = null;
      if(!s.quiz.correctId) s.quiz.correctId = c.id;
      const el = addPill(c, x, y);
      renderInspector(el);
      setTimeout(() => startEditing(el), 30);
      toast('Type the choice, then set where it leads in Properties');
    }
    markDirty();
  }, true);

  // "Clear canvas" keeps the story (dialogue box + choices) and clears the art.
  const clearBtn = $('#clearBtn');
  clearBtn.addEventListener('click', e => {
    e.stopImmediatePropagation();
    const art = $$('.placed', stage).filter(el => !el.classList.contains('p-dialogue') && !el.classList.contains('p-choice'));
    if(!art.length && !stageImage) return;
    if(!confirm('Clear this scene\'s canvas? Characters, shapes, props and the background are removed. Dialogue and choices are kept.')) return;
    deselect(); art.forEach(el => el.remove());
    placedCount = $$('.placed', stage).length; stageImage = ''; paintStage(); updateEmptyState(); markDirty();
  }, true);

  // Element inspector: enrich the dialogue box and choice pills with story controls.
  const origRenderInspector = window.renderInspector;
  window.renderInspector = function(el){
    origRenderInspector(el);
    setHead('Properties');
    if(el.dataset.type === 'dialogue') enhanceBoxInspector(el);
    if(el.dataset.type === 'choice') enhancePillInspector(el);
  };
  // With nothing selected, the inspector shows the scene.
  window.renderStageInspector = function(){ renderSceneInspector(); };

  /* ------------------------------------------------------------------ layout scaffolding */
  const canvasWrap = $('.canvas-wrap'), toolbar = $('.canvas-toolbar');
  const inspBody = $('#inspBody'), inspHead = $('#inspStageMode .insp-head h3');
  const crumb = $('#crumbScene');
  function setHead(t){ if(inspHead) inspHead.textContent = t; }

  const toggle = document.createElement('div');
  toggle.className = 'sb-viewtoggle';
  toggle.innerHTML = `<button data-v="canvas" class="active">${ICON.canvas}Canvas</button><button data-v="map">${ICON.map}Story map</button>`;
  toolbar.prepend(toggle);
  toggle.addEventListener('click', e => { const b = e.target.closest('button'); if(b) setView(b.dataset.v); });
  const stageTools = ['#clearBtn', '.tool-toggles', '.zoom-ctrl'].map(s => $(s, toolbar)).filter(Boolean);

  const mapEl = document.createElement('div'); mapEl.className = 'sb-view';
  stageScroll.after(mapEl);
  const strip = document.createElement('div'); strip.className = 'sb-strip';
  canvasWrap.appendChild(strip);

  const tip = document.createElement('div'); tip.className = 'sb-canvas-tip';
  stageScroll.appendChild(tip);
  function renderTip(){
    const s = cur(); if(!s){ tip.style.opacity = 0; return; }
    const hasArt = $$('.placed', stage).some(el => !el.classList.contains('p-dialogue') && !el.classList.contains('p-choice')) || stageImage;
    tip.innerHTML = !hasArt ? 'Drag a <b>background</b> and <b>characters</b> from the left onto the canvas'
      : !s.lines.length ? 'Drag a <b>Dialogue box</b> onto the canvas to write what happens'
      : (!s.choices.length && kind(s) === 'dead') ? 'Drag a <b>Choice pill</b> to branch, or pick what comes next in the <b>Choices</b> tab'
      : '';
    tip.style.opacity = tip.innerHTML ? 1 : 0;
  }

  function setView(v){
    view = v;
    $$('button', toggle).forEach(b => b.classList.toggle('active', b.dataset.v === v));
    const map = v === 'map';
    if(map){ snapshot(); deselect(); }
    stageScroll.classList.toggle('sb-hide', map);
    stageTools.forEach(el => el.classList.toggle('sb-hide', map));
    mapEl.classList.toggle('on', map);
    if(map) renderMap();
  }

  /* ------------------------------------------------------------------ actions */
  function switchScene(id){
    if(id === curId) return;
    snapshot(); persist();
    curId = id; lineIdx = 0;
    const s = cur();
    restore(s);
    crumb.textContent = s.name;
    renderSceneInspector(); renderStrip(); renderTip();
    if(view === 'map') renderMap();
  }
  function addScene(opts = {}){
    snapshot();
    const prev = cur();
    const s = newScene(opts.name);
    if(prev && opts.carry !== false){
      // carry the setting over: same background and characters, ready to rearrange
      s.layout = { color: prev.layout.color, image: prev.layout.image,
                   els: prev.layout.els.filter(e => /\bp-sprite\b/.test(e.cls)).map(e => JSON.parse(JSON.stringify(e))) };
    }
    const at = opts.after != null ? opts.after + 1 : story.scenes.length;
    story.scenes.splice(at, 0, s);
    if(opts.link !== false && prev && !prev.choices.length && !prev.ending && !prev.next) prev.next = s.id;
    persist();
    return s;
  }
  function deleteScene(id){
    const s = byId(id); if(!s) return;
    if(story.scenes.length === 1){ toast('A story needs at least one scene'); return; }
    if(!confirm(`Delete "${s.name}"? Paths that lead to it will be disconnected.`)) return;
    const i = idx(id);
    story.scenes.splice(i, 1);
    story.scenes.forEach(o => { if(o.next === id) o.next = null; o.choices.forEach(c => { if(c.to === id) c.to = null; }); });
    curId = null;
    switchScene((story.scenes[i] || story.scenes[i - 1]).id);
    persist();
  }
  /* Duplicate = "continue this scene". The copy is inserted right after the
     original and the original now flows into it:
        before:  Scene 1 ──▶ (its choices / next scene / ending)
        after:   Scene 1 ──▶ Scene 1 (copy) ──▶ (those same choices / next / ending)
     So the copy takes over everything that came after the original. */
  function duplicateScene(id){
    snapshot();
    const s = byId(id); const copy = JSON.parse(JSON.stringify(s));
    copy.id = uid(); copy.name = s.name + ' (copy)';
    copy.choices.forEach(c => { const old = c.id; c.id = uid('c'); if(copy.quiz.correctId === old) copy.quiz.correctId = c.id;
      copy.layout.els.forEach(e => { if(e.data && e.data.choiceId === old) e.data.choiceId = c.id; }); });
    story.scenes.splice(idx(id) + 1, 0, copy);

    const moved = s.choices.length ? `its ${s.choices.length} choice${s.choices.length > 1 ? 's' : ''} moved to the copy`
                : s.ending ? 'the ending moved to the copy'
                : byId(s.next) ? `the copy continues to "${byId(s.next).name}"` : '';
    // the original hands its outgoing links to the copy and now leads into it
    s.choices = []; s.prompt = '';
    s.quiz = { on:false, points: s.quiz.points, correctId:null };
    s.ending = false; s.endingTitle = '';
    s.next = copy.id;
    s.layout.els = s.layout.els.filter(e => !/\bp-choice\b/.test(e.cls));

    persist();
    curId = null;                    // don't let the switch re-save the old canvas over the change above
    switchScene(copy.id);
    toast(`"${s.name}" now continues to its copy${moved ? ' — ' + moved : ''}.`, 4500);
  }
  function moveScene(id, d){
    const i = idx(id), j = i + d; if(j < 0 || j >= story.scenes.length) return;
    [story.scenes[i], story.scenes[j]] = [story.scenes[j], story.scenes[i]];
    persist(); renderStrip(); renderSceneInspector(); if(view === 'map') renderMap();
  }
  function changed(opts = {}){
    markDirty(); renderStrip(); refreshCounts(); renderPills(); renderTip();
    if(opts.inspector) renderSceneInspector();
    if(view === 'map') renderMap();
  }

  /* ------------------------------------------------------------------ scene strip */
  function renderStrip(){
    const r = reachable(), hl = health();
    strip.innerHTML = `
      <div class="sb-strip-head">
        <h4>Scenes · ${story.scenes.length}</h4>
        <div class="sb-health ${hl.ok ? 'ok' : 'warn'}" title="Story check">${hl.ok ? ICON.ok + 'Every path reaches an ending' :
          ICON.warn + (!hl.endings ? 'No ending yet' : hl.loose ? `${hl.loose} choice${hl.loose > 1 ? 's' : ''} not linked` : hl.dead ? `${hl.dead} scene${hl.dead > 1 ? 's' : ''} with no next step` : `${hl.orphan} scene${hl.orphan > 1 ? 's' : ''} not linked`)}</div>
        <button class="sb-reset" data-reset>Start over</button>
      </div>
      ${story.scenes.map((s, i) => {
        const k = kind(s), bg = bgOf(s), orphan = !r.has(s.id);
        const n = (s.layout.els || []).filter(e => !/p-(dialogue|choice)/.test(e.cls)).length;
        return `<button class="sb-card ${s.id === curId ? 'sel' : ''}" data-id="${s.id}" title="${h(s.name)}">
          <div class="th" style="${bg ? `background-image:url('${bg}')` : `background:${s.layout.color || '#e4e9f0'}`}"><span class="n">${i + 1}</span>${i === 0 ? '<span class="st">START</span>' : ''}${n ? `<span class="el">${n} item${n > 1 ? 's' : ''}</span>` : ''}</div>
          <div class="bd"><div class="nm">${h(s.name)}</div>
          <div class="tp ${(k === 'dead' || (orphan && i > 0)) ? 'warn' : k === 'ending' ? 'end' : ''}">${orphan && i > 0 ? '⚠ Not linked' : (k === 'dead' ? '⚠ ' : k === 'ending' ? '⚑ ' : '') + h(kindLabel(s))}</div></div>
        </button>${joint(s, story.scenes[i + 1])}`;
      }).join('')}
      <button class="sb-card add" data-add title="Add a scene"><b>+</b>New scene</button>`;
    const sel = $('.sb-card.sel', strip);
    if(sel && (sel.offsetLeft < strip.scrollLeft || sel.offsetLeft + sel.offsetWidth > strip.scrollLeft + strip.clientWidth)) sel.scrollIntoView({ block:'nearest', inline:'nearest' });
  }
  /* Arrow between two neighbouring cards when the first one leads to the second. */
  function joint(s, t){
    if(!t) return '';
    const o = outs(s).find(x => x.to === t.id);
    if(!o) return '<span class="sb-joint none" aria-hidden="true"></span>';
    const tip = o.linear ? `“${s.name}” continues to “${t.name}”` : `Choice “${o.label || 'untitled'}” leads to “${t.name}”`;
    return `<span class="sb-joint ${o.linear ? 'lin' : 'br'}" title="${h(tip)}" aria-label="${h(tip)}">${o.linear ? ICON.arrow : ICON.branch}</span>`;
  }

  strip.addEventListener('click', e => {
    if(e.target.closest('[data-reset]')){
      if(!confirm('Delete every scene and start a new story from scratch?')) return;
      story = { scenes:[newScene('Scene 1')] }; curId = null; persist(); switchScene(story.scenes[0].id); return;
    }
    if(e.target.closest('[data-add]')){
      const s = addScene({ after: idx(curId) });
      switchScene(s.id); toast(`Added "${s.name}"`);
      tab = 'scene'; renderSceneInspector();
      setTimeout(() => { const n = $('#sbName'); if(n){ n.focus(); n.select(); } }, 30);
      return;
    }
    const c = e.target.closest('.sb-card[data-id]'); if(c) switchScene(c.dataset.id);
  });

  /* ------------------------------------------------------------------ story map */
  function renderMap(){
    const start = story.scenes[0]; if(!start){ mapEl.innerHTML = ''; return; }
    const depth = new Map(), q = [[start.id, 0]];
    while(q.length){ const [id, d] = q.shift(); if(depth.has(id)) continue; depth.set(id, d); outs(byId(id)).forEach(o => { if(!depth.has(o.to)) q.push([o.to, d + 1]); }); }
    const maxD = Math.max(0, ...depth.values()), cols = [];
    story.scenes.forEach(s => { const d = depth.has(s.id) ? depth.get(s.id) : maxD + 1; (cols[d] = cols[d] || []).push(s); });
    const W = 190, H = 112, GX = 120, GY = 40;
    const tallest = Math.max(...cols.filter(Boolean).map(c => c.length));
    const pos = {};
    cols.forEach((col, d) => { if(!col) return; const off = (tallest - col.length) * (H + GY) / 2; col.forEach((s, r) => pos[s.id] = { x: d * (W + GX), y: off + r * (H + GY) }); });
    const width = cols.length * (W + GX) - GX, height = tallest * (H + GY) - GY;
    const orphanCol = cols.length - 1 > maxD ? maxD + 1 : -1;
    let edges = '', labels = '';
    story.scenes.forEach(s => {
      const a = pos[s.id], os = outs(s), same = {};
      os.forEach(o => (same[o.to] = same[o.to] || []).push(o));
      os.forEach((o, oi) => {
        const b = pos[o.to]; if(!b) return;
        const sib = same[o.to], si = sib.indexOf(o);
        const x1 = a.x + W, y1 = a.y + H/2 + (oi - (os.length - 1) / 2) * 14, x2 = b.x, y2 = b.y + H/2 + (si - (sib.length - 1) / 2) * 30;
        let d, ly;
        if(x2 > x1){ const mx = (x1 + x2) / 2; d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2 - 6},${y2}`; ly = (y1 + y2) / 2 + (sib.length > 1 ? (si - (sib.length - 1) / 2) * 26 : 0); }
        else { const dy = Math.max(a.y, b.y) + H + 28; d = `M${x1},${y1} C${x1 + 70},${y1} ${x1 + 70},${dy} ${(x1 + x2) / 2},${dy} S${x2 - 70},${y2} ${x2 - 6},${y2}`; ly = dy; }
        const col = o.ok ? '#2f8f5b' : o.linear ? '#8b95a3' : '#3c65a7';
        edges += `<path d="${d}" fill="none" stroke="${col}" stroke-width="2" ${o.linear ? 'stroke-dasharray="5 5"' : ''} marker-end="url(#${o.ok ? 'mOk' : o.linear ? 'mGr' : 'mBl'})"/>`;
        if(o.label) labels += `<div class="sb-edge-lbl ${o.ok ? 'ok' : ''}" style="left:${(x1 + x2) / 2}px;top:${ly}px" title="${h(o.label)}">${o.ok ? '✓ ' : ''}${h(o.label)}</div>`;
      });
    });
    const r = reachable();
    const nodes = story.scenes.map((s, i) => {
      const p = pos[s.id], k = kind(s), bg = bgOf(s);
      const tp = k === 'branch' ? `${ICON.branch}${s.choices.length} paths${s.quiz.on ? ' · quiz' : ''}` : k === 'ending' ? `${ICON.flag}${h(s.endingTitle || 'Ending')}` : k === 'linear' ? `${s.lines.length} line${s.lines.length === 1 ? '' : 's'}` : '⚠ No next step';
      return `<div class="sb-node ${s.id === curId ? 'sel' : ''} ${r.has(s.id) ? '' : 'orphan'}" data-id="${s.id}" style="left:${p.x}px;top:${p.y}px" title="Click to select · double-click to edit on canvas">
        <div class="th" style="${bg ? `background-image:url('${bg}')` : `background:${s.layout.color}`}"><span class="n">${i + 1}</span>${i === 0 ? '<span class="start">START</span>' : ''}</div>
        <div class="bd"><div class="nm">${h(s.name)}</div><div class="tp ${k === 'dead' ? 'warn' : k === 'ending' ? 'end' : ''}">${tp}</div></div></div>`;
    }).join('');
    const mk = (id, c) => `<marker id="${id}" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto"><path d="M0,1 L7,5 L0,9 Z" fill="${c}"/></marker>`;
    mapEl.innerHTML = `<div class="sb-map">
      <div class="sb-map-world">
        <div class="sb-map-inner" style="width:${width}px;height:${height + 70}px">
          ${orphanCol >= 0 ? `<div class="sb-col-lbl" style="left:${orphanCol * (W + GX)}px">Not linked yet</div>` : ''}
          <svg class="edges" width="${width}" height="${height + 70}"><defs>${mk('mBl', '#3c65a7')}${mk('mOk', '#2f8f5b')}${mk('mGr', '#8b95a3')}</defs>${edges}</svg>
          ${nodes}${labels}
        </div>
      </div>
      <div class="sb-map-legend"><span><i></i>Choice path</span><span><i class="d"></i>Continues to</span><span style="color:#2f8f5b"><i style="border-color:#2f8f5b"></i>Correct answer</span></div>
      <div class="sb-map-zoom" role="group" aria-label="Map zoom">
        <button type="button" data-z="out" title="Zoom out (Ctrl + scroll)">−</button>
        <button type="button" data-z="100" class="pct" title="Reset to 100%">100%</button>
        <button type="button" data-z="in" title="Zoom in (Ctrl + scroll)">+</button>
        <button type="button" data-z="fit" class="fit" title="Fit the whole story">Fit</button>
      </div>
      <div class="sb-map-hint">Drag to move · Scroll to pan · Ctrl + scroll to zoom</div>
    </div>`;
    if(!mv.fitted){ mv.fitted = true; fitMap(); } else applyMapView();   // keep where you were when the map redraws
  }

  /* ---- map viewport: pan & zoom (like the canvas) ---- */
  const mv = { x:40, y:70, k:1, fitted:false };
  const MAP_MIN = 0.25, MAP_MAX = 2;
  const clampK = k => Math.min(MAP_MAX, Math.max(MAP_MIN, k));
  function applyMapView(){
    const m = $('.sb-map', mapEl), w = $('.sb-map-world', mapEl); if(!m || !w) return;
    w.style.transform = `translate(${mv.x}px, ${mv.y}px) scale(${mv.k})`;
    m.style.backgroundSize = `${18 * mv.k}px ${18 * mv.k}px`;
    m.style.backgroundPosition = `${mv.x}px ${mv.y}px`;
    const pct = $('.sb-map-zoom .pct', mapEl); if(pct) pct.textContent = Math.round(mv.k * 100) + '%';
  }
  function fitMap(){
    const m = $('.sb-map', mapEl), inner = $('.sb-map-inner', mapEl); if(!m || !inner) return;
    const iw = inner.offsetWidth, ih = inner.offsetHeight, vw = m.clientWidth, vh = m.clientHeight;
    if(!vw || !vh){ applyMapView(); return; }
    mv.k = clampK(Math.min(1, (vw - 80) / iw, (vh - 130) / ih));
    mv.x = (vw - iw * mv.k) / 2;
    mv.y = Math.max(70, (vh - ih * mv.k) / 2 + 10);
    applyMapView();
  }
  function zoomMapAt(k, cx, cy){
    k = clampK(k);
    mv.x = cx - (cx - mv.x) * k / mv.k;
    mv.y = cy - (cy - mv.y) * k / mv.k;
    mv.k = k; applyMapView();
  }
  function zoomMapCenter(k){ const m = $('.sb-map', mapEl); if(m) zoomMapAt(k, m.clientWidth / 2, m.clientHeight / 2); }

  // Drag anywhere (background or a scene) to move the map; a click without moving still selects.
  let pan = null, panned = false;
  mapEl.addEventListener('pointerdown', e => {
    const m = e.target.closest('.sb-map');
    if(!m || e.target.closest('.sb-map-zoom, .sb-map-legend') || (e.button !== 0 && e.button !== 1)) return;
    e.preventDefault();
    pan = { m, x:e.clientX, y:e.clientY, ox:mv.x, oy:mv.y, id:e.pointerId };
    panned = false;
  });
  window.addEventListener('pointermove', e => {
    if(!pan || e.pointerId !== pan.id) return;
    const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
    if(!panned){
      if(Math.hypot(dx, dy) < 4) return;                 // small wobble = still a click
      panned = true; pan.m.classList.add('panning');
    }
    mv.x = pan.ox + dx; mv.y = pan.oy + dy; applyMapView();
  });
  const endPan = e => { if(pan && (!e || e.pointerId === pan.id)){ pan.m.classList.remove('panning'); pan = null; } };
  window.addEventListener('pointerup', endPan);
  window.addEventListener('pointercancel', endPan);
  // swallow the click that ends a drag so panning over a scene doesn't select it
  mapEl.addEventListener('click', e => { if(panned){ panned = false; e.stopImmediatePropagation(); e.preventDefault(); } }, true);

  // Wheel pans (Shift = sideways); Ctrl/⌘ + wheel or trackpad pinch zooms at the cursor.
  mapEl.addEventListener('wheel', e => {
    const m = e.target.closest('.sb-map'); if(!m) return;
    e.preventDefault();
    if(e.ctrlKey || e.metaKey){
      const r = m.getBoundingClientRect();
      zoomMapAt(mv.k * Math.exp(-e.deltaY * 0.0022), e.clientX - r.left, e.clientY - r.top);
    } else {
      const dx = e.shiftKey ? e.deltaY : e.deltaX, dy = e.shiftKey ? 0 : e.deltaY;
      mv.x -= dx; mv.y -= dy; applyMapView();
    }
  }, { passive:false });

  mapEl.addEventListener('click', e => {
    const b = e.target.closest('.sb-map-zoom button'); if(!b) return;
    e.stopPropagation();
    const z = b.dataset.z;
    if(z === 'in') zoomMapCenter(mv.k * 1.25);
    else if(z === 'out') zoomMapCenter(mv.k / 1.25);
    else if(z === '100') zoomMapCenter(1);
    else fitMap();
  });
  // keyboard while the map is showing: + / − / 0 (fit)
  document.addEventListener('keydown', e => {
    if(view !== 'map' || e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if(e.key === '+' || e.key === '='){ e.preventDefault(); zoomMapCenter(mv.k * 1.25); }
    else if(e.key === '-' || e.key === '_'){ e.preventDefault(); zoomMapCenter(mv.k / 1.25); }
    else if(e.key === '0'){ e.preventDefault(); fitMap(); }
  }, true);
  mapEl.addEventListener('click', e => { const n = e.target.closest('.sb-node'); if(n){ switchScene(n.dataset.id); renderMap(); } });
  mapEl.addEventListener('dblclick', e => { const n = e.target.closest('.sb-node'); if(n){ switchScene(n.dataset.id); setView('canvas'); } });

  /* ------------------------------------------------------------------ inspector: scene (nothing selected) */
  const sceneOptions = (curTo, selfId) =>
    `<option value="">— Choose a scene —</option>` +
    story.scenes.filter(o => o.id !== selfId).map(o => `<option value="${o.id}" ${o.id === curTo ? 'selected' : ''}>${story.scenes.indexOf(o) + 1}. ${h(o.name)}</option>`).join('') +
    `<option value="__new">＋ Create a new scene…</option>`;

  function linkTo(onPick, value, name){
    if(value === '__new'){
      const nm = (name || '').replace(/^["“']+|["”']+$/g, '').trim().slice(0, 40);
      const t = addScene({ name: nm || undefined, after: story.scenes.length - 1, link:false, carry:true });
      onPick(t.id); toast(`Created "${t.name}" and linked it`);
    } else onPick(value || null);
  }

  function tabsHTML(s){
    const T = [['scene', 'Scene'], ['dialogue', 'Dialogue', s.lines.length], ['choices', 'Choices', s.choices.length]];
    return `<div class="sb-tabs">${T.map(([k, l, n]) => `<button class="sb-tab ${tab === k ? 'active' : ''}" data-t="${k}">${l}${n ? `<span class="ct">${n}</span>` : ''}</button>`).join('')}</div>`;
  }
  function refreshCounts(){
    const s = cur(); if(!s || !inspBody.querySelector('.sb-tabs')) return;
    $$('.sb-tab', inspBody).forEach(b => {
      const n = b.dataset.t === 'dialogue' ? s.lines.length : b.dataset.t === 'choices' ? s.choices.length : 0;
      const ct = b.querySelector('.ct');
      if(n && ct) ct.textContent = n; else if(n) b.insertAdjacentHTML('beforeend', `<span class="ct">${n}</span>`); else if(ct) ct.remove();
    });
  }

  function renderSceneInspector(){
    if(!inspBody) return;
    const s = cur(); if(!s){ inspBody.innerHTML = ''; return; }
    if(selectedEl) return;                         // element properties are showing
    setHead('Scene');
    const i = idx(s.id);
    let body = '';
    if(tab === 'scene'){
      body = `
        <div class="sb-sec"><label class="sb-lbl" for="sbName">Scene name</label><input class="sb-in" id="sbName" value="${h(s.name)}" maxlength="60"></div>
        <div class="sb-sec"><span class="sb-lbl">Background</span>
          <p class="sb-help">Or drag one from the left onto the canvas.</p>
          <div class="sb-bgs"><button class="sb-bg none ${!stageImage ? 'sel' : ''}" data-bg="">None</button>
          ${BGS.map(b => `<button class="sb-bg ${stageImage === b.src ? 'sel' : ''}" data-bg="${b.src}" style="background-image:url('${b.src}')" title="${h(b.name)}"><span>${h(b.name)}</span></button>`).join('')}</div>
          <div id="sbStageColor" style="margin-top:12px">${colorFieldHTML('stage', 'Canvas color', stageColor, false)}</div>
        </div>
        <div class="sb-sec"><span class="sb-lbl">Ending</span>
          <div class="sb-row"><div>This scene ends the story<small>${s.choices.length ? 'Remove its choices to make it an ending' : 'Students see the ending screen here'}</small></div>
            <label class="sb-sw"><input type="checkbox" id="sbEnd" ${s.ending ? 'checked' : ''} ${s.choices.length ? 'disabled' : ''} aria-label="This scene ends the story"><i></i></label></div>
          ${s.ending && !s.choices.length ? `<input class="sb-in" id="sbEndTitle" style="margin-top:10px" placeholder="Ending name, e.g. “The Good Ending”" value="${h(s.endingTitle)}">` : ''}
        </div>
        <div class="sb-sec"><span class="sb-lbl">Arrange</span>
          ${i === 0 ? `<div class="sb-callout info">${ICON.info}<span>This is the <b>start scene</b> — the story begins here.</span></div>` : ''}
          <div class="sb-actions">
            <button class="sb-mini" data-a="up" ${i === 0 ? 'disabled' : ''}>${ICON.left}Move left</button>
            <button class="sb-mini" data-a="down" ${i === story.scenes.length - 1 ? 'disabled' : ''}>${ICON.right}Move right</button>
            <button class="sb-mini" data-a="dup" title="Add a copy right after this scene and continue the story into it">${ICON.copy}Duplicate</button>
            <button class="sb-mini danger" data-a="del">${ICON.trash}Delete</button>
          </div>
          <p class="sb-help" style="margin:8px 0 0">Duplicate adds a copy right after this scene. This scene then continues into the copy, and the copy takes over ${s.choices.length ? 'its choices' : s.ending ? 'the ending' : 'whatever comes next'} — handy for continuing the same setting.</p></div>`;
    }
    else if(tab === 'dialogue'){
      const sp = speakersOnCanvas();
      const opts = who => `<option value="n" ${who === 'n' ? 'selected' : ''}>Narrator</option>` +
        [...new Set([...sp, ...(who !== 'n' && !sp.includes(who) ? [who] : [])])].map(c => `<option value="${c}" ${c === who ? 'selected' : ''}>${h(charName(c))}${sp.includes(c) ? '' : ' (not on canvas)'}</option>`).join('');
      body = `
        <div class="sb-sec"><span class="sb-lbl">Lines</span>
          <p class="sb-help">Lines play in order in the dialogue box. ${sp.length ? 'Speakers are the characters on the canvas.' : 'Drag characters onto the canvas to give them lines.'}</p>
          ${s.lines.map((l, k) => `<div class="sb-item ${k === lineIdx ? 'focus' : ''}" data-k="${k}">
            <div class="sb-item-top"><span class="sb-num">${k + 1}</span>
              <select class="sb-sel sm sb-grow" data-who aria-label="Speaker">${opts(l.who)}</select>
              <button class="sb-icon" data-mv="-1" ${k === 0 ? 'disabled' : ''} aria-label="Move line up">${ICON.up}</button>
              <button class="sb-icon" data-mv="1" ${k === s.lines.length - 1 ? 'disabled' : ''} aria-label="Move line down">${ICON.down}</button>
              <button class="sb-icon" data-rm aria-label="Delete line">${ICON.x}</button></div>
            <textarea class="sb-ta" data-text placeholder="${l.who === 'n' ? 'Describe what happens…' : 'What do they say?'}">${h(l.text)}</textarea>
          </div>`).join('')}
          <button class="sb-add" id="sbAddLine">+ Add line</button></div>`;
    }
    else {
      const q = s.quiz;
      body = `
        ${!s.choices.length ? `<div class="sb-sec"><span class="sb-lbl">What happens next?</span>
          ${s.ending ? `<div class="sb-callout info">${ICON.flag}<span>This scene is an <b>ending</b>. Turn that off in the Scene tab to continue the story.</span></div>` :
          `<p class="sb-help">With no choices, the story continues straight to another scene.</p><select class="sb-sel" id="sbNext" aria-label="Continue to">${sceneOptions(s.next, s.id)}</select>`}
        </div>` : ''}
        <div class="sb-sec"><span class="sb-lbl">Choices (paths)</span>
          <p class="sb-help">Each choice is a path to another scene. Drag a <b>Choice pill</b> onto the canvas or add one here.</p>
          ${s.choices.length ? `
            <label for="sbPrompt" style="display:block;font-size:12px;font-weight:600;color:var(--text-dim);margin-bottom:6px">Question shown to students</label>
            <input class="sb-in" id="sbPrompt" placeholder="What do you do?" value="${h(s.prompt)}" style="margin-bottom:12px">
            <div class="sb-quiz ${q.on ? 'on' : ''}">
              <div class="sb-row"><div style="font-weight:600">Grade as quiz question<small>Mark the correct answer and add feedback</small></div>
                <label class="sb-sw"><input type="checkbox" id="sbQuiz" ${q.on ? 'checked' : ''} aria-label="Grade as quiz question"><i></i></label></div>
              <div class="sb-quiz-extra"><span>Points for correct answer</span><select class="sb-sel sm" id="sbPts" style="width:auto">${[5, 10, 20].map(p => `<option ${p === q.points ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
            </div>` : ''}
          <div class="${q.on ? 'quiz' : ''}">${s.choices.map((c, k) => `
            <div class="sb-item ${q.on && q.correctId === c.id ? 'ok' : ''}" data-k="${k}">
              <div class="sb-item-top"><span class="sb-num">Path ${String.fromCharCode(65 + k)}</span>
                <label class="sb-correct"><input type="radio" name="sbCorrect" ${q.correctId === c.id ? 'checked' : ''}>Correct</label>
                <button class="sb-icon" data-rm aria-label="Delete choice" ${q.on ? '' : 'style="margin-left:auto"'}>${ICON.x}</button></div>
              <input class="sb-in sm" data-text placeholder="Choice text, e.g. “Open the door”" value="${h(c.text)}">
              <input class="sb-in sm sb-fb" data-fb placeholder="${q.correctId === c.id ? 'Feedback if correct (optional)' : 'Feedback if wrong (optional)'}" value="${h(c.fb || '')}">
              <div class="sb-link">${ICON.arrow}<span>Leads to</span></div>
              <select class="sb-sel sm" data-to aria-label="Leads to" style="margin-top:4px">${sceneOptions(c.to, s.id)}</select>
              ${byId(c.to) ? `<button class="sb-mini" data-open style="margin-top:6px;width:100%;padding:6px">Go to “${h(byId(c.to).name)}” ${ICON.arrow}</button>` : ''}
            </div>`).join('')}</div>
          <button class="sb-add" id="sbAddChoice" ${s.choices.length >= MAX_CHOICES ? 'disabled' : ''}>+ Add choice</button>
        </div>`;
    }
    inspBody.innerHTML = tabsHTML(s) + body;
    $$('.sb-tab', inspBody).forEach(b => b.addEventListener('click', () => { tab = b.dataset.t; renderSceneInspector(); }));
    wireSceneInspector(s);
  }

  function wireSceneInspector(s){
    if(tab === 'scene'){
      $('#sbName').addEventListener('input', e => { s.name = e.target.value || 'Untitled scene'; crumb.textContent = s.name; persist(); renderStrip(); renderPillsEverywhere(); if(view === 'map') renderMap(); });
      $$('.sb-bg', inspBody).forEach(b => b.addEventListener('click', () => { stageImage = b.dataset.bg; paintStage(); markDirty(); renderSceneInspector(); renderTip(); }));
      wireColorFields($('#sbStageColor'), (k, v) => { stageColor = v || '#f7f8fa'; paintStage(); markDirty(); });
      $('#sbEnd').addEventListener('change', e => { s.ending = e.target.checked; if(s.ending) s.next = null; changed({ inspector:true }); });
      const et = $('#sbEndTitle'); if(et) et.addEventListener('input', e => { s.endingTitle = e.target.value; persist(); renderStrip(); });
      $$('[data-a]', inspBody).forEach(b => b.addEventListener('click', () => {
        const a = b.dataset.a;
        if(a === 'up') moveScene(s.id, -1); if(a === 'down') moveScene(s.id, 1);
        if(a === 'dup') duplicateScene(s.id); if(a === 'del') deleteScene(s.id);
      }));
    }
    else if(tab === 'dialogue'){
      $$('.sb-item', inspBody).forEach(it => {
        const k = +it.dataset.k, l = s.lines[k];
        it.addEventListener('focusin', () => { if(lineIdx !== k){ lineIdx = k; $$('.sb-item', inspBody).forEach(x => x.classList.toggle('focus', x === it)); renderBox(); } });
        $('[data-who]', it).addEventListener('change', e => { l.who = e.target.value === 'n' ? 'n' : +e.target.value; lineIdx = k; renderBox(); persist(); });
        $('[data-text]', it).addEventListener('input', e => { l.text = e.target.value; lineIdx = k; renderBox(); persist(); });
        $('[data-rm]', it).addEventListener('click', () => { s.lines.splice(k, 1); lineIdx = Math.max(0, Math.min(lineIdx, s.lines.length - 1)); renderBox(); changed({ inspector:true }); });
        $$('[data-mv]', it).forEach(b => b.addEventListener('click', () => { const j = k + +b.dataset.mv; [s.lines[k], s.lines[j]] = [s.lines[j], s.lines[k]]; lineIdx = j; renderBox(); changed({ inspector:true }); }));
      });
      $('#sbAddLine').addEventListener('click', () => {
        const sp = speakersOnCanvas(), last = s.lines[s.lines.length - 1];
        let who = sp.length ? sp[0] : 'n';
        if(last && last.who !== 'n' && sp.length > 1){ who = sp[(sp.indexOf(last.who) + 1) % sp.length]; }
        s.lines.push({ who, text:'' }); lineIdx = s.lines.length - 1;
        ensureBox(); renderBox(); changed({ inspector:true });
        const tas = $$('[data-text]', inspBody); if(tas.length) tas[tas.length - 1].focus();
      });
    }
    else {
      const nx = $('#sbNext');
      if(nx) nx.addEventListener('change', e => linkTo(id => { s.next = id; changed({ inspector:true }); }, e.target.value));
      const pr = $('#sbPrompt'); if(pr) pr.addEventListener('input', e => { s.prompt = e.target.value; persist(); });
      const qz = $('#sbQuiz'); if(qz) qz.addEventListener('change', e => { s.quiz.on = e.target.checked; if(!s.quiz.correctId && s.choices[0]) s.quiz.correctId = s.choices[0].id; changed({ inspector:true }); });
      const pt = $('#sbPts'); if(pt) pt.addEventListener('change', e => { s.quiz.points = +e.target.value; persist(); });
      $$('.sb-item', inspBody).forEach(it => {
        const c = s.choices[+it.dataset.k];
        $('[data-text]', it).addEventListener('input', e => { c.text = e.target.value; renderPills(); persist(); });
        $('[data-fb]', it).addEventListener('input', e => { c.fb = e.target.value; persist(); });
        $('[data-rm]', it).addEventListener('click', () => { removeChoice(s, c.id); changed({ inspector:true }); });
        $('input[type=radio]', it).addEventListener('change', () => { s.quiz.correctId = c.id; changed({ inspector:true }); });
        $('[data-to]', it).addEventListener('change', e => linkTo(id => { c.to = id; changed({ inspector:true }); }, e.target.value, c.text));
        const op = $('[data-open]', it); if(op) op.addEventListener('click', () => switchScene(c.to));
      });
      $('#sbAddChoice').addEventListener('click', () => {
        const c = { id:uid('c'), text:'', to:null, fb:'' };
        s.choices.push(c); s.ending = false; s.next = null;
        if(!s.quiz.correctId) s.quiz.correctId = c.id;
        const k = s.choices.length - 1;
        addPill(c, STAGE_W - 130, 40 + k * 52);
        deselect();                                       // back to the Choices tab
        changed({ inspector:true });
        const ins = $$('[data-text]', inspBody); if(ins.length) ins[ins.length - 1].focus();
      });
    }
  }
  function removeChoice(s, id){
    s.choices = s.choices.filter(c => c.id !== id);
    $$('.p-choice', stage).filter(p => p.dataset.choiceId === id).forEach(p => { p.remove(); placedCount--; });
    updateEmptyState();
    if(s.quiz.correctId === id) s.quiz.correctId = s.choices[0] ? s.choices[0].id : null;
    if(!s.choices.length) s.quiz.on = false;
    snapshot();
  }
  function renderPillsEverywhere(){ renderPills(); }

  /* ------------------------------------------------------------------ inspector: dialogue box & choice pill */
  function enhanceBoxInspector(el){
    const s = cur(); if(!s) return;
    const sec = $('#fSpeaker') && $('#fSpeaker').closest('.insp-section');
    const sp = speakersOnCanvas();
    const l = s.lines[lineIdx];
    const html = `<div class="insp-section"><label class="insp-label">Dialogue line</label>
      ${s.lines.length ? `<div class="sb-linenav"><button class="sb-icon" id="sbPrevL" ${lineIdx === 0 ? 'disabled' : ''} aria-label="Previous line">${ICON.left}</button>
        <span class="sb-grow">Line ${lineIdx + 1} of ${s.lines.length}</span>
        <button class="sb-icon" id="sbNextL" ${lineIdx >= s.lines.length - 1 ? 'disabled' : ''} aria-label="Next line">${ICON.right}</button></div>` : `<p class="sb-help">Type in the box on the canvas to write the first line.</p>`}
      ${l ? `<select class="sb-sel" id="sbBoxWho" aria-label="Speaker" style="margin-bottom:8px"><option value="n" ${l.who === 'n' ? 'selected' : ''}>Narrator</option>${[...new Set([...sp, ...(l.who !== 'n' && !sp.includes(l.who) ? [l.who] : [])])].map(c => `<option value="${c}" ${c === l.who ? 'selected' : ''}>${h(charName(c))}</option>`).join('')}</select>` : ''}
      <div class="sb-actions"><button class="sb-mini" id="sbBoxAdd">+ Add line</button><button class="sb-mini danger" id="sbBoxDel" ${l ? '' : 'disabled'}>${ICON.trash}Delete line</button></div>
    </div>`;
    if(sec) sec.outerHTML = html;
    const go = d => { lineIdx = Math.max(0, Math.min(s.lines.length - 1, lineIdx + d)); renderBox(); renderInspector(el); };
    const p = $('#sbPrevL'), n = $('#sbNextL');
    if(p) p.addEventListener('click', () => go(-1)); if(n) n.addEventListener('click', () => go(1));
    const who = $('#sbBoxWho'); if(who) who.addEventListener('change', e => { l.who = e.target.value === 'n' ? 'n' : +e.target.value; renderBox(); persist(); });
    $('#sbBoxAdd').addEventListener('click', () => {
      const last = s.lines[s.lines.length - 1]; let w = sp.length ? sp[0] : 'n';
      if(last && last.who !== 'n' && sp.length > 1) w = sp[(sp.indexOf(last.who) + 1) % sp.length];
      s.lines.push({ who:w, text:'' }); lineIdx = s.lines.length - 1; renderBox(); persist(); renderInspector(el);
      startEditing(el, el.querySelector('.txt'));
    });
    $('#sbBoxDel').addEventListener('click', () => { s.lines.splice(lineIdx, 1); lineIdx = Math.max(0, lineIdx - 1); renderBox(); persist(); renderInspector(el); });
    // the "Line" textarea from the canvas engine edits the box text; keep it in sync with the model
    const ta = $('#fTxt'); if(ta){ ta.placeholder = BOX_PH; ta.addEventListener('input', () => { syncFromCanvas(); persist(); }); }
  }

  function enhancePillInspector(el){
    const s = cur(); if(!s) return;
    const c = s.choices.find(x => x.id === el.dataset.choiceId); if(!c) return;
    const k = s.choices.indexOf(c);
    const html = `<div class="insp-section"><label class="insp-label">Path ${String.fromCharCode(65 + k)} — leads to</label>
      <select class="sb-sel" id="sbPillTo" aria-label="Leads to">${sceneOptions(c.to, s.id)}</select>
      ${byId(c.to) ? `<button class="sb-mini" id="sbPillGo" style="margin-top:6px;width:100%">Go to “${h(byId(c.to).name)}” ${ICON.arrow}</button>` : `<p class="sb-help" style="margin:6px 0 0">Pick a scene, or create a new one for this path.</p>`}
      ${s.quiz.on ? `<div class="sb-row" style="margin-top:12px"><div>Correct answer<small>Students earn ${s.quiz.points} pts for this choice</small></div>
        <label class="sb-sw"><input type="checkbox" id="sbPillOk" ${s.quiz.correctId === c.id ? 'checked' : ''} aria-label="Correct answer"><i></i></label></div>
        <input class="sb-in sm" id="sbPillFb" style="margin-top:8px" placeholder="Feedback when chosen (optional)" value="${h(c.fb || '')}">` : ''}
    </div>`;
    const first = $('.insp-section', inspBody);
    if(first) first.insertAdjacentHTML('beforebegin', html);
    $('#sbPillTo').addEventListener('change', e => linkTo(id => { c.to = id; changed(); renderInspector(el); }, e.target.value, c.text));
    const go = $('#sbPillGo'); if(go) go.addEventListener('click', () => switchScene(c.to));
    const ok = $('#sbPillOk'); if(ok) ok.addEventListener('change', e => { if(e.target.checked) s.quiz.correctId = c.id; changed(); });
    const fb = $('#sbPillFb'); if(fb) fb.addEventListener('input', e => { c.fb = e.target.value; persist(); });
  }

  /* ------------------------------------------------------------------ palette labels */
  const dlgCard = $('.el-card[data-type="dialogue"] span'), chCard = $('.el-card[data-type="choice"] span');
  if(dlgCard) dlgCard.textContent = 'Dialogue box';
  if(chCard) chCard.textContent = 'Choice / path';

  /* ------------------------------------------------------------------ compile → play.html */
  function compile(){
    snapshot();
    const title = (($('.story-name') || {}).textContent || 'Untitled Project').trim();
    const steps = [];
    story.scenes.forEach(s => {
      const L = s.layout || { els:[] };
      const els = L.els.filter(e => !/\bp-(dialogue|choice)\b/.test(e.cls)).map(e => ({
        cls: e.cls, left: e.left, top: e.top, key: e.data && e.data.charIndex !== undefined ? 'c' + e.data.charIndex : null,
        shell: e.shell.replace(/\scontenteditable="[^"]*"/g, '').replace(/\sspellcheck="[^"]*"/g, ''),
      }));
      const boxSpec = L.els.find(e => /\bp-dialogue\b/.test(e.cls));
      const d = boxSpec ? boxSpec.data : {};
      const ui = boxSpec ? { bg: d.cBg || '#ffffff', text: d.cText || '#03114c', chip: d.cChip || '#03114c', chipText: d.cChipText || '#ffffff', style: d.boxStyle || 'classic' } : null;
      // a stretched dialogue box keeps its proportions in the player (width as a share of the 640px canvas)
      if(ui && d.bw && d.bh){ const k = parseFloat(d.size) || 1; ui.boxW = d.bw * k / STAGE_W; ui.boxAspect = d.bh / d.bw; }
      const head = { id: s.id, layout: { w: STAGE_W, h: STAGE_H, color: L.color || '#f7f8fa', image: L.image || '', els }, ui };
      const sc = s.lines.filter(l => l.text.trim()).map(l => ({ type:'line', who: l.who === 'n' ? 'Narrator' : 'c' + l.who, name: l.who === 'n' ? '' : charName(l.who), text: l.text }));
      if(s.choices.length){
        const opt = (c, k) => ({ text: c.text || `Choice ${k + 1}`, next: byId(c.to) ? c.to : '__end' });
        sc.push(s.quiz.on
          ? { type:'quiz', question: s.prompt || 'What do you do?', points: s.quiz.points, right:'Correct!', wrong:'Not quite.',
              options: s.choices.map((c, k) => ({ ...opt(c, k), correct: c.id === s.quiz.correctId, fb: c.fb || '' })) }
          : { type:'choice', prompt: s.prompt || 'What do you do?', options: s.choices.map(opt) });
      } else if(s.ending) sc.push({ type:'end', title: s.endingTitle || 'The End' });
      else if(byId(s.next)){ if(sc.length) sc[sc.length - 1].next = s.next; else sc.push({ type:'goto', next: s.next }); }
      else sc.push({ type:'end', title:'To be continued…' });
      Object.assign(sc[0], head);
      steps.push(...sc);
    });
    steps.push({ id:'__end', type:'end', title:'The End' });
    return { title, subtitle: `${story.scenes.length} scene${story.scenes.length === 1 ? '' : 's'} · made with Plotter`, steps };
  }
  window.plotterPreviewUrl = function(){
    try { localStorage.setItem(PLAY_KEY, JSON.stringify(compile())); } catch(e){ return 'play.html'; }
    return 'play.html?story=local';
  };

  /* ------------------------------------------------------------------ boot */
  // "Use template" (Templates page / Marketplace) opens blank_workspace.html?template=<slug>
  let loadedTpl = null;
  const tplKey = new URLSearchParams(location.search).get('template');
  if(tplKey){
    const tpl = window.PlotterTemplates && PlotterTemplates.get(tplKey);
    if(tpl){
      const hasWork = (story.scenes || []).some(s => s.lines.some(l => l.text.trim()) || s.choices.length || (s.layout && s.layout.els.length));
      if(!hasWork || confirm(`Start from the “${tpl.title}” template?\n\nThis replaces the story that's currently open in your workspace.`)){
        story = PlotterTemplates.toBuilder(tpl); persist(); loadedTpl = tpl;
      }
    }
    history.replaceState(null, '', location.pathname);   // a reload keeps your edits instead of re-applying the template
  }
  if(!story.scenes || !story.scenes.length){
    story = { scenes:[newScene('Scene 1')] };
    // keep anything already on the canvas as the first scene
    story.scenes[0].layout = { color: stageColor, image: stageImage, els: $$('.placed', stage).map(serialize) };
  }
  curId = null;
  switchScene(story.scenes[0].id);
  if(typeof openInspector === 'function') openInspector();
  const st = $('#saveStatus'); if(st){ st.classList.add('saved'); st.innerHTML = '<span class="dot"></span>Saved'; }

  // The story title lives with the story, so it survives reloads and comes from templates.
  const nameEl = $('.story-name');
  if(nameEl){
    if(story.title) nameEl.textContent = story.title;
    nameEl.addEventListener('input', () => { story.title = nameEl.textContent.trim(); persist(); });
    nameEl.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); nameEl.blur(); } });
  }
  if(loadedTpl) toast(`“${loadedTpl.title}” loaded — ${story.scenes.length} starter scenes with a choice and a quiz. Edit anything.`, 4200);

  /* ------------------------------------------------------------------ undo / redo
     Every save (persist) records the whole story. Quick bursts (typing, dragging)
     merge into one step. Undo/redo restores the story and the scene it happened in. */
  const H = { list:[], idx:-1, applying:false, last:0 };
  const undoBtn = $('#undoBtn'), redoBtn = $('#redoBtn');
  function syncUndoBtns(){
    if(undoBtn){ undoBtn.disabled = H.idx <= 0; undoBtn.title = 'Undo (Ctrl+Z)'; }
    if(redoBtn){ redoBtn.disabled = H.idx >= H.list.length - 1; redoBtn.title = 'Redo (Ctrl+Y)'; }
  }
  function record(){
    if(H.applying) return;
    const json = JSON.stringify(story);
    if(H.idx >= 0 && H.list[H.idx].json === json) return;
    const now = Date.now();
    H.list.length = H.idx + 1;                                  // a new change drops the redo branch
    if(H.idx > 0 && now - H.last < 600) H.list[H.idx] = { json, cur:curId };
    else { H.list.push({ json, cur:curId }); if(H.list.length > 100) H.list.shift(); H.idx = H.list.length - 1; }
    H.last = now;
    syncUndoBtns();
  }
  function flush(){ clearTimeout(saveT); syncFromCanvas(); snapshot(); persist(); }
  function applyHist(entry){
    H.applying = true; H.last = 0;
    if(typeof deselect === 'function') deselect();
    story = JSON.parse(entry.json);
    const id = byId(entry.cur) ? entry.cur : byId(curId) ? curId : story.scenes[0].id;
    curId = null; switchScene(id);
    if(nameEl) nameEl.textContent = story.title || 'Untitled Project';
    refreshCounts(); if(view === 'map') renderMap();
    H.applying = false; syncUndoBtns();
  }
  function undo(){ flush(); if(H.idx > 0){ H.idx--; applyHist(H.list[H.idx]); toast('Undone'); } else toast('Nothing to undo'); }
  function redo(){ flush(); if(H.idx < H.list.length - 1){ H.idx++; applyHist(H.list[H.idx]); toast('Redone'); } else toast('Nothing to redo'); }
  onPersist = record;
  record();                                                     // the starting point
  if(undoBtn) undoBtn.addEventListener('click', undo);
  if(redoBtn) redoBtn.addEventListener('click', redo);

  /* ------------------------------------------------------------------ copy / cut / paste
     Works across scenes. The dialogue box isn't copied (one per scene). */
  let clip = null;
  const DEL_BTN = `<div class="placed-del" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6 6 18M6 6l12 12"/></svg></div>`;
  function copySel(cut){
    if(!selectedEl || view !== 'canvas') return false;
    if(selectedEl.classList.contains('p-dialogue')){ toast('Each scene has one dialogue box — add more lines in the Dialogue tab instead.'); return true; }
    clip = JSON.parse(JSON.stringify(serialize(selectedEl)));
    if(cut){ selectedEl.querySelector('.placed-del').click(); toast('Cut — press Ctrl+V to paste (works in other scenes too)'); }
    else toast('Copied — press Ctrl+V to paste (works in other scenes too)');
    return true;
  }
  function paste(){
    if(view !== 'canvas') return;
    if(!clip){ toast('Nothing copied yet — select something and press Ctrl+C'); return; }
    if(/\bp-choice\b/.test(clip.cls) && cur() && cur().choices.length >= MAX_CHOICES){ toast(`A scene can have up to ${MAX_CHOICES} choices`); return; }
    clip.left += 20; clip.top += 20;                            // each paste lands a little further along
    const el = document.createElement('div');
    el.className = clip.cls;
    Object.entries(clip.data || {}).forEach(([k, v]) => el.dataset[k] = v);
    el.dataset.id = uid('el');
    el.style.left = clip.left + 'px'; el.style.top = clip.top + 'px';
    el.innerHTML = DEL_BTN + clip.shell;
    el.querySelectorAll('[contenteditable]').forEach(ed => ed.contentEditable = 'false');
    ensureHandle(el); stage.appendChild(el); wirePlaced(el);
    placedCount++; updateEmptyState();
    selectPlaced(el); markDirty();
  }

  /* ------------------------------------------------------------------ shortcuts panel (press ?) */
  const MAC = /Mac|iPhone|iPad/.test(navigator.platform);
  const K = s => s.split(' ').map(k => `<kbd>${k === 'Ctrl' && MAC ? '⌘' : k}</kbd>`).join('');
  const KEYS = [
    ['General', [['Undo', 'Ctrl Z'], ['Redo', 'Ctrl Y'], ['Save (also automatic)', 'Ctrl S'], ['Preview the story', 'Ctrl Enter'], ['Canvas ⇄ Story map', 'M'], ['Previous / next scene', 'PgUp PgDn'], ['Show this list', '?']]],
    ['Selected element', [['Copy', 'Ctrl C'], ['Cut', 'Ctrl X'], ['Paste', 'Ctrl V'], ['Duplicate', 'Ctrl D'], ['Delete', 'Del'], ['Edit text', 'Enter'], ['Deselect', 'Esc'], ['Nudge 1px (Shift = 10px)', '← ↑ → ↓'], ['Layer down / up', '[ ]'], ['To back / front', 'Ctrl [ ]']]],
    ['Canvas', [['Zoom in / out', 'Ctrl + −'], ['Fit to screen', 'Ctrl 0'], ['Actual size (100%)', 'Ctrl 1'], ['Pan', 'Space drag'], ['Show grid', 'G'], ['Snap to grid', 'S']]],
    ['Story map', [['Move around', 'drag'], ['Zoom', 'Ctrl wheel'], ['Zoom in / out', '+ −'], ['Fit whole story', '0']]],
  ];
  const keysBg = document.createElement('div');
  keysBg.className = 'sb-keys-bg';
  keysBg.innerHTML = `<div class="sb-keys" role="dialog" aria-modal="true" aria-labelledby="sbKeysTitle">
      <button class="sb-keys-x" type="button" aria-label="Close">×</button>
      <h3 id="sbKeysTitle">Keyboard shortcuts</h3>
      <div class="sub">Shortcuts pause while you're typing in a text box.${MAC ? ' ⌘ = Command.' : ''}</div>
      <div class="sb-keys-grid">${KEYS.map(([g, rows]) => `<div><h4>${g}</h4>${rows.map(([l, k]) => `<div class="sb-keys-row"><span>${l}</span><span>${K(k)}</span></div>`).join('')}</div>`).join('')}</div>
    </div>`;
  document.body.appendChild(keysBg);
  const showKeys = on => keysBg.classList.toggle('show', on);
  keysBg.addEventListener('click', e => { if(e.target === keysBg || e.target.closest('.sb-keys-x')) showKeys(false); });
  const actions = $('.wtop-actions');
  if(actions){
    const kb = document.createElement('button');
    kb.className = 'icon-btn'; kb.type = 'button'; kb.title = 'Keyboard shortcuts (?)'; kb.setAttribute('aria-label', 'Keyboard shortcuts');
    kb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>';
    kb.addEventListener('click', () => showKeys(true));
    actions.insertBefore(kb, actions.firstChild);
  }

  /* ------------------------------------------------------------------ keyboard */
  document.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if(keysBg.classList.contains('show')){ if(e.key === 'Escape' || e.key === '?'){ e.preventDefault(); showKeys(false); } return; }
    if(mod && k === 's'){ e.preventDefault(); flush(); toast('Saved — Plotter also saves automatically'); return; }
    const typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]');
    if(typing) return;                                           // let text boxes keep their own Ctrl+Z / C / V
    if(mod && k === 'z' && !e.shiftKey){ e.preventDefault(); undo(); return; }
    if(mod && (k === 'y' || (k === 'z' && e.shiftKey))){ e.preventDefault(); redo(); return; }
    if(mod && k === 'c'){ if(copySel(false)) e.preventDefault(); return; }
    if(mod && k === 'x'){ if(copySel(true)) e.preventDefault(); return; }
    if(mod && k === 'v'){ e.preventDefault(); paste(); return; }
    if(mod && e.key === 'Enter'){ e.preventDefault(); window.open(window.plotterPreviewUrl(), '_blank'); return; }
    if(mod || e.altKey) return;
    if(e.key === '?'){ e.preventDefault(); showKeys(true); return; }
    if(k === 'm'){ setView(view === 'map' ? 'canvas' : 'map'); return; }
    if(e.key === 'PageDown' || e.key === 'PageUp'){
      e.preventDefault();
      const i = idx(curId) + (e.key === 'PageDown' ? 1 : -1);
      if(story.scenes[i]){ switchScene(story.scenes[i].id); toast(`Scene ${i + 1} of ${story.scenes.length}: ${story.scenes[i].name}`); }
    }
  });
})();
