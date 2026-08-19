(() => {
  const data = window.RED_FLAG_DATA || [];
  const eventData = window.RED_FLAG_EVENTS || [];
  const personas = window.RED_FLAG_PERSONAS || {};
  const interactions = window.RED_FLAG_INTERACTIONS || {};
  const flavor = window.RED_FLAG_FLAVOR || {};
  const labels = ['LOVE', 'RADAR', 'STANDARD', 'CHAOS'];
  const keyMap = { a: 0, b: 1, c: 2 };

  const crisisEndings = {
    '0-low': ['心已關機', 'LOVE 歸零。妳把所有可能性都先判成不值得，安全到連心動也一起被封鎖。', 'LOVE 0 // CONNECTION LOST'],
    '0-high': ['戀愛腦全面接管', 'LOVE 爆滿。妳已經開始替還沒發生的婚禮想歌單，現實暫時沒有登入權限。', 'LOVE 100 // HEART OVERRIDE'],
    '1-low': ['警報器拔電池', 'RADAR 歸零。線索從妳面前排隊走過，妳還在說：「應該只是巧合吧？」', 'RADAR 0 // NO SIGNAL'],
    '1-high': ['全員列入觀察名單', 'RADAR 爆滿。已讀時間差、限動觀看順序、語氣變化全部進入鑑識程序，沒有人能自然呼吸。', 'RADAR 100 // PARANOIA MODE'],
    '2-low': ['底線已解除安裝', 'STANDARD 歸零。規則一路往後退，最後只剩「至少他還會回訊息」。', 'STANDARD 0 // BOUNDARY FAILURE'],
    '2-high': ['無人通過審核', 'STANDARD 爆滿。不是沒有人來，是所有人都在第一輪資格審查被刷掉。', 'STANDARD 100 // ACCESS DENIED'],
    '3-low': ['人生進入飛航模式', 'CHAOS 歸零。妳成功避開所有風險，也順便把所有可能長出故事的入口一起關掉。', 'CHAOS 0 // ZERO DRAMA'],
    '3-high': ['劇情已經失控', 'CHAOS 爆滿。姐妹群組 99+、前任復活、凌晨訊息、臨時約會同時發生。這不是感情，是季度大結局。', 'CHAOS 100 // SEASON FINALE']
  };

  const looks = {
    P01:{hair:1,glasses:false,beard:false,earring:true,shirt:0},
    P02:{hair:2,glasses:true,beard:false,earring:false,shirt:1},
    P03:{hair:4,glasses:false,beard:false,earring:true,shirt:2},
    P04:{hair:0,glasses:false,beard:true,earring:false,shirt:3},
    P05:{hair:3,glasses:true,beard:false,earring:false,shirt:4},
    P06:{hair:5,glasses:false,beard:true,earring:true,shirt:0},
    P07:{hair:6,glasses:false,beard:false,earring:false,shirt:1},
    P08:{hair:2,glasses:false,beard:true,earring:false,shirt:2},
    P09:{hair:4,glasses:true,beard:false,earring:true,shirt:3},
    P10:{hair:1,glasses:true,beard:true,earring:false,shirt:4},
    P11:{hair:3,glasses:false,beard:false,earring:true,shirt:1},
    P12:{hair:6,glasses:false,beard:true,earring:true,shirt:2}
  };

  const state = {
    deck: [], index: 0, stats: [50,50,50,50], seen: [], history: [], locked: false,
    rounds: 15, mode: 'FULL SCAN', ending: null
  };

  const $ = id => document.getElementById(id);
  const clamp = value => Math.max(0, Math.min(100, value));

  function shuffle(items){
    const copy=[...items];
    for(let i=copy.length-1;i>0;i-=1){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  }

  function hash(text){return [...String(text)].reduce((n,ch)=>((n<<5)-n+ch.charCodeAt(0))|0,0)>>>0;}

  function buildDeck(rounds){
    const eventCount = rounds >= 15 ? 2 : 1;
    const coreRounds = Math.max(1, rounds - eventCount);
    const rare = data.filter(item=>item.rare);
    const singles = data.filter(item=>!item.rare&&!item.arc);
    const arcMap = new Map();
    data.filter(item=>item.arc).forEach(item=>{if(!arcMap.has(item.arc))arcMap.set(item.arc,[]);arcMap.get(item.arc).push(item);});
    [...arcMap.values()].forEach(items=>items.sort((a,b)=>a.stage-b.stage));

    const useArc = Math.random() < (rounds >= 15 ? .88 : .65);
    const useRare = Math.random() < (rounds >= 15 ? .22 : .16);
    let deck=[];

    if(useArc&&arcMap.size){
      const arc=shuffle([...arcMap.values()])[0];
      const fillerCount=coreRounds-arc.length-(useRare?1:0);
      deck=shuffle(singles).slice(0,Math.max(0,fillerCount));
      const positions=rounds>=15?[1,Math.floor(coreRounds/2),Math.max(2,coreRounds-2)]:[1,3,5];
      arc.forEach((item,i)=>deck.splice(Math.min(positions[i]??deck.length,deck.length),0,item));
    }else{
      deck=shuffle(singles).slice(0,coreRounds-(useRare?1:0));
    }

    if(useRare&&rare.length){
      const event=shuffle(rare)[0];
      const min=Math.min(2,deck.length);const max=Math.max(min,deck.length-1);
      const position=min+Math.floor(Math.random()*(max-min+1));deck.splice(position,0,event);
    }

    if(deck.length<coreRounds){
      const used=new Set(deck.map(item=>item.id));
      deck.push(...shuffle(singles.filter(item=>!used.has(item.id))).slice(0,coreRounds-deck.length));
    }
    deck=deck.slice(0,coreRounds);

    const events=shuffle(eventData).slice(0,eventCount);
    events.forEach((event,i)=>{
      const min=Math.min(1+i,deck.length);
      const max=Math.max(min,deck.length-1);
      const position=min+Math.floor(Math.random()*(max-min+1));
      deck.splice(position,0,event);
    });
    return deck.slice(0,rounds);
  }

  function updateStats(){
    const statNodes=[...document.querySelectorAll('.stat')];
    state.stats.forEach((value,i)=>{
      $('s'+i).style.width=value+'%';
      const node=statNodes[i];
      if(node){node.classList.toggle('critical-low',value<=15);node.classList.toggle('critical-high',value>=85);}
    });
  }

  function updateProgress(){const percent=state.deck.length?(state.index/state.deck.length)*100:0;$('progressFill').style.width=percent+'%';}

  function paletteFor(seed){
    const palettes=[
      ['#0c1419','#17313a','#d7b07f','#2a1e18','#202c34','#d2b06d'],
      ['#160e14','#3a1c28','#c98e73','#141012','#352638','#62c7c9'],
      ['#0d1510','#24402f','#a96e5f','#16100e','#283126','#d2b06d'],
      ['#16120d','#43351f','#e0a986','#3a2417','#232323','#e05a67'],
      ['#101018','#24264c','#b87968','#09090b','#272132','#81bc8e']
    ];
    return palettes[seed%palettes.length];
  }

  function drawPerson(personaId,type){
    const canvas=$('portrait');const ctx=canvas.getContext('2d');const seed=hash(personaId)%97;const look=looks[personaId]||{hair:seed%7,glasses:false,beard:false,earring:false,shirt:seed%5};const p=paletteFor(seed);
    ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle=p[0];ctx.fillRect(0,0,224,154);
    for(let i=0;i<34;i+=1){ctx.fillStyle=i%2?p[1]:'#0b0e11';ctx.fillRect((i*37+seed*13)%224,(i*19+seed*7)%154,4,4);}
    ctx.fillStyle=p[1];ctx.fillRect(18,18,188,118);ctx.fillStyle='#0b0d10';ctx.fillRect(26,26,172,102);
    ctx.fillStyle=p[(look.shirt%2)?4:1];ctx.fillRect(64,103,96,28);ctx.fillRect(76,96,72,14);
    ctx.fillStyle=p[2];ctx.fillRect(90,44,44,60);ctx.fillRect(101,95,22,18);

    ctx.fillStyle=p[3];
    if(look.hair===0){ctx.fillRect(84,36,56,18);ctx.fillRect(86,43,8,36);ctx.fillRect(132,43,8,38);}
    if(look.hair===1){ctx.fillRect(83,35,58,14);ctx.fillRect(84,44,17,20);ctx.fillRect(126,44,15,22);ctx.fillRect(104,39,18,8);}
    if(look.hair===2){ctx.fillRect(88,38,48,10);ctx.fillRect(86,46,6,20);ctx.fillRect(134,46,6,20);}
    if(look.hair===3){ctx.fillRect(82,34,60,16);ctx.fillRect(82,44,10,48);ctx.fillRect(134,44,10,48);}
    if(look.hair===4){for(let x=84;x<=136;x+=10){ctx.fillRect(x,34+((x/10)%2)*4,10,12);}ctx.fillRect(82,46,9,28);ctx.fillRect(136,46,9,28);}
    if(look.hair===5){ctx.fillRect(82,35,62,12);ctx.fillRect(92,29,42,8);ctx.fillRect(136,43,8,32);}
    if(look.hair===6){ctx.fillRect(82,36,62,12);ctx.fillRect(84,43,32,10);ctx.fillRect(128,42,12,38);}

    ctx.fillStyle='#0a0b0c';ctx.fillRect(98,66,6,6);ctx.fillRect(121,66,6,6);ctx.fillRect(108,84,12,4);
    if(look.glasses){ctx.fillStyle='#d7d7d7';ctx.fillRect(91,62,18,4);ctx.fillRect(119,62,18,4);ctx.fillRect(109,64,10,3);ctx.fillRect(91,66,4,9);ctx.fillRect(133,66,4,9);}
    if(look.beard){ctx.fillStyle=p[3];ctx.fillRect(99,87,29,7);ctx.fillRect(104,94,20,5);}
    if(look.earring){ctx.fillStyle=p[5];ctx.fillRect(86,73,4,8);}
    if(type.includes('前任')||personaId==='P06'){ctx.fillStyle='#b5424d';ctx.fillRect(160,34,22,6);ctx.fillRect(168,26,6,22);}
    if(personaId==='P09'){ctx.fillStyle=p[5];ctx.fillRect(154,104,18,24);ctx.fillStyle='#0b0d10';ctx.fillRect(158,108,10,15);}
    if(personaId==='P10'){ctx.fillStyle=p[5];ctx.fillRect(50,108,22,16);ctx.fillStyle='#0b0d10';ctx.fillRect(54,112,14,3);ctx.fillRect(54,118,9,3);}
  }

  function drawEvent(item){
    const canvas=$('portrait');const ctx=canvas.getContext('2d');const seed=hash(item.id);const p=paletteFor(seed%97);ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,224,154);
    ctx.fillStyle='#090d10';ctx.fillRect(0,0,224,154);ctx.fillStyle=p[1];ctx.fillRect(18,18,188,118);ctx.fillStyle='#0b0f12';ctx.fillRect(28,28,168,98);
    for(let i=0;i<24;i+=1){ctx.fillStyle=i%3===0?p[5]:'#1c2930';ctx.fillRect((seed+i*29)%190+12,(seed+i*17)%120+12,4,4);}
    const icon=seed%6;ctx.fillStyle=p[5];
    if(icon===0){ctx.fillRect(72,48,80,54);ctx.fillStyle='#0b0f12';ctx.fillRect(80,56,64,6);ctx.fillRect(80,70,52,6);ctx.fillRect(80,84,36,6);}
    if(icon===1){ctx.fillRect(92,38,40,78);ctx.fillStyle='#0b0f12';ctx.fillRect(98,46,28,54);ctx.fillRect(106,105,12,5);}
    if(icon===2){ctx.fillRect(64,50,96,58);ctx.fillStyle='#0b0f12';ctx.fillRect(72,58,80,42);ctx.fillStyle=p[5];ctx.fillRect(72,58,40,4);ctx.fillRect(112,62,40,4);}
    if(icon===3){ctx.fillRect(100,36,24,24);ctx.fillRect(96,66,32,8);ctx.fillRect(88,80,48,8);ctx.fillRect(80,94,64,8);}
    if(icon===4){ctx.fillRect(105,42,14,54);ctx.fillRect(105,104,14,14);}
    if(icon===5){ctx.fillRect(68,58,76,38);ctx.fillRect(146,68,10,18);ctx.fillStyle='#0b0f12';ctx.fillRect(76,66,52,22);}
    ctx.fillStyle='#8d928f';ctx.font='8px monospace';ctx.fillText('SYSTEM EVENT // '+item.id,62,122);
  }

  function setBadge(item){
    const badge=$('eventBadge');badge.className='event-badge hidden';badge.textContent='';
    if(item.kind==='event'){badge.textContent='◆ EVENT CARD';badge.className='event-badge system-event';}
    else if(item.rare){badge.textContent='⚠ RARE FILE';badge.className='event-badge';}
    else if(item.arc){const rows=['CASE OPENED 1/3','CASE CONTINUES 2/3','CASE FINALE 3/3'];badge.textContent=rows[(item.stage||1)-1]||`CASE ${item.stage}/3`;badge.className='event-badge arc';}
  }

  function displayIdentity(item,persona){
    if(item.kind==='event')return{eyebrow:`SYSTEM EVENT // ${item.type}`,main:item.title,aria:`事件卡：${item.title}。${item.quote}`};
    const named=Boolean(item.rare||item.special);return{eyebrow:named?`SPECIAL CHARACTER // ${item.type}`:item.type,main:named?persona.name:persona.role,aria:named?`${persona.name}，${persona.role}：${persona.profile}`:`${persona.role}：${persona.profile}`};
  }

  function hideInteraction(){$('interactionPanel').className='interaction-panel hidden';$('interactionText').textContent='';$('storyBeat').textContent='';$('storyBeat').classList.add('hidden');}
  function hideRecap(){$('recapPanel').classList.add('hidden');$('recapTitle').textContent='';$('recapList').innerHTML='';}
  function shorten(text,max=64){const clean=String(text||'').replace(/\s+/g,' ').trim();return clean.length>max?clean.slice(0,max-1)+'…':clean;}

  function renderRecap(item,persona){
    hideRecap();if(item.kind==='event'||!item.arc||!item.stage||item.stage<=1)return;
    const previous=state.history.filter(entry=>entry.arc===item.arc&&entry.stage<item.stage).slice(-2);if(!previous.length)return;
    $('recapTitle').textContent=`${persona.role} · 這條線妳之前已經遇過 ${previous.length} 次`;const list=$('recapList');
    previous.forEach((entry,index)=>{
      const block=document.createElement('div');block.className='recap-entry';const eventLine=document.createElement('div');const eventLabel=document.createElement('b');eventLabel.textContent=previous.length>1?`前情 ${index+1}｜`:'上次｜';eventLine.appendChild(eventLabel);eventLine.appendChild(document.createTextNode(shorten(entry.quote,72)));block.appendChild(eventLine);
      const choiceLine=document.createElement('div');choiceLine.className='recap-choice';choiceLine.textContent=`妳選：「${shorten(entry.choice,45)}」`;block.appendChild(choiceLine);
      if(entry.response){const r=document.createElement('div');r.className='recap-response';r.textContent=`對方：${shorten(entry.response,62)}`;block.appendChild(r);}if(entry.consequence){const c=document.createElement('div');c.className='recap-response';c.textContent=`→ ${shorten(entry.consequence,68)}`;block.appendChild(c);}list.appendChild(block);
    });$('recapPanel').classList.remove('hidden');
  }

  function getOptions(item){if(item.kind==='event')return item.options||[];if(typeof interactions.contextualOptions==='function')return interactions.contextualOptions(item);return item.options||[];}

  function renderRound(){
    const item=state.deck[state.index];if(!item)return;const persona=personas[item.persona]||{name:'UNKNOWN',role:'關係未定義',profile:''};const identity=displayIdentity(item,persona);state.locked=false;hideInteraction();renderRecap(item,persona);
    $('feedback').className='feedback hidden';$('feedback').textContent='';$('target').textContent=(item.kind==='event'?'EVENT #':'TARGET #')+String(state.index+1).padStart(2,'0');$('count').textContent=String(state.index+1).padStart(2,'0')+' / '+state.deck.length;
    $('dramaHook').textContent=typeof flavor.hookFor==='function'?flavor.hookFor(item):'';$('role').textContent=identity.eyebrow;$('who').textContent=identity.main;$('quote').textContent=item.quote;$('dialog').className='dialog'+(item.special||item.rare?' special':'')+(item.kind==='event'?' event-dialog':'');$('modeLabel').textContent=state.mode;$('portrait').setAttribute('aria-label',identity.aria);
    $('portraitWrap').className='portrait-wrap'+(item.kind==='event'?' event-visual':'');if(item.kind==='event')drawEvent(item);else drawPerson(item.persona,item.type);setBadge(item);
    const choices=$('choices');choices.classList.remove('hidden');choices.innerHTML='';getOptions(item).forEach((choice,i)=>{const button=document.createElement('button');button.type='button';button.dataset.choice=String(i);button.innerHTML=`<b>${['A','B','C'][i]}｜${choice.text}</b><small>${choice.note}</small>`;button.addEventListener('click',()=>choose(choice,item,button,i));choices.appendChild(button);});updateProgress();
  }

  function deltaSummary(delta){return delta.map((value,i)=>({value,label:labels[i]})).filter(x=>x.value!==0).map(x=>`${x.label} ${x.value>0?'+':''}${x.value}`).join(' · ');}
  function continueLabel(choiceIndex,hasStory){if(hasStory)return['好吧，繼續看','知道了，下一段','嗯，繼續'][choiceIndex]||'繼續';return['好吧，下一題','知道了，繼續','嗯，下一題'][choiceIndex]||'下一題';}

  function interactionPayload(item,choiceIndex){
    if(item.kind==='event')return{shouldReply:false,story:null,reply:'',consequence:''};
    const shouldReply=typeof interactions.shouldReply==='function'&&interactions.shouldReply(item);const story=typeof interactions.storyFor==='function'?interactions.storyFor(item,choiceIndex):null;const reply=story?story.beats[0]:shouldReply&&typeof interactions.characterReply==='function'?interactions.characterReply(item,choiceIndex):'';return{shouldReply,story,reply,consequence:story?story.beats[1]:''};
  }

  function rememberChoice(item,choice,payload){state.history.push({id:item.id,persona:item.persona||null,arc:item.arc||null,stage:item.stage||null,quote:item.quote,choice:choice.text,response:payload.reply,consequence:payload.consequence});}

  function showInteraction(item,choiceIndex,payload=null){
    const persona=personas[item.persona]||{name:'UNKNOWN',role:'對方'};const resolved=payload||interactionPayload(item,choiceIndex);const story=resolved.story;const panel=$('interactionPanel');const named=Boolean(item.rare||item.special);const speaker=named?persona.name:persona.role;panel.className='interaction-panel'+(story?' story':'');$('interactionSpeaker').textContent=speaker;
    if(story){$('interactionKicker').textContent=story.title;$('interactionText').textContent=story.beats[0];$('storyBeat').textContent=story.beats[1];$('storyBeat').classList.remove('hidden');$('continueBtn').textContent=continueLabel(choiceIndex,true);}else{$('interactionKicker').textContent='RESPONSE // 對方回覆';$('interactionText').textContent=resolved.reply||'「好，我知道了。」';$('storyBeat').classList.add('hidden');$('continueBtn').textContent=continueLabel(choiceIndex,false);}window.setTimeout(()=>panel.scrollIntoView({behavior:'smooth',block:'nearest'}),80);
  }

  function checkCrisis(){
    for(let i=0;i<state.stats.length;i+=1){if(state.stats[i]<=0)return{index:i,side:'low',value:0};if(state.stats[i]>=100)return{index:i,side:'high',value:100};}return null;
  }

  function advanceRound(){hideInteraction();state.index+=1;updateProgress();if(state.index>=state.deck.length)finish();else renderRound();}

  function choose(choice,item,selectedButton,choiceIndex){
    if(state.locked)return;state.locked=true;[...$('choices').querySelectorAll('button')].forEach(button=>{button.disabled=true;});selectedButton.classList.add('selected');choice.delta.forEach((value,i)=>{state.stats[i]=clamp(state.stats[i]+value);});if(!state.seen.includes(item.type))state.seen.push(item.type);updateStats();
    const feedback=$('feedback');feedback.textContent=`${choice.note} // ${deltaSummary(choice.delta)}`;feedback.className='feedback';$('game').classList.add('glitch');window.setTimeout(()=>$('game').classList.remove('glitch'),180);if(navigator.vibrate)navigator.vibrate(18);
    const payload=interactionPayload(item,choiceIndex);rememberChoice(item,choice,payload);
    const crisis=checkCrisis();if(crisis){window.setTimeout(()=>finish(crisis),520);return;}
    if(payload.story||payload.shouldReply){window.setTimeout(()=>showInteraction(item,choiceIndex,payload),260);return;}window.setTimeout(advanceRound,680);
  }

  function verdict(){const [love,radar,standard,chaos]=state.stats;if(radar>=75&&standard>=70)return['戀愛 FBI','他甚至還沒開始說謊，妳已經發現時間線對不上。雷達很強，底線也在線。'];if(love>=75&&chaos>=70)return['紅旗收藏家','妳不是看不到警訊，妳只是常常覺得：「但他真的很有吸引力。」'];if(standard>=80)return['高標準玩家','妳不是難搞，妳只是懶得替別人的問題找理由。'];if(chaos>=75)return['混亂系女主角','妳的人生不缺故事。缺的是姐妹把手機拿走。'];if(love>=70)return['心動派玩家','妳願意相信感覺，也願意再給一次機會。記得讓雷達一起上線。'];return['清醒但會心動','妳看得到警訊，也不會完全拒絕浪漫。危險程度：可控。'];}

  function dominantTrait(){const max=Math.max(...state.stats);const index=state.stats.indexOf(max);const messages=['今晚妳最相信感覺。','今晚妳的警報器最敏銳。','今晚妳的底線最清楚。','今晚妳最容易把故事演成續集。'];return`${labels[index]} ${max} // ${messages[index]}`;}

  function currentResult(){if(state.ending)return[state.ending.name,state.ending.description,state.ending.summary];const [name,description]=verdict();return[name,description,dominantTrait()];}

  function finish(crisis=null){
    if(crisis){const row=crisisEndings[`${crisis.index}-${crisis.side}`];state.ending={name:row[0],description:row[1],summary:row[2]};}
    const [name,description,summary]=currentResult();$('resultKicker').textContent=state.ending?'SYSTEM COLLAPSE // EXTREME ENDING':'PLAYER FILE // TONIGHT\'S VERDICT';$('resultTerminal').classList.toggle('crisis',Boolean(state.ending));$('className').textContent=name;$('classDesc').textContent=description;state.stats.forEach((value,i)=>{$('r'+i).textContent=value;});$('summaryLine').textContent=summary;$('dex').innerHTML=state.seen.map(type=>`<span>${type}</span>`).join('');$('progressFill').style.width=state.ending?(state.index/state.deck.length)*100+'%':'100%';$('end').classList.remove('hidden');
  }

  function resultText(){const [name,,summary]=currentResult();return['RED FLAG DETECTOR',`RESULT: ${name}`,`LOVE ${state.stats[0]} / RADAR ${state.stats[1]} / STANDARD ${state.stats[2]} / CHAOS ${state.stats[3]}`,summary,`DETECTED: ${state.seen.join('、')}`].join('\n');}
  async function copyResult(){const text=resultText();try{await navigator.clipboard.writeText(text);}catch{const area=document.createElement('textarea');area.value=text;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();}$('copyStatus').textContent='已複製結果';$('copyStatus').classList.remove('hidden');window.setTimeout(()=>$('copyStatus').classList.add('hidden'),1600);}

  function wrapText(ctx,text,x,y,maxWidth,lineHeight){const chars=[...text];let line='';let row=0;chars.forEach((ch,i)=>{const test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y+row*lineHeight);line=ch;row+=1;}else line=test;if(i===chars.length-1)ctx.fillText(line,x,y+row*lineHeight);});return y+(row+1)*lineHeight;}

  function saveResultCard(){
    const canvas=$('resultCanvas');const ctx=canvas.getContext('2d');const [name,description,summary]=currentResult();ctx.fillStyle='#07090b';ctx.fillRect(0,0,1080,1920);ctx.strokeStyle='#364049';ctx.lineWidth=4;ctx.strokeRect(70,70,940,1780);ctx.fillStyle='#d2b06d';ctx.font='700 54px Georgia';ctx.textAlign='center';ctx.fillText('RED FLAG DETECTOR',540,180);ctx.fillStyle=state.ending?'#e05a67':'#62c7c9';ctx.font='24px monospace';ctx.fillText(state.ending?'SYSTEM COLLAPSE // EXTREME ENDING':'PLAYER FILE // TONIGHT’S VERDICT',540,245);ctx.fillStyle='#efe4cc';ctx.font='700 76px serif';ctx.fillText(name,540,390);ctx.textAlign='left';ctx.fillStyle='#9b9f98';ctx.font='30px sans-serif';let y=wrapText(ctx,description,130,480,820,48)+75;labels.forEach((label,i)=>{ctx.fillStyle='#8f9693';ctx.font='24px monospace';ctx.fillText(label,130,y);ctx.fillStyle='#efe4cc';ctx.font='700 54px monospace';ctx.fillText(String(state.stats[i]),130,y+60);ctx.strokeStyle='#263038';ctx.strokeRect(360,y+12,570,34);ctx.fillStyle='#d2b06d';ctx.fillRect(360,y+12,570*(state.stats[i]/100),34);y+=165;});ctx.fillStyle='#d2b06d';ctx.font='28px monospace';wrapText(ctx,summary,130,y+30,820,44);ctx.fillStyle='#666d6b';ctx.font='22px monospace';ctx.fillText('RELATIONSHIP LAB // BUILD 3.5',130,1760);const link=document.createElement('a');link.download='red-flag-detector-result.png';link.href=canvas.toDataURL('image/png');link.click();$('copyStatus').textContent='結果卡已產生';$('copyStatus').classList.remove('hidden');window.setTimeout(()=>$('copyStatus').classList.add('hidden'),1600);
  }

  function startGame(){state.deck=buildDeck(state.rounds);state.index=0;state.stats=[50,50,50,50];state.seen=[];state.history=[];state.locked=false;state.ending=null;hideInteraction();hideRecap();updateStats();updateProgress();$('resultTerminal').classList.remove('crisis');$('end').classList.add('hidden');$('start').classList.add('hidden');renderRound();}
  function resetToStart(){hideInteraction();hideRecap();$('end').classList.add('hidden');$('start').classList.remove('hidden');$('copyStatus').classList.add('hidden');}

  document.querySelectorAll('.mode-btn').forEach(button=>{button.addEventListener('click',()=>{document.querySelectorAll('.mode-btn').forEach(item=>item.classList.remove('active'));button.classList.add('active');state.rounds=Number(button.dataset.rounds);state.mode=button.dataset.mode;});});
  $('startBtn').addEventListener('click',startGame);$('again').addEventListener('click',resetToStart);$('copyResult').addEventListener('click',copyResult);$('saveCard').addEventListener('click',saveResultCard);$('continueBtn').addEventListener('click',advanceRound);
  document.addEventListener('keydown',event=>{if(!$('start').classList.contains('hidden')||!$('end').classList.contains('hidden'))return;if(!$('interactionPanel').classList.contains('hidden')){if(event.key==='Enter'||event.key===' '){event.preventDefault();$('continueBtn').click();}return;}if(state.locked)return;const index=keyMap[event.key.toLowerCase()];if(index===undefined)return;const button=$('choices').querySelector(`[data-choice="${index}"]`);if(button)button.click();});
  updateStats();
})();
