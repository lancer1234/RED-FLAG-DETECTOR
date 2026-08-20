(() => {
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'rfd-sound-enabled-v1';
  const CROSSFADE = 0.72;
  const LEVELS = { normal:0.25, wtf:0.29, danger:0.36 };
  const HOOK = [69,72,76,74,76,74,72,69];
  const ROOTS = [45,41,43,40];
  const CHORDS = [[57,60,64],[53,57,60],[55,59,62],[52,55,59]];

  let enabled = true;
  let unlocked = false;
  let ctx = null;
  let master = null;
  let current = null;
  let currentMode = '';
  let buffers = {};
  let syncQueued = false;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) enabled = stored !== '0';
  } catch {}

  const midi = note => 440 * Math.pow(2, (note - 69) / 12);
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

  // BUILD 5.4.1 density fix:
  // app-v2 keeps references to these same arrays, so redistributing them here
  // still affects future buildDeck() calls without touching its private state.
  function rebalanceSpecialEvents(){
    const data = window.RED_FLAG_DATA || [];
    const events = window.RED_FLAG_EVENTS || [];
    if (!events.length || events.__rfdRebalanced) return;

    const isSpecial = item => Boolean(item?.danger) || /WTF/i.test(String(item?.type || '')) || /^DG\d+/i.test(String(item?.id || ''));
    const specials = events.filter(isSpecial);
    const regular = events.filter(item => !isSpecial(item));
    if (!specials.length) return;

    // Reserve a rotating set for app-v2's dedicated EVENT slots. Because app-v2
    // inserts two event cards per 20/50-card run, this guarantees both slots are
    // meaningful WTF/DANGER cards instead of burying them in a large generic pool.
    const shuffled = specials.slice();
    for (let i=shuffled.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
    }
    const reserved = shuffled.slice(0, Math.min(8, shuffled.length));
    const reservedIds = new Set(reserved.map(x=>x.id));

    // Everything not reserved joins the normal no-repeat pool. Event objects are
    // valid there because app-v2 already renders by item.kind === 'event'.
    const additions = [...regular, ...specials.filter(x=>!reservedIds.has(x.id))]
      .filter(x => !data.some(d => d.id === x.id));
    data.push(...additions);

    events.splice(0, events.length, ...reserved);
    try { Object.defineProperty(events,'__rfdRebalanced',{value:true,configurable:true}); } catch { events.__rfdRebalanced=true; }
    window.RED_FLAG_SPECIAL_DENSITY = {
      reserved: reserved.map(x=>x.id),
      promoted: additions.filter(isSpecial).map(x=>x.id),
      guaranteedEventSlots: 2
    };
  }
  rebalanceSpecialEvents();

  function makeNoise(seed){
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return (s / 0xffffffff) * 2 - 1;
    };
  }

  function panGains(pan){
    const angle = (clamp(pan,-1,1)+1)*Math.PI/4;
    return [Math.cos(angle),Math.sin(angle)];
  }

  function addTone(L,R,sr,start,dur,note,amp,type='pulse',pan=0,duty=.32){
    const i0=Math.max(0,Math.floor(start*sr));
    const n=Math.max(1,Math.floor(dur*sr));
    if(i0>=L.length)return;
    const end=Math.min(L.length,i0+n), f=midi(note), [lg,rg]=panGains(pan);
    const attack=Math.max(1,Math.floor(sr*.005));
    const release=Math.max(1,Math.floor(sr*Math.min(.055,dur*.30)));
    for(let i=i0;i<end;i++){
      const local=i-i0,t=local/sr,phase=(f*t)%1;
      let wave;
      if(type==='triangle') wave=2/Math.PI*Math.asin(Math.sin(2*Math.PI*f*t));
      else if(type==='sine') wave=Math.sin(2*Math.PI*f*t);
      else {
        const raw=phase<duty?1:-1;
        wave=Math.tanh(raw*1.65+Math.sin(2*Math.PI*f*t)*.58);
      }
      let e=1;
      if(local<attack)e*=local/attack;
      const left=end-i;
      if(left<release)e*=left/release;
      const v=wave*amp*e;
      L[i]+=v*lg;R[i]+=v*rg;
    }
  }

  function addKick(L,R,sr,start,amp=.12){
    const i0=Math.floor(start*sr),n=Math.floor(.15*sr);
    for(let k=0;k<n&&i0+k<L.length;k++){
      const t=k/sr,f=44+115*Math.exp(-22*t);
      const v=Math.sin(2*Math.PI*f*t)*Math.exp(-24*t)*amp;
      L[i0+k]+=v*.707;R[i0+k]+=v*.707;
    }
  }

  function addNoise(L,R,sr,start,dur,amp,seed,pan=0){
    const i0=Math.floor(start*sr),n=Math.floor(dur*sr),rnd=makeNoise(seed+i0),[lg,rg]=panGains(pan);
    for(let k=0;k<n&&i0+k<L.length;k++){
      const t=k/sr,v=rnd()*Math.exp(-85*t)*amp;
      L[i0+k]+=v*lg;R[i0+k]+=v*rg;
    }
  }

  function normalize(L,R){
    let peak=.0001;
    for(let i=0;i<L.length;i++)peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));
    const gain=.78/peak;
    for(let i=0;i<L.length;i++){
      L[i]=Math.tanh(L[i]*gain*1.08);
      R[i]=Math.tanh(R[i]*gain*1.08);
    }
  }

  function buildBuffer(mode){
    const sr=ctx.sampleRate||48000;
    const bpm=mode==='normal'?96:mode==='wtf'?118:142;
    const beat=60/bpm,bars=4,duration=bars*4*beat,frames=Math.ceil(duration*sr);
    const L=new Float32Array(frames),R=new Float32Array(frames);

    for(let bar=0;bar<bars;bar++){
      const bt=bar*4*beat,root=ROOTS[bar%4],chord=CHORDS[bar%4];
      for(let step=0;step<8;step++){
        const st=bt+step*beat/2;
        chord.forEach((note,ci)=>addTone(L,R,sr,st,beat*.28,note+12,mode==='danger'?.012:.020,'pulse',[-.35,0,.35][ci],.28));
      }

      let bass;
      if(mode==='normal')bass=[[0,root],[1.5,root],[2,root+7],[3,root]];
      else if(mode==='wtf')bass=[[0,root],[1.25,root+1],[2,root],[2.75,root+6],[3.5,root]];
      else bass=Array.from({length:8},(_,i)=>[i*.5,i%2?root+6:root]);
      bass.forEach(([pos,note])=>addTone(L,R,sr,bt+pos*beat,beat*.38,note,mode==='danger'?.11:.09,'triangle'));

      let notes=HOOK.slice(),jitter=new Array(8).fill(0);
      if(mode==='wtf'){
        if(bar%3===1)notes=[69,72,77,74,76,73,72,68];
        else if(bar%3===2)notes=[69,71,76,75,76,74,71,69];
        if(bar%2)jitter=[0,0,.08,-.04,.12,0,-.08,.04];
      }else if(mode==='danger')notes=[69,72,74,76,74,72,71,67];

      notes.forEach((note,i)=>{
        const st=bt+i*beat/2+jitter[i]*beat;
        const amp=mode==='normal'?.085:mode==='wtf'?.073:.079;
        const duty=mode==='normal'?.38:mode==='wtf'?.29:.22;
        const pan=i%2?.18:-.18;
        addTone(L,R,sr,st,beat*.28,note+12,amp,'pulse',pan,duty);
        if(mode==='danger')addTone(L,R,sr,st,beat*.17,note+13,.012,'pulse',-pan,.16);
      });

      if(mode==='normal'){
        addKick(L,R,sr,bt,.095);addKick(L,R,sr,bt+2*beat,.082);
        addNoise(L,R,sr,bt+beat,.05,.026,10+bar,-.15);addNoise(L,R,sr,bt+3*beat,.05,.026,20+bar,.15);
        for(let k=0;k<8;k++)addNoise(L,R,sr,bt+k*beat/2,.018,.010,100+bar*8+k,k%2?.42:-.42);
      }else if(mode==='wtf'){
        [0,1.75,3.2].forEach(pos=>addKick(L,R,sr,bt+pos*beat,.086));
        [1,2.45,3.65].forEach((pos,i)=>addNoise(L,R,sr,bt+pos*beat,.05,.040,200+bar*3+i));
        for(let k=0;k<8;k++)if(!(bar%3===2&&k===6))addNoise(L,R,sr,bt+k*beat/2,.016,.014,300+bar*8+k,k%2?.52:-.52);
      }else{
        [0,1,2,3].forEach((pos,i)=>addKick(L,R,sr,bt+pos*beat,i%2?.075:.125));
        [1.5,3.5].forEach(pos=>addKick(L,R,sr,bt+pos*beat,.060));
        for(let k=0;k<16;k++)addNoise(L,R,sr,bt+k*beat/4,.016,k%4?.018:.027,400+bar*16+k,k%2?.48:-.48);
        if(bar%2===1)[88,89,88,83].forEach((n,i)=>addTone(L,R,sr,bt+(3+i*.2)*beat,beat*.10,n,.028,'pulse',i%2?.45:-.45,.12));
      }
    }

    const delay=Math.max(1,Math.floor(sr*.007));
    for(let i=delay;i<frames;i++){
      const l=L[i],r=R[i];
      L[i]=l+R[i-delay]*.08;
      R[i]=r+L[i-delay]*.08;
    }
    normalize(L,R);
    const buffer=ctx.createBuffer(2,frames,sr);
    buffer.copyToChannel(L,0);buffer.copyToChannel(R,1);
    return buffer;
  }

  function ensureAudio(){
    if(ctx)return true;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return false;
    ctx=new AC({latencyHint:'interactive'});
    master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
    buffers.normal=buildBuffer('normal');buffers.wtf=buildBuffer('wtf');buffers.danger=buildBuffer('danger');
    return true;
  }

  function activeGame(){
    const start=$('start'),end=$('end');
    if(start&&!start.classList.contains('hidden'))return false;
    if(end&&!end.classList.contains('hidden'))return false;
    return true;
  }

  function silence(fade=.28){
    if(!ctx||!master)return;
    const now=ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value,now);
    master.gain.linearRampToValueAtTime(0,now+fade);
    if(current){
      try{
        current.gain.gain.cancelScheduledValues(now);
        current.gain.gain.setValueAtTime(current.gain.gain.value,now);
        current.gain.gain.linearRampToValueAtTime(0,now+fade);
        current.source.stop(now+fade+.05);
      }catch{}
      current=null;currentMode='';
    }
  }

  function currentCardMode(){
    if(!activeGame())return null;
    const role=String($('role')?.textContent||''),badge=String($('eventBadge')?.textContent||''),dialog=$('dialog');
    if(/DANGER FILE/i.test(role)||/DANGER FILE/i.test(badge)||dialog?.classList.contains('danger-dialog'))return 'danger';
    if(/WTF/i.test(role)||/WTF/i.test(badge)||/RARE FILE|BOSS|CASE FINALE/i.test(badge))return 'wtf';
    return 'normal';
  }

  async function transition(mode){
    if(!mode){silence();return;}
    if(!enabled||!unlocked)return;
    if(!ensureAudio())return;
    try{if(ctx.state==='suspended')await ctx.resume();}catch{}
    const now=ctx.currentTime,target=mode,targetLevel=LEVELS[target]||LEVELS.normal;

    if(current&&currentMode===target){
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.gain?.value ?? master.gain.value,now);
      master.gain.linearRampToValueAtTime(targetLevel,now+.30);
      return;
    }

    const buffer=buffers[target]||buffers.normal,source=ctx.createBufferSource(),gain=ctx.createGain();
    source.buffer=buffer;source.loop=true;gain.gain.setValueAtTime(0,now);source.connect(gain).connect(master);
    let offset=0;
    if(current&&current.bufferDuration){
      const elapsed=Math.max(0,now-current.startedAt),phase=(elapsed%current.bufferDuration)/current.bufferDuration;
      offset=phase*buffer.duration;
    }
    source.start(now,offset);gain.gain.linearRampToValueAtTime(1,now+CROSSFADE);
    if(current){
      try{
        current.gain.gain.cancelScheduledValues(now);current.gain.gain.setValueAtTime(current.gain.gain.value,now);
        current.gain.gain.linearRampToValueAtTime(0,now+CROSSFADE);current.source.stop(now+CROSSFADE+.06);
      }catch{}
    }
    current={source,gain,startedAt:now-offset,bufferDuration:buffer.duration};currentMode=target;
    master.gain.cancelScheduledValues(now);master.gain.setValueAtTime(master.gain.value,now);master.gain.linearRampToValueAtTime(targetLevel,now+.32);
  }

  function queueSync(){
    if(syncQueued)return;
    syncQueued=true;
    requestAnimationFrame(()=>{syncQueued=false;transition(currentCardMode());});
  }

  async function unlock(){
    if(!enabled)return;
    if(!ensureAudio())return;
    unlocked=true;
    try{if(ctx.state==='suspended')await ctx.resume();}catch{}
    queueSync();
  }

  function setEnabled(next){
    enabled=Boolean(next);
    try{localStorage.setItem(STORAGE_KEY,enabled?'1':'0');}catch{}
    renderToggle();
    if(enabled)unlock();else silence(.20);
  }

  function renderToggle(){
    const btn=$('soundToggle');if(!btn)return;
    btn.textContent=enabled?'♪ SOUND ON':'♪ SOUND OFF';
    btn.setAttribute('aria-pressed',enabled?'true':'false');btn.classList.toggle('off',!enabled);
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
      if(!activeGame())return;
      const button=event.target.closest('button[data-choice]');
      if(!button||!enabled||!unlocked||!ctx||ctx.state!=='running')return;
      const osc=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;
      osc.type='square';osc.frequency.setValueAtTime(button.classList.contains('unlocked-choice')?880:620,now);
      osc.frequency.exponentialRampToValueAtTime(button.classList.contains('unlocked-choice')?1320:760,now+.055);
      gain.gain.setValueAtTime(.050,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.075);
      osc.connect(gain).connect(master);osc.start(now);osc.stop(now+.08);
    },true);
  }

  installUI();installObservers();installSfx();

  // User gesture only unlocks the engine. Music will remain silent while the
  // START/onboarding or RESULT overlay is visible and begins only on a real card.
  $('startBtn')?.addEventListener('click',unlock,true);
  $('soundToggle')?.addEventListener('click',()=>{if(enabled)unlock();},true);
  $('again')?.addEventListener('click',()=>setTimeout(queueSync,0),true);

  document.addEventListener('visibilitychange',()=>{
    if(!ctx)return;
    if(document.hidden){try{ctx.suspend();}catch{}}
    else if(enabled&&unlocked&&activeGame()){try{ctx.resume().then(queueSync);}catch{}}
  });

  window.RED_FLAG_AUDIO={
    unlock,setEnabled,sync:queueSync,silence,
    get enabled(){return enabled;},
    get mode(){return currentMode;},
    get level(){return currentMode?LEVELS[currentMode]:0;}
  };
})();