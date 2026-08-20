(() => {
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'rfd-sound-enabled-v1';
  const LEVELS = { normal:0.78, wtf:0.86, danger:0.95 };
  const HOOK = [69,72,76,74,76,74,72,69];
  const ROOTS = [45,41,43,40];
  const CHORDS = [[57,60,64],[53,57,60],[55,59,62],[52,55,59]];

  let enabled = true;
  let unlocked = false;
  let ctx = null;
  let master = null;
  let mode = '';
  let timer = null;
  let step = 0;
  let nextStepAt = 0;
  let syncQueued = false;
  let noiseBuffer = null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) enabled = stored !== '0';
  } catch {}

  // Keep EVENT cards out of the normal character pool. app-v2 still inserts only
  // its dedicated EVENT slots; this only makes that small candidate pool balanced.
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

  const midi = n => 440*Math.pow(2,(n-69)/12);

  function activeGame(){
    const start=$('start'), end=$('end');
    if(start && !start.classList.contains('hidden')) return false;
    if(end && !end.classList.contains('hidden')) return false;
    return true;
  }

  function ensureAudio(){
    if(ctx) return true;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return false;
    ctx=new AC({latencyHint:'interactive'});
    master=ctx.createGain();
    master.gain.value=0;
    master.connect(ctx.destination);
    noiseBuffer=ctx.createBuffer(1,2048,ctx.sampleRate);
    const ch=noiseBuffer.getChannelData(0);
    for(let i=0;i<ch.length;i++) ch[i]=Math.random()*2-1;
    return true;
  }

  function tone(freq,start,dur,amp,type='square',pan=0){
    if(!ctx||!master) return;
    const osc=ctx.createOscillator(), gain=ctx.createGain();
    const panner=ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    osc.type=type; osc.frequency.setValueAtTime(freq,start);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002,amp),start+.008);
    gain.gain.setValueAtTime(Math.max(.0002,amp*.82),Math.max(start+.01,start+dur-.04));
    gain.gain.exponentialRampToValueAtTime(.0001,start+dur);
    if(panner){panner.pan.value=pan;osc.connect(gain).connect(panner).connect(master);}else osc.connect(gain).connect(master);
    osc.start(start);osc.stop(start+dur+.02);
  }

  function noise(start,dur,amp,pan=0){
    if(!ctx||!master||!noiseBuffer) return;
    const src=ctx.createBufferSource(), gain=ctx.createGain();
    const panner=ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    src.buffer=noiseBuffer;
    gain.gain.setValueAtTime(amp,start);gain.gain.exponentialRampToValueAtTime(.0001,start+dur);
    if(panner){panner.pan.value=pan;src.connect(gain).connect(panner).connect(master);}else src.connect(gain).connect(master);
    src.start(start);src.stop(start+dur+.01);
  }

  function kick(start,amp=.055){
    if(!ctx||!master) return;
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(135,start);osc.frequency.exponentialRampToValueAtTime(43,start+.11);
    gain.gain.setValueAtTime(amp,start);gain.gain.exponentialRampToValueAtTime(.0001,start+.14);
    osc.connect(gain).connect(master);osc.start(start);osc.stop(start+.15);
  }

  function bpm(){return mode==='danger'?142:mode==='wtf'?118:96;}

  function scheduleStep(at,index){
    const bar=Math.floor(index/8)%4, eighth=index%8, beat=60/bpm();
    const root=ROOTS[bar], chord=CHORDS[bar];
    let notes=HOOK;
    if(mode==='wtf') notes=bar%3===1?[69,72,77,74,76,73,72,68]:bar%3===2?[69,71,76,75,76,74,71,69]:HOOK;
    else if(mode==='danger') notes=[69,72,74,76,74,72,71,67];

    const leadAmp=mode==='danger'?.061:mode==='wtf'?.057:.063;
    tone(midi(notes[eighth]+12),at,beat*.34,leadAmp,'square',eighth%2?.14:-.14);

    if(eighth%2===0) chord.forEach((n,i)=>tone(midi(n+12),at,beat*.28,mode==='danger'?.011:.016,'square',[-.28,0,.28][i]));

    let bassNote=root;
    if(mode==='danger') bassNote=eighth%2?root+6:root;
    else if(mode==='wtf'&&eighth===3) bassNote=root+1;
    else if(eighth===4) bassNote=root+7;
    tone(midi(bassNote),at,beat*.40,mode==='danger'?.068:.054,'triangle');

    if(mode==='danger'){
      if(eighth%2===0) kick(at,.073);
      noise(at,.025,eighth%4===0?.024:.015,eighth%2?.35:-.35);
      if(bar%2===1&&eighth===7) tone(midi(89),at,beat*.10,.022,'square',.35);
    }else if(mode==='wtf'){
      if(eighth===0||eighth===3||eighth===6) kick(at,.055);
      noise(at,.022,.013,eighth%2?.38:-.38);
    }else{
      if(eighth===0||eighth===4) kick(at,.052);
      if(eighth===2||eighth===6) noise(at,.04,.018,eighth===2?-.18:.18);
      else noise(at,.018,.008,eighth%2?.32:-.32);
    }
  }

  function scheduler(){
    if(!ctx||!activeGame()||!enabled||!unlocked||!mode) return;
    const horizon=ctx.currentTime+.28;
    while(nextStepAt<horizon){
      scheduleStep(nextStepAt,step);
      nextStepAt+=(60/bpm())/2;
      step=(step+1)%32;
    }
  }

  function startScheduler(){
    if(!ctx||timer) return;
    nextStepAt=ctx.currentTime+.035;
    timer=setInterval(scheduler,120);
    scheduler();
  }

  function stopScheduler(){if(timer){clearInterval(timer);timer=null;}}

  function silence(fade=.22){
    stopScheduler();mode='';step=0;
    if(!ctx||!master) return;
    const now=ctx.currentTime;
    master.gain.cancelScheduledValues(now);master.gain.setValueAtTime(master.gain.value,now);master.gain.linearRampToValueAtTime(0,now+fade);
  }

  function currentCardMode(){
    if(!activeGame()) return '';
    const role=String($('role')?.textContent||''),badge=String($('eventBadge')?.textContent||''),dialog=$('dialog');
    if(/DANGER FILE/i.test(role)||/DANGER FILE/i.test(badge)||dialog?.classList.contains('danger-dialog')) return 'danger';
    if(/WTF/i.test(role)||/WTF/i.test(badge)||/RARE FILE|BOSS|CASE FINALE/i.test(badge)) return 'wtf';
    return 'normal';
  }

  async function applyMode(next){
    if(!next){silence();return;}
    if(!enabled||!unlocked) return;
    if(!ensureAudio()) return;
    try{if(ctx.state==='suspended') await ctx.resume();}catch{}
    if(mode===next&&timer) return;

    const now=ctx.currentTime;
    master.gain.cancelScheduledValues(now);master.gain.setValueAtTime(master.gain.value,now);master.gain.linearRampToValueAtTime(0,now+.16);
    stopScheduler();mode=next;step=0;nextStepAt=now+.18;
    setTimeout(()=>{
      if(!ctx||!activeGame()||!enabled||mode!==next) return;
      const t=ctx.currentTime;
      master.gain.cancelScheduledValues(t);master.gain.setValueAtTime(master.gain.value,t);master.gain.linearRampToValueAtTime(LEVELS[next]||LEVELS.normal,t+.24);
      startScheduler();
    },170);
  }

  function queueSync(){
    if(syncQueued) return;
    syncQueued=true;
    requestAnimationFrame(()=>{syncQueued=false;applyMode(currentCardMode());});
  }

  async function unlock(){
    if(!enabled) return;
    if(!ensureAudio()) return;
    unlocked=true;
    try{if(ctx.state==='suspended') await ctx.resume();}catch{}
    queueSync();
  }

  function setEnabled(next){
    enabled=Boolean(next);
    try{localStorage.setItem(STORAGE_KEY,enabled?'1':'0');}catch{}
    renderToggle();
    if(enabled) unlock(); else silence(.18);
  }

  function renderToggle(){
    const btn=$('soundToggle');if(!btn)return;
    btn.textContent=enabled?'♪ SOUND ON':'♪ SOUND OFF';btn.setAttribute('aria-pressed',enabled?'true':'false');btn.classList.toggle('off',!enabled);
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
    [$('end'),$('start'),$('dialog'),$('eventBadge')].filter(Boolean).forEach(node=>classObserver.observe(node,{attributes:true,attributeFilter:['class']}));
  }

  function installSfx(){
    $('choices')?.addEventListener('click',event=>{
      if(!activeGame()||!ctx||ctx.state!=='running'||!enabled||!unlocked) return;
      const button=event.target.closest('button[data-choice]');if(!button)return;
      tone(button.classList.contains('unlocked-choice')?1100:720,ctx.currentTime,.075,.055,'square');
    },true);
  }

  installUI();installObservers();installSfx();
  $('startBtn')?.addEventListener('click',unlock,true);
  $('soundToggle')?.addEventListener('click',()=>{if(enabled)unlock();},true);
  $('again')?.addEventListener('click',()=>setTimeout(queueSync,0),true);

  document.addEventListener('visibilitychange',()=>{
    if(!ctx) return;
    if(document.hidden){stopScheduler();try{ctx.suspend();}catch{}}
    else if(enabled&&unlocked&&activeGame()){try{ctx.resume().then(queueSync);}catch{}}
  });

  window.RED_FLAG_AUDIO={unlock,setEnabled,sync:queueSync,silence,get enabled(){return enabled;},get mode(){return mode;},get level(){return mode?LEVELS[mode]:0;}};
})();