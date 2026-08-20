(() => {
  // Internal runtime tools. Intentionally not linked from the player UI.
  const $ = id => document.getElementById(id);
  const seq = [38,38,40,40,37,39,37,39,66,65];
  let pos = 0;
  let panel = null;
  let timer = null;

  function startVisible(){
    const start=$('start');
    return Boolean(start && !start.classList.contains('hidden'));
  }

  function currentItem(){
    const quote=$('quote');
    const tagged=quote?.dataset?.scenarioId || '';
    const items=[...(window.RED_FLAG_DATA||[]),...(window.RED_FLAG_EVENTS||[])];
    if(tagged) return items.find(x=>x.id===tagged)||null;
    const text=String(quote?.textContent||'').trim();
    return items.find(x=>String(x.quote||'').trim()===text)||null;
  }

  function snapshot(){
    const item=currentItem();
    const audio=window.RED_FLAG_AUDIO;
    const cal=window.RED_FLAG_DECK_CALIBRATION||{};
    const totals=window.RED_FLAG_CATALOG_TOTALS||{};
    const report=window.RED_FLAG_CONTENT_REPORT||{};
    return {
      build: document.querySelector('.foot span:last-child')?.textContent||'',
      round: $('count')?.textContent||'--',
      card: item?.id||'--',
      type: item?.type||'--',
      audio: audio?.mode||'OFF',
      audioEnabled: audio?.enabled!==false,
      calibration: cal.requestedMinimum ? `${cal.guaranteedMinimum||0}/${cal.requestedMinimum}` : '--',
      catalog: `${totals.characters||'?'} CHAR / ${totals.events||'?'} EVENT / ${totals.rare||'?'} RARE`,
      invalid: Array.isArray(report.invalidIds)?report.invalidIds.length:'?'
    };
  }

  function renderStatus(){
    if(!panel) return;
    const s=snapshot();
    const out=panel.querySelector('[data-dev-status]');
    if(out) out.innerHTML=`<b>${s.build}</b><br>ROUND ${s.round}<br>CARD ${s.card} // ${s.type}<br>AUDIO ${s.audio}${s.audioEnabled?'':' // MUTED'}<br>CALIBRATION ${s.calibration}<br>CATALOG ${s.catalog}<br>INVALID CONTENT ${s.invalid}`;
  }

  function makePanel(){
    if(panel) return panel;
    const style=document.createElement('style');
    style.id='rfdInternalToolsStyle';
    style.textContent=`.rfd-it{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.82);display:grid;place-items:center;padding:18px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.rfd-it-box{width:min(620px,94vw);max-height:88vh;overflow:auto;background:#080c0f;border:1px solid #53626b;box-shadow:0 20px 80px #000;padding:18px;color:#c9d3d2}.rfd-it-head{display:flex;justify-content:space-between;gap:12px;align-items:center;border-bottom:1px solid #29353b;padding-bottom:12px;margin-bottom:14px}.rfd-it-title{font-size:12px;letter-spacing:.12em;color:#d2b06d}.rfd-it-x,.rfd-it button{border:1px solid #35434a;background:#0d1418;color:#9fc7c6;padding:8px 10px;font:700 10px monospace;cursor:pointer}.rfd-it-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.rfd-it-card{border:1px solid #273239;padding:12px;background:#0a0f12}.rfd-it-card h3{font-size:9px;color:#70888b;letter-spacing:.1em;margin:0 0 9px}.rfd-it-status{font-size:10px;line-height:1.8;word-break:break-word}.rfd-it-actions{display:flex;flex-wrap:wrap;gap:7px}.rfd-it-note{font-size:9px;line-height:1.6;color:#788584;margin-top:12px}.rfd-it input[type=range]{width:100%}@media(max-width:560px){.rfd-it-grid{grid-template-columns:1fr}}`;
    document.head.appendChild(style);

    panel=document.createElement('div');
    panel.className='rfd-it';
    panel.setAttribute('role','dialog');
    panel.innerHTML=`<div class="rfd-it-box"><div class="rfd-it-head"><div class="rfd-it-title">RUNTIME TUNING</div><button class="rfd-it-x" data-dev-close>×</button></div><div class="rfd-it-grid"><section class="rfd-it-card"><h3>LIVE STATUS</h3><div class="rfd-it-status" data-dev-status></div><div class="rfd-it-actions" style="margin-top:10px"><button data-dev-refresh>REFRESH</button></div></section><section class="rfd-it-card"><h3>AUDIO</h3><div class="rfd-it-actions"><button data-dev-sound>TOGGLE SOUND</button><button data-dev-silence>SILENCE</button></div><div class="rfd-it-note">Current engine values are shown in LIVE STATUS. Player-facing start/result screens remain silent.</div></section><section class="rfd-it-card"><h3>LOCAL TEST DATA</h3><div class="rfd-it-actions"><button data-dev-onboarding>RESET ONBOARDING</button><button data-dev-dex>CLEAR DEX</button></div></section><section class="rfd-it-card"><h3>REPORTS</h3><div class="rfd-it-actions"><button data-dev-copy>COPY SNAPSHOT</button><button data-dev-console>LOG REPORTS</button></div></section></div><div class="rfd-it-note">ESC closes this panel. This interface is not part of the player UI.</div></div>`;
    document.body.appendChild(panel);

    panel.querySelector('[data-dev-close]').onclick=closePanel;
    panel.querySelector('[data-dev-refresh]').onclick=renderStatus;
    panel.querySelector('[data-dev-sound]').onclick=()=>{const a=window.RED_FLAG_AUDIO;if(a?.setEnabled)a.setEnabled(!a.enabled);setTimeout(renderStatus,80);};
    panel.querySelector('[data-dev-silence]').onclick=()=>{window.RED_FLAG_AUDIO?.silence?.();setTimeout(renderStatus,80);};
    panel.querySelector('[data-dev-onboarding]').onclick=()=>{try{localStorage.removeItem('rfd-onboarding-v1');}catch{} renderStatus();};
    panel.querySelector('[data-dev-dex]').onclick=()=>{if(!confirm('Clear DETECTED FILES on this browser?'))return;try{localStorage.removeItem('rfd-dex');}catch{} window.RED_FLAG_SYNC_DEX_TOTALS?.();renderStatus();};
    panel.querySelector('[data-dev-copy]').onclick=async()=>{const payload={snapshot:snapshot(),deck:window.RED_FLAG_DECK_CALIBRATION||null,density:window.RED_FLAG_SPECIAL_DENSITY||null,catalog:window.RED_FLAG_CATALOG_TOTALS||null,content:window.RED_FLAG_CONTENT_REPORT||null,audio:{mode:window.RED_FLAG_AUDIO?.mode||'',enabled:window.RED_FLAG_AUDIO?.enabled??null,level:window.RED_FLAG_AUDIO?.level??null}};try{await navigator.clipboard.writeText(JSON.stringify(payload,null,2));}catch{};};
    panel.querySelector('[data-dev-console]').onclick=()=>{console.group('[RFD INTERNAL]');console.log('snapshot',snapshot());console.log('deck',window.RED_FLAG_DECK_CALIBRATION);console.log('density',window.RED_FLAG_SPECIAL_DENSITY);console.log('catalog',window.RED_FLAG_CATALOG_TOTALS);console.log('content',window.RED_FLAG_CONTENT_REPORT);console.log('balance',window.RED_FLAG_BALANCE_REPORT);console.groupEnd();};
    panel.addEventListener('click',e=>{if(e.target===panel)closePanel();});
    return panel;
  }

  function openPanel(){
    makePanel();
    panel.style.display='grid';
    renderStatus();
    clearInterval(timer);
    timer=setInterval(renderStatus,1000);
  }

  function closePanel(){
    if(panel) panel.style.display='none';
    clearInterval(timer);timer=null;
  }

  window.addEventListener('keydown',e=>{
    if(panel&&panel.style.display!=='none'&&e.key==='Escape'){e.preventDefault();closePanel();return;}
    if(!startVisible()) return;
    const tag=String(e.target?.tagName||'').toLowerCase();
    if(tag==='input'||tag==='textarea'||e.target?.isContentEditable) return;
    const code=e.key.length===1 ? e.key.toUpperCase().charCodeAt(0) : ({ArrowUp:38,ArrowDown:40,ArrowLeft:37,ArrowRight:39}[e.key]||0);
    if(code===seq[pos]) pos+=1;
    else pos=code===seq[0]?1:0;
    if(pos===seq.length){pos=0;openPanel();}
  },true);
})();