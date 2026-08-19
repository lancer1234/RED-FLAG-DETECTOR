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

  const eventChains = {
    EV01:{flag:'datingScreenshot',targets:['P01','P04','P09','P12'],label:'CROSS FILE // 妳手機裡還躺著那張交友軟體截圖'},
    EV03:{flag:'mutualWarning',targets:['P01','P04','P06','P12'],label:'CROSS FILE // 共同好友那句「有件事不知道該不該講」還沒忘'},
    EV05:{flag:'exWedding',targets:['P06'],label:'CROSS FILE // 前任婚禮邀請還在妳信箱裡'},
    EV07:{flag:'bestieVote',targets:['P01','P04','P06','P12'],label:'GROUP CHAT // 姐妹群組目前仍是 4：0'},
    EV10:{flag:'workTrip',targets:['P05','P11'],label:'CROSS FILE // 突然出差把這段關係丟進遠距測試'},
    EV11:{flag:'unknownCall',targets:['P01','P04','P09','P12'],label:'UNKNOWN CALL // 那通陌生電話還沒有合理解釋'},
    EV16:{flag:'ranIntoEx',targets:['P06'],label:'EX FILE // 妳們剛剛才真的撞見彼此'}
  };

  const rareEndings = [
    {id:'balanced',name:'情緒平衡大師',desc:'15 張卡打完，四條數值居然全部留在安全中線。妳不是沒感覺，是很難被任何單一情緒接管。',test:s=>s.index>=s.deck.length-1&&s.stats.every(v=>v>=35&&v<=65)},
    {id:'noContact',name:'前任封鎖完成',desc:'前任有出現，但妳每一次都沒有把門重新打開。這次續集真的沒有續訂。',test:s=>s.personaStats.P06&&s.personaStats.P06.seen>=2&&s.personaStats.P06.trust<=35&&s.traits.boundary>=3},
    {id:'soapOpera',name:'本季續訂成功',desc:'同一個人三次出場，妳三次都把故事推向更亂的方向。製作人已經下訂下一季。',test:s=>Object.values(s.personaStats).some(p=>p.seen>=3&&p.heat>=75)&&s.traits.chaos>=4},
    {id:'actionOnly',name:'嘴可以停，行動留下',desc:'妳整局幾乎只對「真的有做」的人加分。甜話部門今晚裁員。',test:s=>s.traits.action>=5&&s.traits.romantic<=2},
    {id:'boundaryBoss',name:'界線管理局局長',desc:'妳不是在找完美的人，妳只是每次有人踩線就真的會處理。',test:s=>s.traits.boundary>=6&&s.stats[2]>=70&&s.stats[3]<70}
  ];

  window.RED_FLAG_META = {modifiers,traitLabels,eventChains,rareEndings};
})();
