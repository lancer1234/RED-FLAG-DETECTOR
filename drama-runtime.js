(() => {
  const $=id=>document.getElementById(id);
  const allItems=()=>[...(window.RED_FLAG_DATA||[]),...(window.RED_FLAG_EVENTS||[])];
  const quoteMap=()=>new Map(allItems().map(item=>[String(item.quote||'').trim(),item]));

  let map=quoteMap();
  let lastRound=0;
  let currentKey='';
  let pending=[];
  let bossHandled='';
  let counters={soft:0,detective:0,chaos:0,boundary:0,action:0};
  let unlocked=new Set();

  const callbackRules={
    'P01-01':{after:3,branches:[
      '妳上次把「權利和責任要一起」講明後，他這次沒有直接要求，只先問妳今晚跟誰出去。',
      '上次妳逼他定義「到底想要什麼」，那句話之後他明顯更少用「不知道」帶過。',
      '妳當時先接受灰區。幾題之後，名分還沒出現，但吃醋功能運作正常。']},
    'P04-02':{after:3,branches:[
      '妳拒絕定位後，他沒有再提定位；真正要看的，是他會不會改用別的方法查勤。',
      '妳把安全感和監控拆開談後，這件事暫時沒再出現。',
      '妳當時覺得開定位沒差。後來每次晚回訊息，妳都開始想到那個小藍點。']},
    'P05-08':{after:2,branches:[
      '兩天後，他還是照固定節奏回訊息，重要事情也沒有漏掉。這次警報可能真的只是工作忙。',
      '妳沒有加碼測試，他也沒有突然變冷。沒有反轉，反而就是這條線的反轉。',
      '妳當時有點不安，但後續沒有新的可疑證據。RADAR 暫時可以休息一下。']},
    'P06-07':{after:2,branches:[
      '妳沒有接酒後訊息。隔天白天，他也沒有補一句。酒精退場後，勇氣一起下線。',
      '妳問他清醒時到底想說什麼。隔天中午才收到一句：「昨天喝多了。」',
      '妳回了之後，那晚聊到很晚。第二天，他又恢復原本幾乎不聯絡的狀態。']},
    'P09-01':{after:3,branches:[
      '妳後來不再盯綠燈，只看他有沒有真的出現。結果：約會照常，限動也照發十四則。',
      '妳把問題直接問過，他的回覆速度沒變，但開始會說「今天很累晚點回」。',
      '妳降低投入後，他反而主動約了一次。社群熱度跟現實投入果然不是同一條線。']},
    'P12-04':{after:2,branches:[
      '那家「一定要帶妳去」的店最後真的客滿。浪漫宣言沒有自動生成訂位。',
      '妳上次要求時間、地址、訂位資訊後，他第一次真的把安排補齊。',
      '妳當時先相信他的隨性。當晚你們最後在便利商店吃關東煮，也算有一種浪漫。']}
  };

  const eventTwists={
    W02:[
      ['NEW EVIDENCE // 帳號最後觀看紀錄：8 個月前','他打開家庭管理頁，前任那個帳號早就沒有使用，只是一直沒移除。可疑，不等於有鬼。'],
      ['NEW EVIDENCE // 他自己也忘了','他看了一眼：「靠，這個我真的忘記刪。」然後當場移除。'],
      ['NEW EVIDENCE // 最尷尬的是沒有劇情','他打開紀錄，帳號根本八個月沒上線。妳剛剛那句吐槽只能自己吞回去。']
    ],
    W03:[
      ['PLOT TWIST // 牙刷主人：他妹妹','他愣了一下：「我妹上週住這裡啦。」接著直接翻出家庭群組照片。警報解除，但心跳沒有立刻恢復。'],
      ['PLOT TWIST // 浴室偵查提前結案','妳還沒找到第二個線索，他先說：「那支是我妹的，妳是不是以為很精彩？」'],
      ['PLOT TWIST // 妳問得太直接，答案也很直接','他：「我妹的。妳要不要現在打給她？」本局最戲劇性的部分突然消失。']
    ],
    W04:[
      ['NEW EVIDENCE // 他把通知打開了','訊息其實來自家人群組，媽媽習慣叫全家「寶貝」。妳的心跳先爆表，證據才慢慢跟上。'],
      ['NEW EVIDENCE // 寶貝不是妳想的那種寶貝','他直接點開聊天，是他媽問妹妹到了沒，訊息傳錯人。'],
      ['NEW EVIDENCE // 他主動把手機轉過來','妳還沒問，他已經笑著說：「我媽啦，她傳錯。」假警報正式解除。']
    ],
    W07:[
      ['RUMOR UPDATE // 被追是真的，他有沒有接球是另一題','後來妳才知道那個人確實在追他，但他沒有私下約，也有明確說自己正在認識別人。'],
      ['RUMOR UPDATE // 本人知道','他說：「我知道，但我沒有要發展。」傳言終於從朋友口中回到當事人。'],
      ['RUMOR UPDATE // IG 研究沒有提供答案','妳看完對方 47 則貼文，仍然不知道他本人到底怎麼想。']
    ],
    W10:[
      ['CALLBACK // 原因現在才出現','他補了一句：「我爸剛送急診，我前面真的不知道怎麼講。」原本的火氣突然必須重新排序。'],
      ['CALLBACK // 界線和體諒可以一起存在','原因確實是家裡突發狀況。妳可以理解，也還是可以希望他更早說。'],
      ['PLOT TWIST // 今晚沒有浪費','姐妹十分鐘後回：「出來，我們去喝酒。」取消約會直接變成另一條劇情線。']
    ]
  };

  const bossFollowups={
    B01:{prompt:'第二段｜他追問：「所以如果我現在還不想叫男女朋友，妳會走嗎？」',options:[
      ['我不逼你今天取名字，但我不會無限等','他第一次聽到「時間也算界線」。'],
      ['我會看你的行動，不只看名稱','這條線暫時從文字題變成行動題。'],
      ['不知道，先試了再說','灰區還在，但這次是妳主動選擇留下。']]},
    B02:{prompt:'第二段｜Kevin 說：「那妳要怎樣才覺得我有安全感但不是控制？」',options:[
      ['不安可以說，但不要變成我要交權限','需求和控制第一次被分開。'],
      ['我們可以約定失聯多久要說，但不是隨時查','規則變得具體，也比較對等。'],
      ['先不要訂規則，我想看你下次怎麼做','下一次行為會比今晚的道歉更重要。']]},
    B03:{prompt:'第二段｜阿凱看著拍立得問：「這張妳還要嗎？」',options:[
      ['不要，你留或丟都可以','回憶第一次沒有被當成任務帶走。'],
      ['我要照片，但不是要關係','把物品和復合拆成兩件事。'],
      ['給我吧','照片進了包包，支線沒有結束，只是暫停。']]},
    B04:{prompt:'第二段｜Ryan 問：「妳不喜歡我發嗎？」',options:[
      ['不是不喜歡，是我不想靠限動猜關係','社群訊號被迫回到現實語言。'],
      ['我喜歡，但我更想聽你本人說','白色愛心終於不能代替完整句子。'],
      ['我其實滿爽的','至少這一次，妳很誠實。']]},
    B05:{prompt:'第二段｜Nick：「所以我現在及格幾分？」',options:[
      ['一次 70，三次再升等','Nick 的信用評分系統正式上線。'],
      ['今天 100，歷史紀錄另計','今天真的做到了，但資料庫沒有清空。'],
      ['不要問分數，繼續做就對了','這句讓他安靜了三秒，罕見事件。']]},
    B06:{prompt:'第二段｜宇衡問：「妳希望我旅行時多久聯絡一次？」',options:[
      ['想到就傳，不要變打卡','聯絡保留溫度，但不變成出勤紀錄。'],
      ['一天一個平安就好','需求被說成一個很簡單的規則。'],
      ['不用規定，我想試試看完全信任','這次安全感的測試對象變成妳自己。']]},
    B07:{prompt:'第二段｜Eason：「那我們今天開始算排他嗎？」',options:[
      ['算，但界線今天就講完','狀態改變和規則同一天上線。'],
      ['給我一天，我不想因為氣氛直接答應','升溫沒有取消思考時間。'],
      ['算，我也不想再約別人了','這次答案很短，關係狀態很清楚。']]},
    B08:{prompt:'第二段｜Leo：「那我到底怎樣靠近妳最舒服？」',options:[
      ['先問，不要先宣布你要來','熱情第一次有了詢問鍵。'],
      ['提前約，我會更期待','衝動被換成期待，濃度沒有降低。'],
      ['偶爾衝一次可以，但我要有拒絕權','這條線找到了一個比較像你們的節奏。']]}
  };

  function currentItem(){
    const quote=String($('quote')?.textContent||'').trim();
    if(!quote)return null;
    if(!map.has(quote)) map=quoteMap();
    return map.get(quote)||null;
  }
  function roundInfo(){
    const m=String($('count')?.textContent||'').match(/(\d+)\s*\/\s*(\d+)/);
    return m?{round:Number(m[1]),total:Number(m[2])}:{round:0,total:15};
  }
  function resetRun(){pending=[];bossHandled='';counters={soft:0,detective:0,chaos:0,boundary:0,action:0};unlocked=new Set();document.querySelectorAll('.drama-inline').forEach(x=>x.remove());}

  function toast(kicker,title,text=''){
    let stack=document.querySelector('.drama-toast-stack');
    if(!stack){stack=document.createElement('div');stack.className='drama-toast-stack';document.body.appendChild(stack);}
    const node=document.createElement('div');node.className='drama-toast';node.innerHTML=`<small>${kicker}</small><b>${title}</b>${text?`<span>${text}</span>`:''}`;stack.appendChild(node);
    requestAnimationFrame(()=>node.classList.add('show'));
    setTimeout(()=>{node.classList.remove('show');setTimeout(()=>node.remove(),250);},3200);
  }

  function showCallback(text){
    document.querySelectorAll('.callback-panel').forEach(x=>x.remove());
    const dialog=$('dialog');if(!dialog)return;
    const node=document.createElement('section');node.className='callback-panel drama-inline';
    node.innerHTML=`<div class="callback-kicker">CALLBACK // 之前的選擇回來了</div><div>${text}</div>`;
    dialog.parentNode.insertBefore(node,dialog);
  }

  function showInterlude(kicker,title,text){
    let box=$('dramaInterlude');
    if(!box){box=document.createElement('section');box.id='dramaInterlude';box.className='drama-interlude hidden';box.innerHTML='<div class="drama-interlude-card"><small id="dramaInterludeKicker"></small><h2 id="dramaInterludeTitle"></h2><p id="dramaInterludeText"></p><button type="button" id="dramaInterludeContinue">好，繼續 / CONTINUE</button></div>';document.body.appendChild(box);$('dramaInterludeContinue').onclick=()=>box.classList.add('hidden');}
    $('dramaInterludeKicker').textContent=kicker;$('dramaInterludeTitle').textContent=title;$('dramaInterludeText').textContent=text;box.classList.remove('hidden');
  }

  function scheduleCallback(item,index,round){
    const rule=callbackRules[item.id];if(!rule)return;
    pending=pending.filter(x=>x.id!==item.id);
    pending.push({id:item.id,due:round+rule.after,text:rule.branches[Math.min(index,rule.branches.length-1)]||rule.branches[0]});
  }

  function maybeCallback(round){
    const ready=pending.find(x=>x.due<=round);if(!ready)return;
    pending=pending.filter(x=>x!==ready);showCallback(ready.text);
  }

  function classify(note,text){
    const t=`${note} ${text}`;
    if(/放過|退讓|安撫|接受灰區|被拉回去|順著|一起維持/.test(t))counters.soft++;
    if(/確認|核對|證據|觀察|動機|時間線|情報|問清楚/.test(t))counters.detective++;
    if(/劇情|反撩|加速|右滑|先認領|表演|支線|衝|好玩/.test(t))counters.chaos++;
    if(/界線|拒絕|自主|對等|規則|停止施壓|不接受/.test(t))counters.boundary++;
    if(/行動|做到|安排|訂位|可靠|補償|維持|執行/.test(t))counters.action++;
  }

  function achievement(key,count,kicker,title,text){
    if(counters[key]<count||unlocked.has(key))return;
    unlocked.add(key);toast(kicker,title,text);
  }

  function checkAchievements(){
    achievement('soft',3,'ACHIEVEMENT UNLOCKED','金牌辯護律師','任何行為到妳這裡，好像都能先找到一個理由。');
    achievement('detective',4,'ACHIEVEMENT UNLOCKED','台北地檢署感情組','時間線、動機、證據：請依序說明。');
    achievement('chaos',3,'ACHIEVEMENT UNLOCKED','本季確定續訂','妳不是不知道危險，妳只是想看下一集。');
    achievement('boundary',4,'ACHIEVEMENT UNLOCKED','界線管理局臨時署長','今天的「不行」都有成功說出口。');
    achievement('action',4,'ACHIEVEMENT UNLOCKED','嘴甜免試，行動加分','沒有做到的話，台詞再漂亮也先不算。');
  }

  function statValue(i){const raw=parseFloat($('s'+i)?.style.width||'0');return Number.isFinite(raw)?raw:0;}
  function maybeRoast(item,note,text){
    const love=statValue(0),radar=statValue(1),standard=statValue(2),chaos=statValue(3);
    if(standard>=78&&/退讓|順著|接受灰區|先安撫|放過/.test(`${note} ${text}`)){
      toast('SYSTEM ERROR','妳的界線很多','但目前看起來主要存在於理論上。');return;
    }
    if(love>=82&&item?.flag==='red'&&/給一次|先看看|接受|心動|回一下|見/.test(`${note} ${text}`)){
      toast('SYSTEM NOTICE','心已經先投票','RADAR 還在後面整理證據。');return;
    }
    if(radar>=82&&item?.flag==='green'&&/觀察|怪|警戒|確認/.test(`${note} ${text}`)){
      toast('SYSTEM NOTICE','警報器對正常人也開始叫了','有雷達很好，但不是每一個訊號都是案件。');return;
    }
    if(chaos>=78&&/安全|退出|不加戲|改天|不回/.test(`${note} ${text}`)){
      toast('SYSTEM SURPRISE','妳居然選了安全選項','系統正在重新計算對妳的理解。');
    }
  }

  function maybeEventTwist(item,index){
    const rows=eventTwists[item.id];if(!rows)return;
    const row=rows[Math.min(index,rows.length-1)]||rows[0];
    setTimeout(()=>showInterlude(row[0],item.title||'事件更新',row[1]),520);
  }

  function setupBossFollowup(item){
    const cfg=bossFollowups[item.id];if(!cfg||bossHandled===`${item.id}:${roundInfo().round}`)return;
    const panel=$('interactionPanel');if(!panel||panel.classList.contains('hidden'))return;
    bossHandled=`${item.id}:${roundInfo().round}`;
    const continueBtn=$('continueBtn');if(!continueBtn)return;
    continueBtn.classList.add('hidden');
    const wrap=document.createElement('div');wrap.className='boss-followup drama-inline';wrap.innerHTML=`<div class="boss-followup-kicker">BOSS PHASE 2</div><div class="boss-followup-prompt">${cfg.prompt}</div><div class="boss-followup-options"></div>`;
    const options=wrap.querySelector('.boss-followup-options');
    cfg.options.forEach((row,i)=>{const b=document.createElement('button');b.type='button';b.innerHTML=`<b>${String.fromCharCode(65+i)}｜${row[0]}</b>`;b.onclick=()=>{[...options.querySelectorAll('button')].forEach(x=>x.disabled=true);b.classList.add('selected');const beat=$('storyBeat');if(beat){beat.textContent=`${beat.textContent}  // ${row[1]}`;beat.classList.remove('hidden');}toast('BOSS DECISION SAVED','第二段選擇已記錄',row[1]);continueBtn.classList.remove('hidden');wrap.classList.add('resolved');};options.appendChild(b);});
    panel.insertBefore(wrap,continueBtn);
  }

  const choices=$('choices');
  if(choices){
    choices.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      const item=currentItem();if(!item)return;
      const index=Number(button.dataset.choice||0);
      const note=button.querySelector('small')?.textContent||'';
      const text=button.querySelector('b')?.textContent||'';
      const {round}=roundInfo();
      scheduleCallback(item,index,round);
      classify(note,text);
      setTimeout(()=>{checkAchievements();maybeRoast(item,note,text);maybeEventTwist(item,index);},80);
    });
  }

  function processRound(){
    const {round}=roundInfo();if(!round)return;
    if(round===1&&lastRound>1)resetRun();
    lastRound=round;
    const item=currentItem();if(!item)return;
    const key=`${round}:${item.id}`;if(currentKey===key)return;currentKey=key;
    document.querySelectorAll('.callback-panel').forEach(x=>x.remove());
    maybeCallback(round);
    if(item.kind==='boss'){
      const badge=$('eventBadge');if(badge){badge.textContent='◆ BOSS EVENT';badge.className='event-badge boss-event';}
    }
  }

  const roundObserver=new MutationObserver(()=>requestAnimationFrame(processRound));
  if($('count'))roundObserver.observe($('count'),{childList:true,subtree:true,characterData:true});
  if($('quote'))roundObserver.observe($('quote'),{childList:true,subtree:true,characterData:true});

  const interactionObserver=new MutationObserver(()=>{
    const panel=$('interactionPanel');if(!panel||panel.classList.contains('hidden'))return;
    const kicker=$('interactionKicker')?.textContent||'';
    if(kicker.startsWith('GROUP CHAT')){
      const speaker=$('interactionSpeaker');if(speaker)speaker.textContent='姐妹群組 · 4 人在線';
    }
    const item=currentItem();if(item?.kind==='boss')setupBossFollowup(item);
  });
  if($('interactionPanel'))interactionObserver.observe($('interactionPanel'),{attributes:true,childList:true,subtree:true,characterData:true});

  processRound();
})();
