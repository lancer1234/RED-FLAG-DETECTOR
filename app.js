(() => {
  const data = window.RED_FLAG_DATA || [];
  const personas = window.RED_FLAG_PERSONAS || {};
  const interactions = window.RED_FLAG_INTERACTIONS || {};
  const labels = ['LOVE', 'RADAR', 'STANDARD', 'CHAOS'];
  const keyMap = { a: 0, b: 1, c: 2 };

  const state = {
    deck: [],
    index: 0,
    stats: [50, 50, 50, 50],
    seen: [],
    locked: false,
    rounds: 15,
    mode: 'FULL SCAN'
  };

  const $ = id => document.getElementById(id);
  const clamp = value => Math.max(0, Math.min(100, value));

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function hash(text) {
    return [...text].reduce((n, ch) => ((n << 5) - n + ch.charCodeAt(0)) | 0, 0) >>> 0;
  }

  function buildDeck(rounds) {
    const rare = data.filter(item => item.rare);
    const singles = data.filter(item => !item.rare && !item.arc);
    const arcMap = new Map();
    data.filter(item => item.arc).forEach(item => {
      if (!arcMap.has(item.arc)) arcMap.set(item.arc, []);
      arcMap.get(item.arc).push(item);
    });
    [...arcMap.values()].forEach(items => items.sort((a, b) => a.stage - b.stage));

    const useArc = Math.random() < (rounds >= 15 ? .72 : .4);
    const useRare = Math.random() < .16;
    let deck = [];

    if (useArc && arcMap.size) {
      const arc = shuffle([...arcMap.values()])[0];
      const fillerCount = rounds - arc.length - (useRare ? 1 : 0);
      deck = shuffle(singles).slice(0, Math.max(0, fillerCount));
      const positions = rounds >= 15 ? [2, 7, 12] : [1, 4, 6];
      arc.forEach((item, i) => deck.splice(Math.min(positions[i] ?? deck.length, deck.length), 0, item));
    } else {
      deck = shuffle(singles).slice(0, rounds - (useRare ? 1 : 0));
    }

    if (useRare && rare.length) {
      const event = shuffle(rare)[0];
      const min = Math.min(2, deck.length);
      const max = Math.max(min, deck.length - 1);
      const position = min + Math.floor(Math.random() * (max - min + 1));
      deck.splice(position, 0, event);
    }

    if (deck.length < rounds) {
      const used = new Set(deck.map(item => item.id));
      deck.push(...shuffle(singles.filter(item => !used.has(item.id))).slice(0, rounds - deck.length));
    }
    return deck.slice(0, rounds);
  }

  function updateStats() {
    state.stats.forEach((value, i) => { $('s' + i).style.width = value + '%'; });
  }

  function updateProgress() {
    const percent = state.deck.length ? (state.index / state.deck.length) * 100 : 0;
    $('progressFill').style.width = percent + '%';
  }

  function drawPixel(personaId, type) {
    const canvas = $('portrait');
    const ctx = canvas.getContext('2d');
    const seed = hash(personaId) % 97;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const palettes = [
      ['#0c1419','#17313a','#d7b07f','#2a1e18','#202c34'],
      ['#160e14','#3a1c28','#c98e73','#141012','#352638'],
      ['#0d1510','#24402f','#a96e5f','#16100e','#283126'],
      ['#16120d','#43351f','#e0a986','#3a2417','#232323'],
      ['#101018','#24264c','#b87968','#09090b','#272132']
    ];
    const p = palettes[seed % palettes.length];
    ctx.fillStyle = p[0]; ctx.fillRect(0, 0, 224, 154);
    for (let i = 0; i < 40; i += 1) {
      ctx.fillStyle = i % 2 ? p[1] : '#0b0e11';
      ctx.fillRect((i * 37 + seed * 13) % 224, (i * 19 + seed * 7) % 154, 4, 4);
    }
    ctx.fillStyle = p[1]; ctx.fillRect(18, 18, 188, 118);
    ctx.fillStyle = '#0b0d10'; ctx.fillRect(26, 26, 172, 102);
    ctx.fillStyle = p[4]; ctx.fillRect(68, 103, 88, 28);
    ctx.fillStyle = p[2]; ctx.fillRect(91, 45, 42, 58); ctx.fillRect(101, 94, 22, 18);
    ctx.fillStyle = p[3]; ctx.fillRect(85, 38, 54, 20); ctx.fillRect(87, 45, 8, 36); ctx.fillRect(132, 45, 8, 38);
    ctx.fillStyle = '#0a0b0c'; ctx.fillRect(99, 66, 6, 6); ctx.fillRect(120, 66, 6, 6); ctx.fillRect(108, 84, 12, 4);
    if (type.includes('前任') || personaId === 'P06') {
      ctx.fillStyle = '#b5424d'; ctx.fillRect(160, 34, 22, 6); ctx.fillRect(168, 26, 6, 22);
    }
    if (seed % 3 === 0) { ctx.fillStyle = '#c6a55f'; ctx.fillRect(108, 112, 8, 8); }
    if (seed % 4 === 0) {
      ctx.fillStyle = '#d7d7d7'; ctx.fillRect(84, 64, 19, 4); ctx.fillRect(121, 64, 19, 4); ctx.fillRect(103, 66, 18, 3);
    }
  }

  function setBadge(item) {
    const badge = $('eventBadge');
    badge.className = 'event-badge hidden';
    badge.textContent = '';
    if (item.rare) {
      badge.textContent = '⚠ RARE FILE';
      badge.className = 'event-badge';
    } else if (item.arc) {
      badge.textContent = `CASE ${item.stage}/3`;
      badge.className = 'event-badge arc';
    }
  }

  function displayIdentity(item, persona) {
    const named = Boolean(item.rare || item.special);
    return {
      eyebrow: named ? `SPECIAL CHARACTER // ${item.type}` : item.type,
      main: named ? persona.name : persona.role,
      aria: named ? `${persona.name}，${persona.role}：${persona.profile}` : `${persona.role}：${persona.profile}`
    };
  }

  function hideInteraction() {
    $('interactionPanel').className = 'interaction-panel hidden';
    $('interactionText').textContent = '';
    $('storyBeat').textContent = '';
    $('storyBeat').classList.add('hidden');
  }

  function getOptions(item) {
    if (typeof interactions.contextualOptions === 'function') return interactions.contextualOptions(item);
    return item.options || [];
  }

  function renderRound() {
    const item = state.deck[state.index];
    if (!item) return;
    const persona = personas[item.persona] || { name: 'UNKNOWN', role: '關係未定義', profile: '' };
    const identity = displayIdentity(item, persona);
    state.locked = false;
    hideInteraction();

    $('feedback').className = 'feedback hidden';
    $('feedback').textContent = '';
    $('target').textContent = 'TARGET #' + String(state.index + 1).padStart(2, '0');
    $('count').textContent = String(state.index + 1).padStart(2, '0') + ' / ' + state.deck.length;
    $('role').textContent = identity.eyebrow;
    $('who').textContent = identity.main;
    $('quote').textContent = item.quote;
    $('dialog').className = 'dialog' + (item.special || item.rare ? ' special' : '');
    $('modeLabel').textContent = state.mode;
    $('portrait').setAttribute('aria-label', identity.aria);
    drawPixel(item.persona, item.type);
    setBadge(item);

    const choices = $('choices');
    choices.classList.remove('hidden');
    choices.innerHTML = '';
    getOptions(item).forEach((choice, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.choice = String(i);
      button.innerHTML = `<b>${['A','B','C'][i]}｜${choice.text}</b><small>${choice.note}</small>`;
      button.addEventListener('click', () => choose(choice, item, button, i));
      choices.appendChild(button);
    });
    updateProgress();
  }

  function deltaSummary(delta) {
    return delta.map((value, i) => ({ value, label: labels[i] }))
      .filter(item => item.value !== 0)
      .map(item => `${item.label} ${item.value > 0 ? '+' : ''}${item.value}`)
      .join(' · ');
  }

  function continueLabel(choiceIndex, hasStory) {
    if (hasStory) return ['好吧，繼續看','知道了，下一段','嗯，繼續'][choiceIndex] || '繼續';
    return ['好吧，下一題','知道了，繼續','嗯，下一題'][choiceIndex] || '下一題';
  }

  function showInteraction(item, choiceIndex) {
    const persona = personas[item.persona] || { name: 'UNKNOWN', role: '對方' };
    const story = typeof interactions.storyFor === 'function' ? interactions.storyFor(item, choiceIndex) : null;
    const panel = $('interactionPanel');
    const named = Boolean(item.rare || item.special);
    const speaker = named ? persona.name : persona.role;

    panel.className = 'interaction-panel' + (story ? ' story' : '');
    $('interactionSpeaker').textContent = speaker;

    if (story) {
      $('interactionKicker').textContent = story.title;
      $('interactionText').textContent = story.beats[0];
      $('storyBeat').textContent = story.beats[1];
      $('storyBeat').classList.remove('hidden');
      $('continueBtn').textContent = continueLabel(choiceIndex, true);
    } else {
      $('interactionKicker').textContent = 'RESPONSE // 對方回覆';
      $('interactionText').textContent = typeof interactions.characterReply === 'function'
        ? interactions.characterReply(item, choiceIndex)
        : '「好，我知道了。」';
      $('storyBeat').classList.add('hidden');
      $('continueBtn').textContent = continueLabel(choiceIndex, false);
    }

    window.setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  }

  function advanceRound() {
    hideInteraction();
    state.index += 1;
    updateProgress();
    if (state.index >= state.deck.length) finish();
    else renderRound();
  }

  function choose(choice, item, selectedButton, choiceIndex) {
    if (state.locked) return;
    state.locked = true;
    [...$('choices').querySelectorAll('button')].forEach(button => { button.disabled = true; });
    selectedButton.classList.add('selected');
    choice.delta.forEach((value, i) => { state.stats[i] = clamp(state.stats[i] + value); });
    if (!state.seen.includes(item.type)) state.seen.push(item.type);
    updateStats();

    const feedback = $('feedback');
    feedback.textContent = `${choice.note} // ${deltaSummary(choice.delta)}`;
    feedback.className = 'feedback';
    $('game').classList.add('glitch');
    window.setTimeout(() => $('game').classList.remove('glitch'), 180);
    if (navigator.vibrate) navigator.vibrate(18);

    const shouldReply = typeof interactions.shouldReply === 'function' && interactions.shouldReply(item);
    const story = typeof interactions.storyFor === 'function' ? interactions.storyFor(item, choiceIndex) : null;
    if (story || shouldReply) {
      window.setTimeout(() => showInteraction(item, choiceIndex), 260);
      return;
    }

    window.setTimeout(advanceRound, 680);
  }

  function verdict() {
    const [love, radar, standard, chaos] = state.stats;
    if (radar >= 75 && standard >= 70) return ['戀愛 FBI', '他甚至還沒開始說謊，妳已經發現時間線對不上。雷達很強，底線也在線。'];
    if (love >= 75 && chaos >= 70) return ['紅旗收藏家', '妳不是看不到警訊，妳只是常常覺得：「但他真的很有吸引力。」'];
    if (standard >= 80) return ['高標準玩家', '妳不是難搞，妳只是懶得替別人的問題找理由。'];
    if (chaos >= 75) return ['混亂系女主角', '妳的人生不缺故事。缺的是姐妹把手機拿走。'];
    if (love >= 70) return ['心動派玩家', '妳願意相信感覺，也願意再給一次機會。記得讓雷達一起上線。'];
    return ['清醒但會心動', '妳看得到警訊，也不會完全拒絕浪漫。危險程度：可控。'];
  }

  function dominantTrait() {
    const max = Math.max(...state.stats);
    const index = state.stats.indexOf(max);
    const messages = ['今晚妳最相信感覺。','今晚妳的警報器最敏銳。','今晚妳的底線最清楚。','今晚妳最容易把故事演成續集。'];
    return `${labels[index]} ${max} // ${messages[index]}`;
  }

  function finish() {
    const [name, description] = verdict();
    $('className').textContent = name;
    $('classDesc').textContent = description;
    state.stats.forEach((value, i) => { $('r' + i).textContent = value; });
    $('summaryLine').textContent = dominantTrait();
    $('dex').innerHTML = state.seen.map(type => `<span>${type}</span>`).join('');
    $('progressFill').style.width = '100%';
    $('end').classList.remove('hidden');
  }

  function resultText() {
    const [name] = verdict();
    return ['RED FLAG DETECTOR', `RESULT: ${name}`, `LOVE ${state.stats[0]} / RADAR ${state.stats[1]} / STANDARD ${state.stats[2]} / CHAOS ${state.stats[3]}`, dominantTrait(), `DETECTED: ${state.seen.join('、')}`].join('\n');
  }

  async function copyResult() {
    const text = resultText();
    try { await navigator.clipboard.writeText(text); }
    catch {
      const area = document.createElement('textarea'); area.value = text; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
    }
    $('copyStatus').textContent = '已複製結果';
    $('copyStatus').classList.remove('hidden');
    window.setTimeout(() => $('copyStatus').classList.add('hidden'), 1600);
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = [...text]; let line = ''; let row = 0;
    chars.forEach((ch, i) => {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line, x, y + row * lineHeight); line = ch; row += 1; }
      else line = test;
      if (i === chars.length - 1) ctx.fillText(line, x, y + row * lineHeight);
    });
    return y + (row + 1) * lineHeight;
  }

  function saveResultCard() {
    const canvas = $('resultCanvas'); const ctx = canvas.getContext('2d'); const [name, description] = verdict();
    ctx.fillStyle = '#07090b'; ctx.fillRect(0, 0, 1080, 1920);
    ctx.strokeStyle = '#364049'; ctx.lineWidth = 4; ctx.strokeRect(70, 70, 940, 1780);
    ctx.fillStyle = '#d2b06d'; ctx.font = '700 54px Georgia'; ctx.textAlign = 'center'; ctx.fillText('RED FLAG DETECTOR', 540, 180);
    ctx.fillStyle = '#62c7c9'; ctx.font = '24px monospace'; ctx.fillText('PLAYER FILE // TONIGHT’S VERDICT', 540, 245);
    ctx.fillStyle = '#efe4cc'; ctx.font = '700 76px serif'; ctx.fillText(name, 540, 390);
    ctx.textAlign = 'left'; ctx.fillStyle = '#9b9f98'; ctx.font = '30px sans-serif';
    let y = wrapText(ctx, description, 130, 480, 820, 48) + 75;
    labels.forEach((label, i) => {
      ctx.fillStyle = '#8f9693'; ctx.font = '24px monospace'; ctx.fillText(label, 130, y);
      ctx.fillStyle = '#efe4cc'; ctx.font = '700 54px monospace'; ctx.fillText(String(state.stats[i]), 130, y + 60);
      ctx.strokeStyle = '#263038'; ctx.strokeRect(360, y + 12, 570, 34);
      ctx.fillStyle = '#d2b06d'; ctx.fillRect(360, y + 12, 570 * (state.stats[i] / 100), 34);
      y += 165;
    });
    ctx.fillStyle = '#d2b06d'; ctx.font = '28px monospace'; wrapText(ctx, dominantTrait(), 130, y + 30, 820, 44);
    ctx.fillStyle = '#666d6b'; ctx.font = '22px monospace'; ctx.fillText('RELATIONSHIP LAB // BUILD 3.2', 130, 1760);
    const link = document.createElement('a'); link.download = 'red-flag-detector-result.png'; link.href = canvas.toDataURL('image/png'); link.click();
    $('copyStatus').textContent = '結果卡已產生'; $('copyStatus').classList.remove('hidden'); window.setTimeout(() => $('copyStatus').classList.add('hidden'), 1600);
  }

  function startGame() {
    state.deck = buildDeck(state.rounds); state.index = 0; state.stats = [50, 50, 50, 50]; state.seen = []; state.locked = false;
    hideInteraction(); updateStats(); updateProgress(); $('end').classList.add('hidden'); $('start').classList.add('hidden'); renderRound();
  }

  function resetToStart() {
    hideInteraction(); $('end').classList.add('hidden'); $('start').classList.remove('hidden'); $('copyStatus').classList.add('hidden');
  }

  document.querySelectorAll('.mode-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(item => item.classList.remove('active'));
      button.classList.add('active'); state.rounds = Number(button.dataset.rounds); state.mode = button.dataset.mode;
    });
  });

  $('startBtn').addEventListener('click', startGame);
  $('again').addEventListener('click', resetToStart);
  $('copyResult').addEventListener('click', copyResult);
  $('saveCard').addEventListener('click', saveResultCard);
  $('continueBtn').addEventListener('click', advanceRound);

  document.addEventListener('keydown', event => {
    if (!$('start').classList.contains('hidden') || !$('end').classList.contains('hidden')) return;

    if (!$('interactionPanel').classList.contains('hidden')) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        $('continueBtn').click();
      }
      return;
    }

    if (state.locked) return;
    const index = keyMap[event.key.toLowerCase()];
    if (index === undefined) return;
    const button = $('choices').querySelector(`[data-choice="${index}"]`);
    if (button) button.click();
  });

  updateStats();
})();
