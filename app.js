(() => {
  const data = window.RED_FLAG_DATA || [];
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

  function updateStats() {
    state.stats.forEach((value, i) => {
      $('s' + i).style.width = value + '%';
    });
  }

  function updateProgress() {
    const percent = state.deck.length ? (state.index / state.deck.length) * 100 : 0;
    $('progressFill').style.width = percent + '%';
  }

  function drawPixel(seed, type) {
    const canvas = $('portrait');
    const ctx = canvas.getContext('2d');
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

    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, 224, 154);
    for (let i = 0; i < 40; i += 1) {
      ctx.fillStyle = i % 2 ? p[1] : '#0b0e11';
      ctx.fillRect((i * 37 + seed * 13) % 224, (i * 19 + seed * 7) % 154, 4, 4);
    }

    ctx.fillStyle = p[1];
    ctx.fillRect(18, 18, 188, 118);
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(26, 26, 172, 102);
    ctx.fillStyle = p[4];
    ctx.fillRect(68, 103, 88, 28);
    ctx.fillStyle = p[2];
    ctx.fillRect(91, 45, 42, 58);
    ctx.fillRect(101, 94, 22, 18);
    ctx.fillStyle = p[3];
    ctx.fillRect(85, 38, 54, 20);
    ctx.fillRect(87, 45, 8, 36);
    ctx.fillRect(132, 45, 8, 38);
    ctx.fillStyle = '#0a0b0c';
    ctx.fillRect(99, 66, 6, 6);
    ctx.fillRect(120, 66, 6, 6);
    ctx.fillRect(108, 84, 12, 4);

    if (type.includes('前任')) {
      ctx.fillStyle = '#b5424d';
      ctx.fillRect(160, 34, 22, 6);
      ctx.fillRect(168, 26, 6, 22);
    }
    if (type.includes('型')) {
      ctx.fillStyle = '#d0ad65';
      ctx.fillRect(30, 110, 36, 6);
      ctx.fillRect(158, 110, 36, 6);
    }
    if (seed % 3 === 0) {
      ctx.fillStyle = '#c6a55f';
      ctx.fillRect(108, 112, 8, 8);
    }
    if (seed % 4 === 0) {
      ctx.fillStyle = '#d7d7d7';
      ctx.fillRect(84, 64, 19, 4);
      ctx.fillRect(121, 64, 19, 4);
      ctx.fillRect(103, 66, 18, 3);
    }
  }

  function renderRound() {
    const item = state.deck[state.index];
    if (!item) return;

    state.locked = false;
    $('feedback').classList.add('hidden');
    $('feedback').textContent = '';
    $('target').textContent = 'TARGET #' + String(state.index + 1).padStart(2, '0');
    $('count').textContent = String(state.index + 1).padStart(2, '0') + ' / ' + state.deck.length;
    $('role').textContent = item.role.toUpperCase() + ' // ' + item.type;
    $('who').textContent = item.who;
    $('quote').textContent = item.quote;
    $('dialog').className = 'dialog' + (item.special ? ' special' : '');
    $('modeLabel').textContent = state.mode;

    drawPixel((data.indexOf(item) + state.index) % 9, item.type);

    const choices = $('choices');
    choices.innerHTML = '';
    item.options.forEach((choice, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.choice = String(i);
      button.innerHTML = `<b>${['A','B','C'][i]}｜${choice.text}</b><small>${choice.note}</small>`;
      button.addEventListener('click', () => choose(choice, item, button));
      choices.appendChild(button);
    });

    updateProgress();
  }

  function deltaSummary(delta) {
    return delta
      .map((value, i) => ({ value, label: labels[i] }))
      .filter(item => item.value !== 0)
      .map(item => `${item.label} ${item.value > 0 ? '+' : ''}${item.value}`)
      .join(' · ');
  }

  function choose(choice, item, selectedButton) {
    if (state.locked) return;
    state.locked = true;

    const buttons = [...$('choices').querySelectorAll('button')];
    buttons.forEach(button => { button.disabled = true; });
    selectedButton.classList.add('selected');

    choice.delta.forEach((value, i) => {
      state.stats[i] = clamp(state.stats[i] + value);
    });

    if (!state.seen.includes(item.type)) state.seen.push(item.type);
    updateStats();

    const feedback = $('feedback');
    feedback.textContent = `${choice.note} // ${deltaSummary(choice.delta)}`;
    feedback.classList.remove('hidden');

    $('game').classList.add('glitch');
    window.setTimeout(() => $('game').classList.remove('glitch'), 180);
    if (navigator.vibrate) navigator.vibrate(18);

    state.index += 1;
    updateProgress();

    window.setTimeout(() => {
      if (state.index >= state.deck.length) finish();
      else renderRound();
    }, 650);
  }

  function verdict() {
    const [love, radar, standard, chaos] = state.stats;

    if (radar >= 75 && standard >= 70) {
      return ['戀愛 FBI', '他甚至還沒開始說謊，妳已經發現時間線對不上。雷達很強，底線也在線。'];
    }
    if (love >= 75 && chaos >= 70) {
      return ['紅旗收藏家', '妳不是看不到警訊，妳只是常常覺得：「但他真的很有吸引力。」'];
    }
    if (standard >= 80) {
      return ['高標準玩家', '妳不是難搞，妳只是懶得替別人的問題找理由。'];
    }
    if (chaos >= 75) {
      return ['混亂系女主角', '妳的人生不缺故事。缺的是姐妹把手機拿走。'];
    }
    if (love >= 70) {
      return ['心動派玩家', '妳願意相信感覺，也願意再給一次機會。記得讓雷達一起上線。'];
    }
    return ['清醒但會心動', '妳看得到警訊，也不會完全拒絕浪漫。危險程度：可控。'];
  }

  function dominantTrait() {
    const max = Math.max(...state.stats);
    const index = state.stats.indexOf(max);
    const messages = [
      '今晚妳最相信感覺。',
      '今晚妳的警報器最敏銳。',
      '今晚妳的底線最清楚。',
      '今晚妳最容易把故事演成續集。'
    ];
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
    return [
      'RED FLAG DETECTOR',
      `RESULT: ${name}`,
      `LOVE ${state.stats[0]} / RADAR ${state.stats[1]} / STANDARD ${state.stats[2]} / CHAOS ${state.stats[3]}`,
      dominantTrait(),
      `DETECTED: ${state.seen.join('、')}`
    ].join('\n');
  }

  async function copyResult() {
    const text = resultText();
    try {
      await navigator.clipboard.writeText(text);
      $('copyStatus').textContent = '已複製結果';
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      $('copyStatus').textContent = '已複製結果';
    }
    $('copyStatus').classList.remove('hidden');
    window.setTimeout(() => $('copyStatus').classList.add('hidden'), 1600);
  }

  function startGame() {
    state.deck = shuffle(data).slice(0, state.rounds);
    state.index = 0;
    state.stats = [50, 50, 50, 50];
    state.seen = [];
    state.locked = false;
    updateStats();
    updateProgress();
    $('end').classList.add('hidden');
    $('start').classList.add('hidden');
    renderRound();
  }

  function resetToStart() {
    $('end').classList.add('hidden');
    $('start').classList.remove('hidden');
    $('copyStatus').classList.add('hidden');
  }

  document.querySelectorAll('.mode-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      state.rounds = Number(button.dataset.rounds);
      state.mode = button.dataset.mode;
    });
  });

  $('startBtn').addEventListener('click', startGame);
  $('again').addEventListener('click', resetToStart);
  $('copyResult').addEventListener('click', copyResult);

  document.addEventListener('keydown', event => {
    if (state.locked || !$('start').classList.contains('hidden') || !$('end').classList.contains('hidden')) return;
    const index = keyMap[event.key.toLowerCase()];
    if (index === undefined) return;
    const button = $('choices').querySelector(`[data-choice="${index}"]`);
    if (button) button.click();
  });

  updateStats();
})();
