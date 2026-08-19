(() => {
  const full = window.RED_FLAG_FULL_CHOICES || (window.RED_FLAG_FULL_CHOICES = {});
  const data = window.RED_FLAG_DATA || [];
  const events = window.RED_FLAG_EVENTS || [];
  const invalid = [];
  let synced = 0;

  const byId = new Map(data.map(item => [item.id, item]));

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

  // This finale previously referenced the separate dog/dinner branch even when
  // players had never seen it. Keep this mini-arc self-contained.
  const p1706 = byId.get('P17-06');
  if (p1706) {
    p1706.quote = '後來他真的把 Spotify Duo 拆掉，也把前任的聯絡人名稱改回本名。那些一直用「懶得改」留下的舊設定，終於開始被整理。';
    p1706.type = '前任基礎設定終於整理型';
  }

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
    characterTotal
  };

  if (invalid.length) {
    console.error('[RED FLAG DETECTOR] Invalid card content:', [...new Set(invalid)]);
  } else {
    console.info(`[RED FLAG DETECTOR] content integrity OK; synced ${synced} expansion cards into strict choices.`);
  }

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

  // The encyclopedia used to hard-code the original 12-character total.
  // Recalculate it from the live persona registry whenever the overlay opens,
  // so future character expansions update automatically as well.
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

  // The UI already says FULL SCAN = 20, but app-v2 historically starts its
  // internal state at 15 until the mode button is clicked. Sync it after the
  // remaining synchronous scripts attach their handlers.
  setTimeout(() => {
    const active = document.querySelector('.mode-btn.active[data-mode="FULL SCAN"]');
    if (active && active.dataset.rounds === '20') active.click();
  }, 0);
})();
