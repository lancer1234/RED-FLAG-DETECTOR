(() => {
  const data=window.RED_FLAG_DATA||[];
  const eventData=window.RED_FLAG_EVENTS||[];
  const personas=window.RED_FLAG_PERSONAS||{};
  const interactions=window.RED_FLAG_INTERACTIONS||{};
  const flavor=window.RED_FLAG_FLAVOR||{};
  const meta=window.RED_FLAG_META||{modifiers:[],traitLabels:{},eventChains:{},rareEndings:[]};
  const labels=['LOVE','RADAR','STANDARD','CHAOS'];
  const keys=['a','b','c','d'];

  const crisisEndings={
    '0-low':['心已關機','LOVE 歸零。妳把所有可能性都先判成不值得，安全到連心動也一起被封鎖。','LOVE 0 // CONNECTION LOST'],
    '0-high':['戀愛腦全面接管','LOVE 爆滿。妳已經開始替還沒發生的婚禮想歌單，現實暫時沒有登入權限。','LOVE 100 // HEART OVERRIDE'],
    '1-low':['警報器拔電池','RADAR 歸零。線索從妳面前排隊走過，妳還在說：「應該只是巧合吧？」','RADAR 0 // NO SIGNAL'],
    '1-high':['全員列入觀察名單','RADAR 爆滿。已讀時間差、限動觀看順序、語氣變化全部進入鑑識程序。','RADAR 100 // PARANOIA MODE'],
    '2-low':['底線已解除安裝','STANDARD 歸零。規則一路往後退，最後只剩「至少他還會回訊息」。','STANDARD 0 // BOUNDARY FAILURE'],
    '2-high':['無人通過審核','STANDARD 爆滿。所有人都在第一輪資格審查被刷掉。','STANDARD 100 // ACCESS DENIED'],
    '3-low':['人生進入飛航模式','CHAOS 歸零。妳避開所有風險，也把所有可能長出故事的入口一起關掉。','CHAOS 0 // ZERO DRAMA'],
    '3-high':['劇情已經失控','CHAOS 爆滿。姐妹群組 99+、前任復活、凌晨訊息、臨時約會同時發生。','CHAOS 100 // SEASON FINALE']
  };

  const looks={
    P01:{hair:1,glasses:false,beard:false,earring:true,shirt:0,prop:'drink'},
    P02:{hair:2,glasses:true,beard:false,earring:false,shirt:1,prop:'watch'},
    P03:{hair:4,glasses:false,beard:false,earring:true,shirt:2,prop:'gift'},
    P04:{hair:0,glasses:false,beard:true,earring:false,shirt:3,prop:'phone'},
    P05:{hair:3,glasses:true,beard:false,earring:false,shirt:4,prop:'bag'},
    P06:{hair:5,glasses:false,beard:true,earring:true,shirt:0,prop:'ghost'},
    P07:{hair:6,glasses:false,beard:false,earring:false,shirt:1,prop:'hoodie'},
    P08:{hair:2,glasses:false,beard:true,earring:false,shirt:2,prop:'book'},
    P09:{hair:4,glasses:true,beard:false,earring:true,shirt:3,prop:'phone'},
    P10:{hair:1,glasses:true,beard:true,earring:false,shirt:4,prop:'receipt'},
    P11:{hair:3,glasses:false,beard:false,earring:true,shirt:1,prop:'coffee'},
    P12:{hair:6,glasses:false,beard:true,earring:true,shirt:2,prop:'keys'}
  };

  const state={
    deck:[],index:0,stats:[50,50,50,50],seen:[],history:[],locked:false,rounds:15,mode:'FULL SCAN',ending:null,
    modifier:null,traits:{soft:0,boundary:0,detective:0,chaos:0,direct:0,avoidant:0,action:0,romantic:0},
    personaStats:{},flags:{},specialChoices:0
  };
  const runtime=window.RED_FLAG_RUNTIME||(window.RED_FLAG_RUNTIME={});
  runtime.scheduleCrisis=runtime.scheduleCrisis||(({onFinish})=>setTimeout(onFinish,520));
  runtime.getState=()=>state;

  const $=id=>document.getElementById(id);
  const clamp=v=>Math.max(0,Math.min(100,v));
  const shuffle=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const hash=text=>[...String(text)].reduce((n,ch)=>((n<<5)-n+ch.charCodeAt(0))|0,0)>>>0;

  function buildDeck(rounds){
    const eventCount=rounds>=15?2:1;
    const coreRounds=rounds-eventCount;
    const rare=data.filter(x=>x.rare);
    const singles=data.filter(x=>!x.rare&&!x.arc);
    const arcMap=new Map();
    data.filter(x=>x.arc).forEach(x=>{if(!arcMap.has(x.arc))arcMap.set(x.arc,[]);arcMap.get(x.arc).push(x);});
    [...arcMap.values()].forEach(a=>a.sort((x,y)=>x.stage-y.stage));
    const useArc=Math.random()<(rounds>=15?.9:.7);
    const useRare=Math.random()<(rounds>=15?.25:.18);
    let deck=[];
    if(useArc&&arcMap.size){
      const arc=shuffle([...arcMap.values()])[0];
      const fillerCount=coreRounds-arc.length-(useRare?1:0);
      deck=shuffle(singles).slice(0,Math.max(0,fillerCount));
      const pos=rounds>=15?[1,Math.floor(coreRounds/2),Math.max(2,coreRounds-2)]:[1,3,5];
      arc.forEach((x,i)=>deck.splice(Math.min(pos[i],deck.length),0,x));
    }else deck=shuffle(singles).slice(0,coreRounds-(useRare?1:0));
    if(useRare&&rare.length){const x=shuffle(rare)[0];deck.splice(Math.min(2+Math.floor(Math.random()*Math.max(1,deck.length-2)),deck.length),0,x);}
    if(deck.length<coreRounds){const used=new Set(deck.map(x=>x.id));deck.push(...shuffle(singles.filter(x=>!used.has(x.id))).slice(0,coreRounds-deck.length));}
    deck=deck.slice(0,coreRounds);
    shuffle(eventData).slice(0,eventCount).forEach((x,i)=>{const p=Math.min(deck.length,1+i+Math.floor(Math.random()*Math.max(1,deck.length-i-1)));deck.splice(p,0,x);});
    return deck.slice(0,rounds);
  }

  function modifierDelta(delta){
    const m=state.modifier?.mult||[1,1,1,1];
    return delta.map((v,i)=>{
      if(!v)return 0;
      if(state.modifier?.id==='therapy'&&i===2&&v<0)return v;
      return Math.round(v*m[i]);
    });
  }

  function updateStats(){
    [...document.querySelectorAll('.stat')].forEach((node,i)=>{
      const v=state.stats[i];$('s'+i).style.width=v+'%';
      node.classList.toggle('critical-low',v<=15);node.classList.toggle('critical-high',v>=85);
    });
    renderWarning();renderTraits();
  }

  function renderWarning(){
    const warnings=[];
    state.stats.forEach((v,i)=>{if(v<=15)warnings.push(`${labels[i]} CRITICAL LOW`);else if(v>=85)warnings.push(`${labels[i]} CRITICAL HIGH`);});
    const box=$('systemWarning');
    if(!warnings.length){box.classList.add('hidden');box.textContent='';return;}
    const details={LOVE:'妳的心動系統快要失去平衡',RADAR:'妳的警報器已經過度敏感或快沒電',STANDARD:'妳的底線系統正在逼近極端',CHAOS:'劇情濃度已接近失控'};
    const first=warnings[0].split(' ')[0];box.textContent=`⚠ ${warnings.join(' · ')} // ${details[first]}`;box.classList.remove('hidden');
  }

  function renderTraits(){
    const rows=Object.entries(state.traits).sort((a,b)=>b[1]-a[1]).filter(x=>x[1]>=2).slice(0,3);
    $('traitStrip').textContent=rows.length?'TRAITS // '+rows.map(([k,v])=>`${meta.traitLabels[k]||k} ${v}`).join(' · '):'TRAITS // 尚未形成明顯傾向';
  }

  function updateProgress(){$('progressFill').style.width=(state.deck.length?(state.index/state.deck.length)*100:0)+'%';}

  function palette(seed){const p=[['#0c1419','#17313a','#d7b07f','#2a1e18','#202c34','#d2b06d'],['#160e14','#3a1c28','#c98e73','#141012','#352638','#62c7c9'],['#0d1510','#24402f','#a96e5f','#16100e','#283126','#d2b06d'],['#16120d','#43351f','#e0a986','#3a2417','#232323','#e05a67'],['#101018','#24264c','#b87968','#09090b','#272132','#81bc8e']];return p[seed%p.length];}

  function drawPerson(id,type){
    const c=$('portrait'),ctx=c.getContext('2d'),seed=hash(id)%97,l=looks[id]||looks.P01,p=palette(seed);ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,224,154);
    ctx.fillStyle=p[0];ctx.fillRect(0,0,224,154);for(let i=0;i<34;i++){ctx.fillStyle=i%2?p[1]:'#0b0e11';ctx.fillRect((i*37+seed*13)%224,(i*19+seed*7)%154,4,4);}
    ctx.fillStyle=p[1];ctx.fillRect(18,18,188,118);ctx.fillStyle='#0b0d10';ctx.fillRect(26,26,172,102);
    ctx.fillStyle=p[(l.shirt%2)?4:1];ctx.fillRect(62,103,100,28);if(l.shirt===1)ctx.fillRect(78,94,68,17);if(l.shirt===2){ctx.fillRect(68,98,88,9);ctx.fillStyle=p[5];ctx.fillRect(110,103,5,28);}if(l.shirt===3){ctx.fillRect(60,103,104,9);}if(l.shirt===4){ctx.fillRect(76,96,72,14);ctx.fillStyle=p[5];ctx.fillRect(90,101,44,4);}
    ctx.fillStyle=p[2];ctx.fillRect(90,44,44,60);ctx.fillRect(101,95,22,18);ctx.fillStyle=p[3];
    const h=l.hair;if(h===0){ctx.fillRect(84,36,56,18);ctx.fillRect(86,43,8,36);ctx.fillRect(132,43,8,38);}if(h===1){ctx.fillRect(83,35,58,14);ctx.fillRect(84,44,17,20);ctx.fillRect(126,44,15,22);ctx.fillRect(104,39,18,8);}if(h===2){ctx.fillRect(88,38,48,10);ctx.fillRect(86,46,6,20);ctx.fillRect(134,46,6,20);}if(h===3){ctx.fillRect(82,34,60,16);ctx.fillRect(82,44,10,48);ctx.fillRect(134,44,10,48);}if(h===4){for(let x=84;x<=136;x+=10)ctx.fillRect(x,34+((x/10)%2)*4,10,12);ctx.fillRect(82,46,9,28);ctx.fillRect(136,46,9,28);}if(h===5){ctx.fillRect(82,35,62,12);ctx.fillRect(92,29,42,8);ctx.fillRect(136,43,8,32);}if(h===6){ctx.fillRect(82,36,62,12);ctx.fillRect(84,43,32,10);ctx.fillRect(128,42,12,38);}
    ctx.fillStyle='#0a0b0c';ctx.fillRect(98,66,6,6);ctx.fillRect(121,66,6,6);ctx.fillRect(108,84,12,4);
    if(l.glasses){ctx.fillStyle='#d7d7d7';ctx.fillRect(91,62,18,4);ctx.fillRect(119,62,18,4);ctx.fillRect(109,64,10,3);ctx.fillRect(91,66,4,9);ctx.fillRect(133,66,4,9);}if(l.beard){ctx.fillStyle=p[3];ctx.fillRect(99,87,29,7);ctx.fillRect(104,94,20,5);}if(l.earring){ctx.fillStyle=p[5];ctx.fillRect(86,73,4,8);}
    if(type.includes('前任')||id==='P06'){ctx.fillStyle='#b5424d';ctx.fillRect(160,34,22,6);ctx.fillRect(168,26,6,22);}drawProp(ctx,l.prop,p);
  }

  function drawProp(ctx,prop,p){ctx.fillStyle=p[5];if(prop==='phone'){ctx.fillRect(154,104,18,24);ctx.fillStyle='#0b0d10';ctx.fillRect(158,108,10,15);}if(prop==='receipt'){ctx.fillRect(48,105,25,23);ctx.fillStyle='#0b0d10';ctx.fillRect(52,110,17,3);ctx.fillRect(52,116,13,3);}if(prop==='gift'){ctx.fillRect(48,106,26,20);ctx.fillStyle='#0b0d10';ctx.fillRect(59,106,4,20);ctx.fillRect(48,113,26,4);}if(prop==='coffee'){ctx.fillRect(46,108,23,17);ctx.fillRect(68,112,6,9);}if(prop==='book'){ctx.fillRect(48,104,28,22);ctx.fillStyle='#0b0d10';ctx.fillRect(61,104,3,22);}if(prop==='keys'){ctx.fillRect(48,111,14,14);ctx.fillRect(61,116,18,4);ctx.fillRect(70,112,4,8);}if(prop==='watch'){ctx.fillRect(154,111,20,7);ctx.fillStyle='#0b0d10';ctx.fillRect(161,109,6,11);}if(prop==='bag'){ctx.fillRect(45,103,30,25);ctx.fillStyle='#0b0d10';ctx.fillRect(52,98,16,8);}if(prop==='drink'){ctx.fillRect(49,108,15,19);ctx.fillStyle='#0b0d10';ctx.fillRect(52,103,9,6);}if(prop==='ghost'){ctx.fillStyle='#b5424d';ctx.fillRect(48,108,22,16);ctx.fillRect(53,103,12,5);}if(prop==='hoodie'){ctx.strokeStyle=p[5];ctx.strokeRect(74,98,78,35);}
  }

  function drawEvent(item){
    const c=$('portrait'),ctx=c.getContext('2d'),seed=hash(item.id),p=palette(seed%97);ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,224,154);ctx.fillStyle='#090d10';ctx.fillRect(0,0,224,154);ctx.fillStyle=p[1];ctx.fillRect(18,18,188,118);ctx.fillStyle='#0b0f12';ctx.fillRect(28,28,168,98);for(let i=0;i<24;i++){ctx.fillStyle=i%3===0?p[5]:'#1c2930';ctx.fillRect((seed+i*29)%190+12,(seed+i*17)%120+12,4,4);}ctx.fillStyle=p[5];const icon=seed%6;if(icon===0){ctx.fillRect(72,48,80,54);ctx.fillStyle='#0b0f12';ctx.fillRect(80,56,64,6);ctx.fillRect(80,70,52,6);ctx.fillRect(80,84,36,6);}if(icon===1){ctx.fillRect(92,38,40,78);ctx.fillStyle='#0b0f12';ctx.fillRect(98,46,28,54);ctx.fillRect(106,105,12,5);}if(icon===2){ctx.fillRect(64,50,96,58);ctx.fillStyle='#0b0f12';ctx.fillRect(72,58,80,42);}if(icon===3){ctx.fillRect(100,36,24,24);ctx.fillRect(96,66,32,8);ctx.fillRect(88,80,48,8);ctx.fillRect(80,94,64,8);}if(icon===4){ctx.fillRect(105,42,14,54);ctx.fillRect(105,104,14,14);}if(icon===5){ctx.fillRect(68,58,76,38);ctx.fillRect(146,68,10,18);}ctx.fillStyle='#8d928f';ctx.font='8px monospace';ctx.fillText('SYSTEM EVENT // '+item.id,62,122);
  }

  function setBadge(item){const b=$('eventBadge');b.className='event-badge hidden';if(item.kind==='event'){b.textContent='◆ EVENT CARD';b.className='event-badge system-event';}else if(item.rare){b.textContent='⚠ RARE FILE';b.className='event-badge';}else if(item.arc){b.textContent=['CASE OPENED 1/3','CASE CONTINUES 2/3','CASE FINALE 3/3'][(item.stage||1)-1];b.className='event-badge arc';}}

  function personaMemory(id){if(!state.personaStats[id])state.personaStats[id]={trust:50,pressure:50,heat:50,seen:0};return state.personaStats[id];}
  function relationshipStatus(id){const p=personaMemory(id);if(p.pressure>=75)return'對方開始退縮';if(p.heat>=78)return'情緒濃度升高';if(p.trust>=72)return'關係正在升溫';if(p.trust<=30)return'信任正在下降';if(p.seen>=2)return'熟悉感增加中';return'';}

  function displayIdentity(item,persona){if(item.kind==='event')return{eyebrow:`SYSTEM EVENT // ${item.type}`,main:item.title};const named=Boolean(item.rare||item.special);return{eyebrow:named?`SPECIAL CHARACTER // ${item.type}`:item.type,main:named?persona.name:persona.role};}
  function hideInteraction(){$('interactionPanel').className='interaction-panel hidden';$('storyBeat').classList.add('hidden');}
  function hideRecap(){$('recapPanel').classList.add('hidden');$('recapList').innerHTML='';}
  const short=(t,m=66)=>{const s=String(t||'').replace(/\s+/g,' ').trim();return s.length>m?s.slice(0,m-1)+'…':s;};

  function renderRecap(item,persona){hideRecap();if(item.kind==='event'||!item.arc||item.stage<=1)return;const prev=state.history.filter(x=>x.arc===item.arc&&x.stage<item.stage).slice(-2);if(!prev.length)return;$('recapTitle').textContent=`${persona.role} · 妳之前已經遇過 ${prev.length} 次`;$('recapList').innerHTML=prev.map((x,i)=>`<div class="recap-entry"><div><b>${prev.length>1?`前情 ${i+1}`:'上次'}｜</b>${short(x.quote,72)}</div><div class="recap-choice">妳選：「${short(x.choice,45)}」</div>${x.response?`<div class="recap-response">對方：${short(x.response,62)}</div>`:''}${x.consequence?`<div class="recap-response">→ ${short(x.consequence,68)}</div>`:''}</div>`).join('');$('recapPanel').classList.remove('hidden');}

  function crossHook(item){if(item.kind==='event')return'';for(const [eventId,cfg] of Object.entries(meta.eventChains||{})){if(state.flags[cfg.flag]&&cfg.targets.includes(item.persona))return cfg.label;}return'';}

  function traitFrom(choice,delta){
    const t=choice.text+choice.note;const out=[];
    if(delta[2]>=6||/界線|不接受|拒絕|不用/.test(t))out.push('boundary');
    if(delta[1]>=6||/問清楚|觀察|確認|線索/.test(t))out.push('detective');
    if(delta[3]>=6||/算了|好玩|衝|接/.test(t))out.push('chaos');
    if(/直接|講清楚|告訴|問/.test(t))out.push('direct');
    if(/算了|先不要|不想講|等看看/.test(t))out.push('avoidant');
    if(/行動|做到|安排|訂位|記得/.test(t))out.push('action');
    if(delta[0]>=7||/心動|喜歡|陪|見他/.test(t))out.push('romantic');
    if(delta[0]>=6&&delta[2]<0)out.push('soft');
    return [...new Set(out)];
  }

  function impactText(delta){return delta.map((v,i)=>v?`${labels[i]} ${v>0?'↑':'↓'}`:'').filter(Boolean).join(' · ');}

  function specialChoice(item){
    if(item.kind==='event')return null;
    if(state.traits.detective>=3||state.stats[1]>=75)return{text:'等等，時間線好像對不上',note:'UNLOCKED // DETECTIVE',delta:[-2,10,7,-2],special:true};
    if(state.traits.boundary>=3||state.stats[2]>=78)return{text:'不用再解釋，我的界線已經很清楚',note:'UNLOCKED // BOUNDARY',delta:[-5,7,12,-5],special:true};
    if(state.traits.romantic>=4&&state.stats[0]>=75)return{text:'我其實很在意你，直接說吧',note:'UNLOCKED // HEART',delta:[10,-2,1,4],special:true};
    if(state.traits.chaos>=4&&state.stats[3]>=70)return{text:'這太荒謬了，我偏要看看會怎樣',note:'UNLOCKED // CHAOS',delta:[7,-5,-5,12],special:true};
    return null;
  }

  function getOptions(item){const base=item.kind==='event'?(item.options||[]):(typeof interactions.contextualOptions==='function'?interactions.contextualOptions(item):item.options||[]);const s=specialChoice(item);return s?[...base,s]:base;}

  function renderRound(){
    const item=state.deck[state.index];if(!item)return;const persona=personas[item.persona]||{name:'UNKNOWN',role:'關係未定義',profile:''};state.locked=false;hideInteraction();renderRecap(item,persona);$('quote').dataset.scenarioId=item.id||'';
    $('feedback').className='feedback hidden';$('target').textContent=(item.kind==='event'?'EVENT #':'TARGET #')+String(state.index+1).padStart(2,'0');$('count').textContent=String(state.index+1).padStart(2,'0')+' / '+state.deck.length;
    const identity=displayIdentity(item,persona);$('dramaHook').textContent=typeof flavor.hookFor==='function'?flavor.hookFor(item):item.type;$('role').textContent=identity.eyebrow;$('who').textContent=identity.main;$('quote').textContent=item.quote;
    const cross=crossHook(item);$('crossHook').textContent=cross;$('crossHook').classList.toggle('hidden',!cross);
    const status=item.kind==='event'?'':relationshipStatus(item.persona);$('relationshipState').textContent=status?`RELATIONSHIP STATE // ${status}`:'';$('relationshipState').classList.toggle('hidden',!status);
    $('dialog').className='dialog'+(item.special||item.rare?' special':'')+(item.kind==='event'?' event-dialog':'');$('portraitWrap').className='portrait-wrap'+(item.kind==='event'?' event-visual':'');if(item.kind==='event')drawEvent(item);else drawPerson(item.persona,item.type);setBadge(item);
    const choices=$('choices');choices.innerHTML='';getOptions(item).forEach((choice,i)=>{const effective=modifierDelta(choice.delta);const b=document.createElement('button');b.type='button';b.dataset.choice=i;b.className=choice.special?'unlocked-choice':'';b.innerHTML=`<b>${['A','B','C','D'][i]}｜${choice.text}</b><small>${choice.note}</small><small class="impact">${impactText(effective)}</small>`;b.onclick=()=>choose(choice,item,b,i,effective);choices.appendChild(b);});updateProgress();
  }

  function interactionPayload(item,i){if(item.kind==='event')return{shouldReply:false,story:null,reply:'',consequence:''};const shouldReply=typeof interactions.shouldReply==='function'&&interactions.shouldReply(item);const story=typeof interactions.storyFor==='function'?interactions.storyFor(item,Math.min(i,2)):null;const reply=story?story.beats[0]:shouldReply&&typeof interactions.characterReply==='function'?interactions.characterReply(item,Math.min(i,2)):'';return{shouldReply,story,reply,consequence:story?story.beats[1]:''};}
  function remember(item,choice,p){state.history.push({id:item.id,persona:item.persona||null,arc:item.arc||null,stage:item.stage||null,quote:item.quote,choice:choice.text,response:p.reply,consequence:p.consequence});}

  function applyPersona(item,delta,choice){if(item.kind==='event'||!item.persona)return;const p=personaMemory(item.persona);p.seen++;p.trust=clamp(p.trust+Math.round((delta[0]+delta[2]-Math.max(0,delta[3]))/3));p.pressure=clamp(p.pressure+Math.round((Math.max(0,delta[2])+Math.max(0,delta[1])-Math.max(0,delta[0]))/4));p.heat=clamp(p.heat+Math.round((delta[0]+delta[3]-delta[2]/2)/3));}
  function applyEventFlag(item,choiceIndex){if(item.kind!=='event')return;const cfg=meta.eventChains?.[item.id];if(cfg&&choiceIndex!==2)state.flags[cfg.flag]=true;}

  function showInteraction(item,i,p){const persona=personas[item.persona]||{role:'對方',name:'UNKNOWN'};const panel=$('interactionPanel');panel.className='interaction-panel'+(p.story?' story':'');$('interactionSpeaker').textContent=(item.rare||item.special)?persona.name:persona.role;if(p.story){$('interactionKicker').textContent=p.story.title;$('interactionText').textContent=p.story.beats[0];$('storyBeat').textContent=p.story.beats[1];$('storyBeat').classList.remove('hidden');}else{$('interactionKicker').textContent='RESPONSE // 對方回覆';$('interactionText').textContent=p.reply||'「好，我知道了。」';$('storyBeat').classList.add('hidden');}$('continueBtn').textContent='好吧，繼續 / CONTINUE';setTimeout(()=>panel.scrollIntoView({behavior:'smooth',block:'nearest'}),80);}

  function checkCrisis(){for(let i=0;i<4;i++){if(state.stats[i]<=0)return{index:i,side:'low'};if(state.stats[i]>=100)return{index:i,side:'high'};}return null;}
  function choose(choice,item,button,i,effective){if(state.locked)return;state.locked=true;[...$('choices').querySelectorAll('button')].forEach(x=>x.disabled=true);button.classList.add('selected');effective.forEach((v,n)=>state.stats[n]=clamp(state.stats[n]+v));if(!state.seen.includes(item.type))state.seen.push(item.type);if(choice.special)state.specialChoices++;
    traitFrom(choice,effective).forEach(t=>state.traits[t]++);applyPersona(item,effective,choice);applyEventFlag(item,i);updateStats();
    $('feedback').textContent=`${choice.note} // ${effective.map((v,n)=>v?`${labels[n]} ${v>0?'+':''}${v}`:'').filter(Boolean).join(' · ')}`;$('feedback').className='feedback';$('game').classList.add('glitch');setTimeout(()=>$('game').classList.remove('glitch'),180);if(navigator.vibrate)navigator.vibrate(18);
    const p=interactionPayload(item,i);remember(item,choice,p);persistDiscovery(item);
    const crisis=checkCrisis();if(crisis){runtime.scheduleCrisis({crisis,item,choiceIndex:i,onFinish:()=>finish(crisis)});return;}if(p.story||p.shouldReply){setTimeout(()=>showInteraction(item,i,p),260);return;}setTimeout(advanceRound,650);
  }

  function advanceRound(){hideInteraction();state.index++;updateProgress();if(state.index>=state.deck.length)finish();else renderRound();}

  function normalVerdict(){const [love,radar,standard,chaos]=state.stats;if(radar>=75&&standard>=70)return['戀愛 FBI','他甚至還沒開始說謊，妳已經發現時間線對不上。'];if(love>=75&&chaos>=70)return['紅旗收藏家','妳不是看不到警訊，妳只是常常覺得：「但他真的很有吸引力。」'];if(standard>=80)return['高標準玩家','妳不是難搞，妳只是懶得替別人的問題找理由。'];if(chaos>=75)return['混亂系女主角','妳的人生不缺故事。缺的是姐妹把手機拿走。'];if(love>=70)return['心動派玩家','妳願意相信感覺，也願意再給一次機會。'];return['清醒但會心動','妳看得到警訊，也不會完全拒絕浪漫。'];}
  function hiddenEnding(){for(const e of meta.rareEndings||[]){try{if(e.test(state))return[e.name,e.desc,`HIDDEN ENDING // ${e.id.toUpperCase()}`];}catch{}}return null;}
  function dominant(){const max=Math.max(...state.stats),i=state.stats.indexOf(max);return`${labels[i]} ${max} // ${['今晚妳最相信感覺。','今晚妳的警報器最敏銳。','今晚妳的底線最清楚。','今晚妳最容易把故事演成續集。'][i]}`;}
  function currentResult(){if(state.ending)return[state.ending.name,state.ending.description,state.ending.summary];const h=hiddenEnding();if(h)return h;const [n,d]=normalVerdict();return[n,d,dominant()];}

  function finish(crisis=null){if(crisis){const r=crisisEndings[`${crisis.index}-${crisis.side}`];state.ending={name:r[0],description:r[1],summary:r[2]};}const [n,d,s]=currentResult();$('resultKicker').textContent=state.ending?'SYSTEM COLLAPSE // EXTREME ENDING':(s.startsWith('HIDDEN')?'SECRET FILE // HIDDEN ENDING':'PLAYER FILE // TONIGHT\'S VERDICT');$('className').textContent=n;$('classDesc').textContent=d;state.stats.forEach((v,i)=>$('r'+i).textContent=v);$('summaryLine').textContent=s;$('traitResult').textContent='TRAITS // '+Object.entries(state.traits).sort((a,b)=>b[1]-a[1]).filter(x=>x[1]).slice(0,4).map(([k,v])=>`${meta.traitLabels[k]||k} ${v}`).join(' · ');$('dex').innerHTML=state.seen.map(x=>`<span>${x}</span>`).join('');$('end').classList.remove('hidden');}

  function resultText(){const [n,,s]=currentResult();return['RED FLAG DETECTOR',`RESULT: ${n}`,`LOVE ${state.stats[0]} / RADAR ${state.stats[1]} / STANDARD ${state.stats[2]} / CHAOS ${state.stats[3]}`,s,$('traitResult').textContent].join('\n');}
  async function copyResult(){let copied=false;try{await navigator.clipboard.writeText(resultText());copied=true;}catch(error){console.warn('[RED FLAG DETECTOR] Clipboard write failed:',error);}$('copyStatus').textContent=copied?'已複製結果':'複製失敗，請允許剪貼簿權限後再試';$('copyStatus').classList.remove('hidden');setTimeout(()=>$('copyStatus').classList.add('hidden'),copied?1600:2600);}

  function saveResultCard(){const c=$('resultCanvas'),ctx=c.getContext('2d'),[n,d,s]=currentResult();ctx.fillStyle='#07090b';ctx.fillRect(0,0,1080,1920);ctx.strokeStyle='#364049';ctx.lineWidth=4;ctx.strokeRect(70,70,940,1780);ctx.fillStyle='#d2b06d';ctx.font='700 54px Georgia';ctx.textAlign='center';ctx.fillText('RED FLAG DETECTOR',540,180);ctx.fillStyle='#62c7c9';ctx.font='24px monospace';ctx.fillText('RELATIONSHIP OS // BUILD 4.0',540,245);ctx.fillStyle='#efe4cc';ctx.font='700 72px serif';ctx.fillText(n,540,380);ctx.textAlign='left';ctx.fillStyle='#9b9f98';ctx.font='30px sans-serif';wrap(ctx,d,130,470,820,48);labels.forEach((lab,i)=>{const y=700+i*170;ctx.fillStyle='#8f9693';ctx.font='24px monospace';ctx.fillText(lab,130,y);ctx.fillStyle='#efe4cc';ctx.font='700 54px monospace';ctx.fillText(String(state.stats[i]),130,y+58);ctx.strokeStyle='#263038';ctx.strokeRect(360,y+10,570,34);ctx.fillStyle='#d2b06d';ctx.fillRect(360,y+10,570*state.stats[i]/100,34);});ctx.fillStyle='#d2b06d';ctx.font='27px monospace';wrap(ctx,s,130,1430,820,42);ctx.fillStyle='#9b9f98';ctx.font='24px monospace';wrap(ctx,$('traitResult').textContent,130,1540,820,38);const a=document.createElement('a');a.download='red-flag-detector-result.png';a.href=c.toDataURL('image/png');a.click();}
  function wrap(ctx,text,x,y,w,h){let line='',row=0;[...text].forEach((ch,i)=>{const test=line+ch;if(ctx.measureText(test).width>w&&line){ctx.fillText(line,x,y+row*h);line=ch;row++;}else line=test;if(i===text.length-1)ctx.fillText(line,x,y+row*h);});}

  function persistDiscovery(item){try{const d=JSON.parse(localStorage.getItem('rfd-dex')||'{"personas":{},"events":{},"rare":{}}');if(item.kind==='event')d.events[item.id]={title:item.title,type:item.type};else{d.personas[item.persona]={role:personas[item.persona]?.role||'',profile:personas[item.persona]?.profile||''};if(item.rare||item.special)d.rare[item.id]={name:personas[item.persona]?.name||'',type:item.type};}localStorage.setItem('rfd-dex',JSON.stringify(d));}catch{}}
  function renderDex(){let d={personas:{},events:{},rare:{}};try{d=JSON.parse(localStorage.getItem('rfd-dex')||JSON.stringify(d));}catch{}const people=Object.entries(d.personas),events=Object.entries(d.events),rare=Object.entries(d.rare);$('dexContent').innerHTML=`<div class="dex-group"><b>CHARACTERS ${people.length}/12</b>${people.length?people.map(([id,x])=>`<div class="dex-file"><strong>${x.role}</strong><small>${x.profile}</small></div>`).join(''):'<small>還沒有人物紀錄</small>'}</div><div class="dex-group"><b>EVENTS ${events.length}/${eventData.length}</b>${events.map(([id,x])=>`<div class="dex-file"><strong>${x.title}</strong><small>${x.type}</small></div>`).join('')}</div><div class="dex-group"><b>RARE FILES ${rare.length}/12</b>${rare.map(([id,x])=>`<div class="dex-file rare"><strong>${x.name}</strong><small>${x.type}</small></div>`).join('')}</div>`;}

  function startGame(){state.deck=buildDeck(state.rounds);state.index=0;state.stats=[50,50,50,50];state.seen=[];state.history=[];state.locked=false;state.ending=null;state.flags={};state.specialChoices=0;state.personaStats={};Object.keys(state.traits).forEach(k=>state.traits[k]=0);state.modifier=shuffle(meta.modifiers||[])[0]||{name:'普通的一晚',desc:'沒有加成',mult:[1,1,1,1]};$('modifierName').textContent=`TONIGHT MODIFIER // ${state.modifier.name}`;$('modifierDesc').textContent=state.modifier.desc;$('modifierStrip').classList.remove('hidden');$('start').classList.add('hidden');$('end').classList.add('hidden');hideInteraction();hideRecap();updateStats();updateProgress();renderRound();}
  function reset(){$('end').classList.add('hidden');$('start').classList.remove('hidden');}

  document.querySelectorAll('.mode-btn').forEach(b=>b.onclick=()=>{document.querySelectorAll('.mode-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.rounds=Number(b.dataset.rounds);state.mode=b.dataset.mode;});
  $('startBtn').onclick=startGame;$('again').onclick=reset;$('continueBtn').onclick=advanceRound;$('copyResult').onclick=copyResult;$('saveCard').onclick=saveResultCard;
  function openDex(){renderDex();$('dexOverlay').classList.remove('hidden');}$('openDex').onclick=openDex;$('openDexEnd').onclick=openDex;$('closeDex').onclick=()=>$('dexOverlay').classList.add('hidden');
  document.addEventListener('keydown',e=>{if(!$('dexOverlay').classList.contains('hidden')){if(e.key==='Escape')$('closeDex').click();return;}if(!$('start').classList.contains('hidden')||!$('end').classList.contains('hidden'))return;if(!$('interactionPanel').classList.contains('hidden')){if(e.key==='Enter'||e.key===' '){e.preventDefault();$('continueBtn').click();}return;}if(state.locked)return;const i=keys.indexOf(e.key.toLowerCase());if(i>=0){const b=$('choices').querySelector(`[data-choice="${i}"]`);if(b)b.click();}});
  updateStats();
})();
