(() => {
  const modifiers = [
    {id:'bestie',name:'姐妹就在旁邊',desc:'今晚每一句都有人即時幫妳翻譯。RADAR / STANDARD 的變化更大。',mult:[1,1.3,1.3,1]},
    {id:'tipsy',name:'微醺模式',desc:'理智還在線，但手比腦快。LOVE / CHAOS 的變化更大。',mult:[1.3,1,1,1.35]},
    {id:'heartbreak',name:'剛失戀三週',desc:'妳對靠近和退後都特別敏感。LOVE / RADAR 波動放大。',mult:[1.3,1.25,1,1]},
    {id:'vacation',name:'旅行模式',desc:'平常不會做的事，旅行時好像都可以。LOVE / CHAOS 波動放大。',mult:[1.2,1,1,1.3]},
    {id:'therapy',name:'諮商後遺症',desc:'妳今天很會講界線。STANDARD 的正向變化加成。',mult:[1,1.1,1.35,0.9]},
    {id:'nothing',name:'普通的一晚',desc:'沒有加成。今晚只能怪自己。',mult:[1,1,1,1]}
  ];

  const traitLabels = {
    soft:'容易心軟', boundary:'界線很硬', detective:'細節雷達', chaos:'續集體質',
    direct:'直球溝通', avoidant:'先算了派', action:'看行動派', romantic:'心動優先'
  };

  // IDs match events.js (E01, E03...) so these flags really can carry into
  // later character cards.
  const eventChains = {
    E01:{flag:'datingScreenshot',targets:['P01','P04','P09','P12'],label:'CROSS FILE // 妳手機裡還躺著那張交友軟體截圖'},
    E03:{flag:'mutualWarning',targets:['P01','P04','P06','P12'],label:'CROSS FILE // 共同好友那句「有件事不知道該不該講」還沒忘'},
    E05:{flag:'exWedding',targets:['P06'],label:'CROSS FILE // 前任婚禮邀請還在妳信箱裡'},
    E08:{flag:'bestieVote',targets:['P01','P04','P06','P12'],label:'GROUP CHAT // 姐妹群組目前仍是 4：0'},
    E11:{flag:'workTrip',targets:['P05','P11'],label:'CROSS FILE // 突然出差把這段關係丟進遠距測試'},
    E12:{flag:'unknownCall',targets:['P01','P04','P09','P12'],label:'UNKNOWN CALL // 那通陌生電話還沒有合理解釋'},
    E16:{flag:'ranIntoEx',targets:['P06'],label:'EX FILE // 妳們剛剛才真的撞見彼此'},
    E20:{flag:'toothbrush',targets:['P02','P03','P05','P11'],label:'CROSS FILE // 那支留在浴室的牙刷還在那裡'},
    E23:{flag:'calendarInvite',targets:['P02','P05','P11'],label:'CROSS FILE // 共享行事曆已經把你們的生活排進同一頁'},
    E27:{flag:'someoneChasing',targets:['P01','P03','P09','P12'],label:'CROSS FILE // 妳已經聽說有人正在追他'}
  };

  const rareEndings = [
    {id:'balanced',name:'情緒平衡大師',desc:'15 張卡打完，四條數值居然全部留在安全中線。妳不是沒感覺，是很難被任何單一情緒接管。',test:s=>s.index>=s.deck.length-1&&s.stats.every(v=>v>=35&&v<=65)},
    {id:'noContact',name:'前任封鎖完成',desc:'前任有出現，但妳每一次都沒有把門重新打開。這次續集真的沒有續訂。',test:s=>s.personaStats.P06&&s.personaStats.P06.seen>=2&&s.personaStats.P06.trust<=35&&s.traits.boundary>=3},
    {id:'soapOpera',name:'本季續訂成功',desc:'同一個人三次出場，妳三次都把故事推向更亂的方向。製作人已經下訂下一季。',test:s=>Object.values(s.personaStats).some(p=>p.seen>=3&&p.heat>=75)&&s.traits.chaos>=4},
    {id:'actionOnly',name:'嘴可以停，行動留下',desc:'妳整局幾乎只對「真的有做」的人加分。甜話部門今晚裁員。',test:s=>s.traits.action>=5&&s.traits.romantic<=2},
    {id:'boundaryBoss',name:'界線管理局局長',desc:'妳不是在找完美的人，妳只是每次有人踩線就真的會處理。',test:s=>s.traits.boundary>=6&&s.stats[2]>=70&&s.stats[3]<70}
  ];

  const O=(text,note,delta)=>({text,note,delta});
  const extraEvents = [
    {id:'E17',kind:'event',type:'共同歌單事件',title:'共同歌單突然少了一首歌',hook:'PLAYLIST UPDATE // 誰刪的？',quote:'你們一起做的歌單裡，那首妳一直以為「很像你們」的歌突然不見了。',options:[
      O('直接問他是不是刪了','不猜，直接確認',[1,7,2,-2]),
      O('先當成一般整理歌單','不過度解讀',[2,-5,-1,-2]),
      O('默默把更狠的一首歌加回去','被動攻防開打',[3,1,-3,8])]},
    {id:'E18',kind:'event',type:'社群標記事件',title:'朋友把你們標在同一張合照',hook:'TAGGED // 公開程度突然 +1',quote:'聚會結束後，朋友發合照並同時標記你們。你們還沒正式談過要不要公開。',options:[
      O('先問他介不介意再轉發','公開前先確認',[2,3,4,-1]),
      O('不轉發，也不特別處理','維持原狀',[0,1,1,-1]),
      O('直接轉發，看他怎麼接','公開測試開始',[5,-2,-2,6])]},
    {id:'E19',kind:'event',type:'朋友局事件',title:'今晚臨時要見他的朋友',hook:'SOCIAL CHECKPOINT // 30 MINUTES NOTICE',quote:'他突然說：「我朋友就在附近，要不要一起來？」妳只有半小時決定。',options:[
      O('可以，但我只待一下','保留彈性',[4,1,3,0]),
      O('今天不想臨時社交，下次再約','守住自己的狀態',[-1,1,5,-2]),
      O('去啊，直接進副本','臨時加入主線',[5,-1,-1,6])]},
    {id:'E20',kind:'event',type:'生活痕跡事件',title:'浴室裡多了一支牙刷',hook:'DOMESTIC FILE // 這算什麼程度？',quote:'某次過夜後，他說：「妳的牙刷就放這裡吧，下次不用再帶。」',options:[
      O('可以，但先不要把它當成什麼承諾','接受但不過度定義',[4,2,3,-1]),
      O('我先帶回去，等關係更穩再說','把生活痕跡放慢',[0,2,5,-2]),
      O('那我順便留洗面乳','直接開始佔領浴室',[7,-2,-2,7])]},
    {id:'E21',kind:'event',type:'摯友名單事件',title:'妳突然被加進摯友',hook:'GREEN CIRCLE // 權限升級？',quote:'沒有任何前兆，他突然把妳加進 IG 摯友，接著連發三篇只有摯友能看的限動。',options:[
      O('看就看，不先腦補權限意義','降低解讀',[1,-4,1,-2]),
      O('我會留意他是不是只對我這樣','觀察模式',[1,6,1,0]),
      O('摯友都進了，這還不算升級？','社群權限當名分',[6,-3,-2,5])]},
    {id:'E22',kind:'event',type:'照顧事件',title:'他半夜說發燒了',hook:'02:04 // CARE MODE',quote:'對方半夜傳來：「好像發燒了，家裡沒有退燒藥。」你們住得不算近。',options:[
      O('叫外送送藥，確認他有沒有需要就好','照顧但不過度投入',[5,1,3,-2]),
      O('先問嚴不嚴重，需要再過去','依情況決定',[3,3,3,-1]),
      O('我現在過去','直接進照護模式',[8,-2,-1,4])]},
    {id:'E23',kind:'event',type:'共享行事曆事件',title:'收到共享行事曆邀請',hook:'CALENDAR ACCESS REQUEST',quote:'他傳來一個共享行事曆邀請：「這樣比較不會一直問彼此哪天有空。」',options:[
      O('只共享約會和旅行，不放全部生活','限定共享範圍',[2,2,5,-2]),
      O('可以，省得每次重問','接受工具化協調',[4,1,2,-1]),
      O('先不要，我不想生活全部被看見','保留私人節奏',[-1,2,4,-2])]},
    {id:'E24',kind:'event',type:'寵物事件',title:'他問能不能幫忙顧寵物',hook:'PET SITTING // 信任測試',quote:'他週末臨時有事，問妳能不能幫忙照顧他最寶貝的寵物一天。',options:[
      O('有空就幫，先把注意事項問清楚','務實接手',[4,2,3,-1]),
      O('這週不方便，幫他找別的方法','不因關係勉強自己',[0,1,4,-2]),
      O('當然可以，我已經是半個家長了','角色自動升級',[7,-2,-2,5])]},
    {id:'E25',kind:'event',type:'訊息撤回事件',title:'凌晨訊息被撤回',hook:'MESSAGE UNSENT // 妳有看到',quote:'凌晨 00:36，他傳了一句「其實我一直很…」然後立刻撤回。妳剛好有看到通知。',options:[
      O('直接問：「你剛剛想說什麼？」','讓話說完整',[4,4,1,2]),
      O('先不追，等他自己再提','把球留給他',[1,1,2,-2]),
      O('回：「我有看到喔 :)」','壓力直接拉滿',[5,2,-2,6])]},
    {id:'E26',kind:'event',type:'前任物品事件',title:'前任突然說要還東西',hook:'EX INVENTORY // 還有東西沒清完',quote:'很久沒聯絡的前任突然傳訊息：「我整理房間找到妳以前的東西，要拿給妳嗎？」',options:[
      O('請他寄或交給共同朋友','降低接觸',[-2,3,5,-3]),
      O('如果重要就約白天拿一下','有限接觸',[1,3,2,1]),
      O('好啊，順便喝杯咖啡','物品只是開場',[5,-2,-2,7])]},
    {id:'E27',kind:'event',type:'競爭情報事件',title:'朋友說有人正在追他',hook:'NEW PLAYER DETECTED',quote:'朋友很自然地說：「欸，你知道最近好像有人在追他嗎？」而他從來沒提過。',options:[
      O('我們沒排他，我先看他怎麼處理','規則先於吃醋',[1,5,2,-1]),
      O('我會直接問我們現在到底算什麼','把關係說清楚',[3,4,3,1]),
      O('突然很想贏','競賽模式啟動',[7,-3,-3,7])]},
    {id:'E28',kind:'event',type:'跨年事件',title:'跨年只剩最後一個晚上',hook:'23:59 // WITH WHO?',quote:'跨年行程都快訂滿了，但你們誰也沒先問對方要不要一起過。',options:[
      O('想一起就直接問','需求不玩猜心',[5,2,2,0]),
      O('我先排自己的，有空再合流','不把節日當考試',[1,1,4,-2]),
      O('他不主動我也不問','雙方同步等待',[1,-2,-3,4])]},
    {id:'E29',kind:'event',type:'工作社交事件',title:'他邀妳去公司聚會',hook:'WORK MODE // 被帶進另一個圈子',quote:'他問妳要不要一起去公司聚會：「如果妳覺得尷尬就不用勉強。」',options:[
      O('想去就去，不把它當關係宣告','正常參與',[4,1,2,-1]),
      O('這次先不要，我還不想進工作圈','保留邊界',[0,1,4,-2]),
      O('去啊，我想看看同事都知道我多少','情報模式',[4,5,-1,3])]},
    {id:'E30',kind:'event',type:'共同好友限動事件',title:'限動裡看到他在一個沒提過的局',hook:'BACKGROUND DETECTED',quote:'妳滑共同好友限動，意外看到他也在一個聚會裡。這件事本身跟妳沒有約。',options:[
      O('沒有約我就不代表需要報備','不自動延伸義務',[0,-3,2,-2]),
      O('如果之後聊到我會自然問一下','保留資訊',[1,3,1,0]),
      O('立刻傳：「你在哪？」','直接進入查勤',[2,4,-4,5])]},
    {id:'E31',kind:'event',type:'照片事件',title:'他把合照設成手機桌布',hook:'LOCK SCREEN // 這進度合理嗎？',quote:'妳無意間看到，他把你們上次出去拍的合照設成手機桌布，但從來沒跟妳說。',options:[
      O('覺得可愛，但不先替關係下定義','享受但不腦補',[5,-1,1,-1]),
      O('笑他：「你怎麼沒跟我說？」','直接接球',[6,1,1,1]),
      O('內心已經開始想情侶桌布','心先跑三站',[8,-3,-2,5])]},
    {id:'E32',kind:'event',type:'臨時取消事件',title:'出門前一小時被取消',hook:'CANCELLED // 60 MINUTES NOTICE',quote:'妳都快準備好了，他突然說今天狀態很差，想取消，但有先道歉也主動提出改期。',options:[
      O('可以，既然有改期就先休息','看後續而不是只看取消',[2,1,2,-2]),
      O('我會失望，但希望下次能更早講','把感受講清楚',[1,2,3,-1]),
      O('算了，我今天直接不想理他','情緒先切斷',[-3,1,-2,4])]} 
  ];

  if (Array.isArray(window.RED_FLAG_EVENTS)) window.RED_FLAG_EVENTS.push(...extraEvents);
  else window.RED_FLAG_EVENTS = extraEvents;

  window.RED_FLAG_META = {modifiers,traitLabels,eventChains,rareEndings};
})();
