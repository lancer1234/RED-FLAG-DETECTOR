(() => {
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'rfd-sound-enabled-v1';
  const LEVELS = { normal:0.62, wtf:0.70, danger:0.78 };
  const SOURCES = {
    normal:'assets/audio/normal.mp3',
    wtf:'assets/audio/wtf.mp3',
    danger:'assets/audio/danger.mp3'
  };

  let enabled = true;
  let unlocked = false;
  let mode = '';
  let syncQueued = false;
  let transitionToken = 0;
  let fadeTimer = null;
  let assetsAvailable = true;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) enabled = stored !== '0';
  } catch {}

  function normalizeEventDensity(){
    const data = window.RED_FLAG_DATA || [];
    const events = window.RED_FLAG_EVENTS || [];
    for(let i=data.length-1;i>=0;i--) if(data[i]?.kind === 'event') data.splice(i,1);
    const regular = events.filter(x => /^E\d+/i.test(String(x.id||'')));
    const wtf = events.filter(x => /^D\d+/i.test(String(x.id||'')) || /WTF/i.test(String(x.type||'')));
    const danger = events.filter(x => /^DG\d+/i.test(String(x.id||'')) || x.danger === true || /DANGER FILE/i.test(String(x.type||'')));
    const pick = (arr,n) => {
      const a=[...arr];
      for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
      return a.slice(0,n);
    };
    const pool=[...pick(regular,5),...pick(wtf,5),...pick(danger,5)];
    events.splice(0,events.length,...pool);
    window.RED_FLAG_SPECIAL_DENSITY={eventSlots:2,candidatePool:{regular:Math.min(5,regular.length),wtf:Math.min(5,wtf.length),danger:Math.min(5,danger.length)},promotedIntoNormalPool:0};
  }
  normalizeEventDensity();

  const tracks = Object.fromEntries(Object.entries(SOURCES).map(([name,src]) => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = name === 'normal' ? 'auto' : 'metadata';
    audio.volume = 0;
    audio.playsInline = true;
    audio.addEventListener('error', () => {
      assetsAvailable = false;
      silence(0);
      renderToggle();
      console.warn(`[RED FLAG DETECTOR] HQ audio asset missing: ${src}`);
    }, {once:true});
    return [name,audio];
  }));

  function activeGame(){
    const start=$('start'), end=$('end');
    if(start && !start.classList.contains('hidden')) return false;
    if(end && !end.classList.contains('hidden')) return false;
    return true;
  }

  function currentCardMode(){
    if(!activeGame()) return '';
    const role=String($('role')?.textContent||'');
    const badge=String($('eventBadge')?.textContent||'');
    if(/DANGER FILE/i.test(role)||/DANGER FILE/i.test(badge)) return 'danger';
    if(/WTF/i.test(role)||/WTF/i.test(badge)||/RARE FILE|BOSS|CASE FINALE/i.test(badge)) return 'wtf';
    return 'normal';
  }

  function stopFade(){
    if(fadeTimer){clearInterval(fadeTimer);fadeTimer=null;}
  }

  function pauseOthers(except=''){
    Object.entries(tracks).forEach(([name,audio]) => {
      if(name===except) return;
      audio.pause();
      audio.volume=0;
      try{audio.currentTime=0;}catch{}
    });
  }

  function silence(fade=.12){
    transitionToken++;
    mode='';
    stopFade();
    const playing = Object.values(tracks).filter(a=>!a.paused && a.volume>0);
    if(!playing.length){pauseOthers();return;}
    if(fade<=0){playing.forEach(a=>{a.pause();a.volume=0;});return;}
    const starts=playing.map(a=>[a,a.volume]);
    const started=performance.now();
    fadeTimer=setInterval(()=>{
      const p=Math.min(1,(performance.now()-started)/(fade*1000));
      starts.forEach(([a,v])=>a.volume=Math.max(0,v*(1-p)));
      if(p>=1){stopFade();starts.forEach(([a])=>{a.pause();a.volume=0;});}
    },24);
  }

  async function applyMode(next){
    if(!next){silence();return;}
    if(!enabled||!unlocked||!assetsAvailable) return;
    if(mode===next && !tracks[next].paused) return;

    const token=++transitionToken;
    stopFade();
    const incoming=tracks[next];
    const outgoing=mode ? tracks[mode] : null;
    mode=next;

    try{
      if(incoming.paused){
        incoming.volume=0;
        await incoming.play();
      }
    }catch{
      assetsAvailable=false;
      mode='';
      renderToggle();
      return;
    }
    if(token!==transitionToken) return;

    const target=LEVELS[next]||LEVELS.normal;
    const outStart=outgoing&&!outgoing.paused ? outgoing.volume : 0;
    const started=performance.now();
    fadeTimer=setInterval(()=>{
      if(token!==transitionToken){stopFade();return;}
      const p=Math.min(1,(performance.now()-started)/140);
      incoming.volume=target*p;
      if(outgoing && outgoing!==incoming) outgoing.volume=outStart*(1-p);
      if(p>=1){
        stopFade();
        pauseOthers(next);
        incoming.volume=target;
      }
    },20);
  }

  function queueSync(){
    if(syncQueued) return;
    syncQueued=true;
    requestAnimationFrame(()=>{
      syncQueued=false;
      applyMode(currentCardMode());
    });
  }

  async function unlock(){
    unlocked=true;
    if(!enabled||!assetsAvailable) return;
    Object.values(tracks).forEach(a=>{ try{a.load();}catch{} });
    queueSync();
  }

  function setEnabled(next){
    enabled=Boolean(next);
    try{localStorage.setItem(STORAGE_KEY,enabled?'1':'0');}catch{}
    renderToggle();
    if(enabled) unlock(); else silence(.10);
  }

  function renderToggle(){
    const btn=$('soundToggle');if(!btn)return;
    const active=enabled&&assetsAvailable;
    btn.textContent=active?'♪ SOUND ON':'♪ SOUND OFF';
    btn.setAttribute('aria-pressed',active?'true':'false');
    btn.classList.toggle('off',!active);
  }

  function installUI(){
    if(!$('audioSystemStyles')){
      const style=document.createElement('style');style.id='audioSystemStyles';
      style.textContent=`.audio-toggle{position:fixed;right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));z-index:45;border:1px solid #344149;background:rgba(7,9,11,.90);color:#62c7c9;font:700 8px/1 monospace;letter-spacing:.08em;padding:9px 10px;cursor:pointer;box-shadow:0 0 0 1px rgba(0,0,0,.45)}.audio-toggle.off{color:#687775;border-color:#29343b}.audio-toggle:focus-visible{outline:1px solid #d2b06d;outline-offset:2px}@media(max-width:420px){.audio-toggle{font-size:7px;padding:8px 9px}}`;
      document.head.appendChild(style);
    }
    if(!$('soundToggle')){
      const btn=document.createElement('button');btn.type='button';btn.id='soundToggle';btn.className='audio-toggle';btn.setAttribute('aria-label','切換背景音樂');
      btn.addEventListener('click',e=>{e.stopPropagation();setEnabled(!enabled);});document.body.appendChild(btn);
    }
    renderToggle();
  }

  function installObservers(){
    const observeText=node=>node&&new MutationObserver(queueSync).observe(node,{childList:true,characterData:true,subtree:true});
    observeText($('role'));observeText($('eventBadge'));observeText($('quote'));
    const classObserver=new MutationObserver(queueSync);
    [$('end'),$('start'),$('eventBadge')].filter(Boolean).forEach(node=>classObserver.observe(node,{attributes:true,attributeFilter:['class']}));
  }

  installUI();
  installObservers();
  $('startBtn')?.addEventListener('click',unlock,true);
  $('again')?.addEventListener('click',()=>setTimeout(queueSync,0),true);
  $('continueBtn')?.addEventListener('click',()=>setTimeout(queueSync,0),true);

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) silence(.05);
    else if(enabled&&unlocked&&activeGame()) queueSync();
  });

  window.RED_FLAG_AUDIO={
    unlock,setEnabled,sync:queueSync,silence,
    get enabled(){return enabled&&assetsAvailable;},
    get mode(){return mode;},
    get level(){return mode?LEVELS[mode]:0;},
    get engine(){return 'hq-file-playback';},
    get assetsAvailable(){return assetsAvailable;}
  };
})();