(() => {
  const data = window.RED_FLAG_DATA || [];
  const byId = new Map(data.map(item => [item.id, item]));

  // Expanded characters P13-P20 each have a second three-card mini-arc.
  // These cards used to be treated as standalone singles, which allowed a payoff
  // card such as P17-06 to appear without any of its setup.
  for (let p = 13; p <= 20; p++) {
    const persona = `P${p}`;
    [4, 5, 6].forEach((n, index) => {
      const id = `${persona}-${String(n).padStart(2, '0')}`;
      const item = byId.get(id);
      if (!item) return;
      item.arc = `${persona}-B`;
      item.stage = index + 1;
    });
  }

  // P17-B must be understandable on its own. The old finale referenced the
  // separate P17-A dog/dinner storyline even when that arc had never appeared.
  const p1706 = byId.get('P17-06');
  if (p1706) {
    p1706.quote = '後來他真的把 Spotify Duo 拆掉，也把前任的聯絡人名稱改回本名。那些一直用「懶得改」留下的舊設定，終於開始被整理。';
    p1706.type = '前任基礎設定終於整理型';
  }

  window.RED_FLAG_STORY_REPORT = {
    protectedMiniArcs: Array.from({ length: 8 }, (_, i) => `P${i + 13}-B`),
    rule: '任何續篇都必須隨同自己的前情小線一起進牌堆。'
  };

  // app-v2 historically initializes FULL SCAN at 15 internally. Triggering the
  // already-active mode after all synchronous scripts load makes the runtime
  // state match the visible 20-card setting without duplicating game state.
  setTimeout(() => {
    const active = document.querySelector('.mode-btn.active[data-mode="FULL SCAN"]');
    if (active && active.dataset.rounds === '20') active.click();
  }, 0);
})();
