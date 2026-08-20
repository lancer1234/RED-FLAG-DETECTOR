(() => {
  const full = window.RED_FLAG_FULL_CHOICES || (window.RED_FLAG_FULL_CHOICES = {});
  const data = window.RED_FLAG_DATA || [];
  const events = window.RED_FLAG_EVENTS || [];
  const invalid = [];
  let synced = 0;

  const byId = new Map(data.map(item => [item.id, item]));
  const eventById = new Map(events.map(item => [item.id, item]));

  // Protect the second half of expanded character lines from appearing as
  // standalone cards. P13-P20 each use 04/05/06 as a three-card mini-arc.
  for (let p = 13; p <= 20; p++) {
    const persona = `P${p}`;
    [4, 5, 6].forEach((n, index) => {
      const item = byId.get(`${persona}-${String(n).padStart(2, '0')}`);
      if (!item) return;
      item.arc = `${persona}-B`;
      item.stage = index + 1;
    });
  }

  // Keep the P17-B mini-arc self-contained.
  const p1706 = byId.get('P17-06');
  if (p1706) {
    p1706.quote = '後來他真的把 Spotify Duo 拆掉，也把前任聯絡人改回本名。那些一直用「懶得改」留下的舊設定，終於開始被整理。';
    p1706.type = '前任基礎設定終於整理型';
  }

  // Faster-reading copy pass. Only presentation text changes here: IDs, choices,
  // score deltas and story wiring stay untouched so exact replies remain valid.
  const compactQuotes = {
    'P13-01':'第一次正式約會後，他傳來 Google Sheet：「我把今天整理了一下，妳也可以幫我打分。」',
    'P13-02':'表格真的有「聊天流暢度 8.5、時間觀念 9、長期潛力 TBD」，還有一欄叫「待驗證風險」。',
    'P13-03':'他認真問：「如果繼續約會，要不要每月底做一次 relationship review？」',
    'P13-04':'他傳來 Notion 頁面：〈Q4 Relationship Roadmap〉。裡面真的有三個 milestone。',
    'P14-01':'第三次見面，他突然說：「我媽剛好在附近，要不要一起吃？她很想看看妳。」',
    'P14-02':'吃飯時他媽直接問：「會煮飯嗎？以後想不想生小孩？」他本人在旁邊繼續喝湯。',
    'P14-04':'妳一醒來，被加進 LINE 群組「Allen 家庭旅遊 2027」。成員：18 人。',
    'P14-05':'他媽突然傳：「他今天有吃晚餐嗎？」問題是——妳根本沒給過她電話。',
    'P15-01':'他說自己完全不迷信。五分鐘後問：「妳幾點出生？精確到分鐘最好。」',
    'P15-02':'隔天他傳來合盤截圖：「月亮有刑相，但金星還可以救。」',
    'P15-03':'第一次吵架後，他說：「今天水逆，我覺得先不要做重大決定。」',
    'P16-01':'第一次小爭執，他拿起手機：「等一下，我把我們兩邊的說法貼給 AI，看誰比較合理。」',
    'P17-01':'他說跟前任早就沒關係，但兩人還共用 Netflix、Costco 卡，還一起養一隻狗。',
    'P17-02':'他去前任家接狗，結果順便留下來吃晚餐。理由：「她煮太多了。」',
    'P17-03':'妳問清楚後，他說：「不可能復合，但她是最懂我的朋友。」',
    'P17-04':'他手機裡，前任聯絡人還叫「寶」。理由：「改名字很麻煩，我習慣了。」',
    'P17-05':'他跟前任還共用 Spotify Duo。理由：「拆掉每個月會多 40 塊。」',
    'P17-06':'後來他真的拆掉 Spotify Duo，也把前任聯絡人改回本名。那些「懶得改」的舊設定，終於開始被整理。',
    'P18-01':'第一次吃飯，坐下五分鐘他就問：「方便問妳年收入大概哪個區間嗎？」',
    'P19-01':'第一次約會後，他說自己單身「一陣子了」。後來妳才知道——他跟前任說「先冷靜」才兩天。',
    'P19-02':'妳看到聊天紀錄才發現：你們第一次吃飯那天，他和前任還在互道晚安。',
    'P19-03':'他攤手：「正式跟妳在一起前，我就跟她講清楚了。所以技術上沒有劈腿。」',
    'P20-01':'妳媽吃飯時突然說：「他最近養了一隻貓。」妳：「誰？」她：「妳前任啊。」',
    'P20-02':'過年時媽媽問：「不然今年也叫他來吃飯？」妳跟前任已經分手一年。',
    'P20-03':'妳看到媽媽 LINE 裡有個「週末吃飯」群組。爸媽、弟弟、妳前任都在。沒有妳。',
    'P20-05':'妳現在的對象第一次來家裡，媽媽隨口說：「以前那個比較會修電腦。」',
    'D01':'交往三個月後，妳看到舊訊息：你們第一次約會那天，他跟前任還在互道晚安。',
    'D02':'妳媽突然說：「他最近工作換得不錯。」妳才知道，她跟妳前任一直都有聯絡。',
    'D03':'第一次睡他家，他說：「這床單滿舒服吧？我前任送的。我們現在是知己而已。」',
    'D04':'陌生帳號密妳：「妳是不是在跟他約會？」下一秒——37 張照片。最後一句：「我只是希望妳知道他是什麼人。」',
    'D05':'妳問：以前會開車接前任，為什麼現在連車站都不來？他答：「以前就是對她太好，我不想重蹈覆轍。」'
  };

  Object.entries(compactQuotes).forEach(([id, quote]) => {
    const item = byId.get(id) || eventById.get(id);
    if (item) item.quote = quote;
  });

  function validOptions(options) {
    return Array.isArray(options) && options.length >= 3 && options.slice(0,3).every(o =>
      o && typeof o.text === 'string' && o.text.trim() &&
      typeof o.note === 'string' &&
      Array.isArray(o.delta) && o.delta.length === 4 && o.delta.every(Number.isFinite)
    );
  }

  data.forEach(item => {
    if (!item || !item.id) return;
    if (full[item.id]) return;
    if (validOptions(item.options)) {
      full[item.id] = item.options.slice(0,3);
      synced += 1;
    } else {
      invalid.push(item.id);
    }
  });

  events.forEach(item => {
    if (!item || !item.id) return;
    if (!validOptions(item.options)) invalid.push(item.id);
  });

  const characterTotal = Object.keys(window.RED_FLAG_PERSONAS || {}).length;
  window.RED_FLAG_CONTENT_REPORT = {
    syncedStrictChoices: synced,
    invalidIds: [...new Set(invalid)],
    protectedStoryArcs: Array.from({ length: 8 }, (_, i) => `P${i + 13}-B`),
    compactCopyCount: Object.keys(compactQuotes).length,
    characterTotal
  };

  if (invalid.length) console.error('[RED FLAG DETECTOR] Invalid card content:', [...new Set(invalid)]);
  else console.info(`[RED FLAG DETECTOR] content integrity OK; synced ${synced} expansion cards into strict choices.`);

  function syncCharacterTotal() {
    const root = document.getElementById('dexContent');
    if (!root) return;
    root.querySelectorAll('.dex-group > b').forEach(label => {
      const text = String(label.textContent || '').trim();
      const match = text.match(/^CHARACTERS\s+(\d+)\s*\/\s*\d+$/i);
      if (!match) return;
      const next = `CHARACTERS ${match[1]}/${characterTotal}`;
      if (label.textContent !== next) label.textContent = next;
    });
  }

  ['openDex', 'openDexEnd'].forEach(id => {
    const button = document.getElementById(id);
    if (!button) return;
    button.addEventListener('click', () => requestAnimationFrame(syncCharacterTotal));
  });

  const dexOverlay = document.getElementById('dexOverlay');
  if (dexOverlay) {
    const dexObserver = new MutationObserver(() => {
      if (!dexOverlay.classList.contains('hidden')) requestAnimationFrame(syncCharacterTotal);
    });
    dexObserver.observe(dexOverlay, { attributes: true, attributeFilter: ['class'] });
  }

  setTimeout(() => {
    const active = document.querySelector('.mode-btn.active[data-mode="FULL SCAN"]');
    if (active && active.dataset.rounds === '20') active.click();
  }, 0);
})();