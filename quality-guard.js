(() => {
  const $ = id => document.getElementById(id);

  document.querySelectorAll('.mode-btn').forEach(button => {
    button.addEventListener('click', () => {
      if ($('modeLabel')) $('modeLabel').textContent = button.dataset.mode || 'FULL SCAN';
    });
  });

  const choices = $('choices');
  if (!choices) return;

  let shownThisRun = 0;
  let lastShownRound = -99;
  let lastRoundSeen = 0;
  let processedKey = '';

  const rules = {
    DETECTIVE: /時間|時間線|前後|說法|行程|加班|消失|已讀|回覆|前任|截圖|交友軟體|限動|陌生|共同好友|朋友說|重疊|週末|謊|對不上|可疑|定位|紀錄|訊息/i,
    BOUNDARY: /控制|報備|不准|不能|要求|逼|隱私|手機|密碼|界線|穿什麼|異性|定位|查勤|雙標|冷戰|拒絕|尊重|安全感|自由|限制/i,
    HEART: /喜歡|想妳|想你|在意|約會|見面|告白|關係|曖昧|心動|未來|一起|認真|想跟妳|想和妳|想見|靠近/i,
    CHAOS: /前任|喝醉|酒後|凌晨|陌生電話|三角|撞見|婚禮|交友軟體|截圖|姐妹|群組|限動|復合|巧遇|突然|修羅場|抓包|秘密/i
  };

  function contextText() {
    return [
      $('dramaHook')?.textContent,
      $('crossHook')?.textContent,
      $('role')?.textContent,
      $('who')?.textContent,
      $('quote')?.textContent
    ].filter(Boolean).join(' ');
  }

  function roundInfo() {
    const text = $('count')?.textContent || '';
    const match = text.match(/(\d+)\s*\/\s*(\d+)/);
    return match ? { round: Number(match[1]), total: Number(match[2]) } : { round: 0, total: 15 };
  }

  function markerType(marker) {
    if (marker.includes('DETECTIVE')) return 'DETECTIVE';
    if (marker.includes('BOUNDARY')) return 'BOUNDARY';
    if (marker.includes('HEART')) return 'HEART';
    if (marker.includes('CHAOS')) return 'CHAOS';
    return '';
  }

  function contextualTitle(type, text) {
    if (type === 'DETECTIVE') {
      if (/時間|時間線|前後|行程|加班|重疊|週末|對不上/.test(text)) return 'D｜等等，前後的時間好像有哪裡對不起來';
      if (/前任|復合/.test(text)) return 'D｜先把前任這條線問清楚，我再決定要不要信';
      if (/截圖|交友軟體|限動|訊息|已讀/.test(text)) return 'D｜我先不下結論，但這個證據我會直接問清楚';
      return 'D｜這裡有個細節怪怪的，我想先確認一下';
    }
    if (type === 'BOUNDARY') {
      if (/隱私|手機|密碼/.test(text)) return 'D｜可以有隱私，但我們把彼此的界線講清楚';
      if (/報備|定位|查勤/.test(text)) return 'D｜關心可以，但我不接受把報備變成查勤';
      if (/穿什麼|不准|不能|限制|控制/.test(text)) return 'D｜你可以有感受，但不能替我決定';
      return 'D｜這件事碰到我的界線，我現在就說清楚';
    }
    if (type === 'HEART') {
      if (/告白|喜歡|在意|心動/.test(text)) return 'D｜我也有感覺，不想再繞了，直接說吧';
      if (/約會|見面|想見/.test(text)) return 'D｜我其實想見你，那就把時間真的約下來';
      if (/關係|曖昧|認真/.test(text)) return 'D｜我在意你，所以我想知道我們到底往哪裡走';
      return 'D｜我不裝沒事，直接說我現在真的有感覺';
    }
    if (type === 'CHAOS') {
      if (/前任|復合/.test(text)) return 'D｜好，我知道很危險，但我想看他到底要演哪齣';
      if (/陌生電話|截圖|抓包|秘密/.test(text)) return 'D｜先別結束，我要把這齣戲看到真相出來';
      if (/喝醉|酒後|凌晨/.test(text)) return 'D｜現在明知道不理性，但我偏想回這一句';
      return 'D｜這局已經夠荒謬了，我想看看下一幕會怎樣';
    }
    return '';
  }

  function applyGuard() {
    const button = choices.querySelector('.unlocked-choice');
    if (!button) return;

    const title = button.querySelector('b');
    const note = button.querySelector('small');
    if (!title || !note) return;

    const marker = note.textContent || '';
    const type = markerType(marker);
    if (!type) return;

    const { round, total } = roundInfo();
    if (round === 1 && lastRoundSeen > 1) {
      shownThisRun = 0;
      lastShownRound = -99;
      processedKey = '';
    }
    lastRoundSeen = round;

    const key = `${total}:${round}:${type}`;
    if (processedKey === key) return;
    processedKey = key;

    const text = contextText();
    const relevant = rules[type].test(text);
    const maxPerRun = total <= 8 ? 2 : 3;
    const cooledDown = round - lastShownRound >= 2;

    observer.disconnect();

    if (!relevant || shownThisRun >= maxPerRun || !cooledDown) {
      button.remove();
      observer.observe(choices, { childList: true, subtree: true });
      return;
    }

    const nextTitle = contextualTitle(type, text);
    if (nextTitle && title.textContent !== nextTitle) title.textContent = nextTitle;
    shownThisRun += 1;
    lastShownRound = round;

    observer.observe(choices, { childList: true, subtree: true });
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyGuard();
    });
  });

  observer.observe(choices, { childList: true, subtree: true });
})();
