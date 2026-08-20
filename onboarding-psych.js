(() => {
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'rfd-onboarding-v1';
  const labels = ['親密焦慮','親密迴避','界線清晰','衝動決策'];

  // Psychology-informed calibration layer.
  // Each scenario/choice is hand-labelled. No keyword inference is used.
  // Values are descriptive game scores, not validated clinical scale scores.
  // Order: [anxiety, avoidance, boundary, impulsivity]
  const calibration = {
    'P01-01': [[72,24,78,32],[55,20,86,24],[34,45,38,64]],
    'P01-09': [[68,22,80,30],[52,18,84,22],[38,44,42,60]],
    'P02-08': [[46,26,84,20],[35,42,72,20],[66,18,44,54]],
    'P04-02': [[70,18,82,26],[48,20,88,20],[30,48,42,56]],
    'P04-06': [[62,20,88,22],[45,24,84,18],[28,52,38,60]],
    'P04-09': [[64,18,90,20],[46,22,86,18],[30,48,40,58]],
    'P05-08': [[58,24,76,24],[42,30,82,18],[32,46,40,60]],
    'P06-01': [[70,18,74,40],[48,30,82,24],[34,44,38,68]],
    'P06-07': [[72,18,78,38],[50,28,84,24],[30,46,36,72]],
    'P06-10': [[50,20,88,18],[34,40,80,20],[62,24,44,58]],
    'P09-01': [[66,20,72,28],[44,28,78,20],[30,48,42,56]],
    'P09-07': [[58,18,82,24],[40,34,76,18],[32,42,44,60]],
    'P10-05': [[46,22,86,18],[38,28,82,20],[54,24,46,50]],
    'P11-03': [[60,18,88,22],[44,26,84,18],[34,42,40,62]],
    'P12-04': [[54,18,82,28],[40,30,78,20],[30,46,42,64]],
    'P13-01': [[42,20,76,28],[34,30,80,18],[28,40,44,66]],
    'P14-01': [[50,24,84,24],[40,28,88,18],[30,44,42,58]],
    'P15-01': [[48,22,84,22],[38,30,80,18],[28,46,40,64]],
    'P16-01': [[44,18,82,20],[34,28,86,18],[28,42,44,60]],
    'P17-01': [[60,20,84,26],[46,24,88,20],[30,46,38,66]],
    'P17-04': [[58,18,86,22],[42,26,82,18],[30,48,36,64]],
    'P18-01': [[44,24,88,18],[36,30,84,18],[26,44,42,62]],
    'P19-01': [[64,18,82,26],[56,20,86,22],[30,44,38,66]],
    'P20-01': [[52,22,88,22],[42,28,92,18],[28,46,40,62]]
  };

  const psych = { sums:[0,0,0,0], samples:0, used:new Set() };

  function currentItem(){
    const quote = $('quote');
    const tagged = quote?.dataset?.scenarioId || '';
    const items = [...(window.RED_FLAG_DATA || []), ...(window.RED_FLAG_EVENTS || [])];
    if (tagged) return items.find(item => item.id === tagged) || null;
    const text = String(quote?.textContent || '').trim();
    return items.find(item => String(item.quote || '').trim() === text) || null;
  }

  function resetPsych(){
    psych.sums = [0,0,0,0];
    psych.samples = 0;
    psych.used.clear();
    renderPsych();
  }

  function recordChoice(button){
    const item = currentItem();
    const matrix = item ? calibration[item.id] : null;
    if (!item || !matrix || psych.used.has(item.id)) return;
    const index = Number(button?.dataset?.choice);
    if (!Number.isInteger(index) || index < 0 || index > 2 || !matrix[index]) return;
    matrix[index].forEach((v,i) => psych.sums[i] += v);
    psych.samples += 1;
    psych.used.add(item.id);
  }

  function scores(){
    if (!psych.samples) return [50,50,50,50];
    return psych.sums.map(v => Math.round(v / psych.samples));
  }

  function confidence(){
    if (psych.samples >= 8) return '較高';
    if (psych.samples >= 5) return '中等';
    return '低';
  }

  function ensurePsychResult(){
    const terminal = $('resultTerminal');
    if (!terminal || $('psychResult')) return;
    const node = document.createElement('section');
    node.id = 'psychResult';
    node.className = 'psych-result';
    const anchor = $('traitResult') || terminal.querySelector('.dex');
    if (anchor?.nextSibling) terminal.insertBefore(node, anchor.nextSibling);
    else terminal.appendChild(node);
  }

  function renderPsych(){
    ensurePsychResult();
    const node = $('psychResult');
    if (!node) return;
    const vals = scores();
    const rows = labels.map((label,i) => `
      <div class="psych-row">
        <span>${label}</span>
        <div class="psych-track"><i style="width:${vals[i]}%"></i></div>
        <b>${vals[i]}</b>
      </div>`).join('');
    node.innerHTML = `
      <div class="psych-kicker">RELATIONSHIP PATTERN // 關係傾向</div>
      <div class="psych-meta">參考度：${confidence()} · 本局校準情境 ${psych.samples} 題</div>
      ${rows}
      <p>依本局部分日常關係情境的選擇整理，用來幫助自我觀察。這不是心理診斷，也不是正式心理量表分數。</p>`;
  }

  function installStyles(){
    if ($('onboardingPsychStyles')) return;
    const style = document.createElement('style');
    style.id = 'onboardingPsychStyles';
    style.textContent = `
      .tutorial-overlay{z-index:35}.tutorial-terminal{width:min(92vw,390px);min-height:330px;display:flex;flex-direction:column;justify-content:space-between}.tutorial-step{font-size:8px;color:#62c7c9;letter-spacing:.14em;margin-bottom:18px}.tutorial-title{font-family:"Noto Serif TC","Songti TC",serif;font-size:28px;line-height:1.3;color:#d2b06d;margin-bottom:18px}.tutorial-copy{font-family:"Noto Serif TC","Songti TC",serif;font-size:17px;line-height:1.75;color:#efe4cc;white-space:pre-line}.tutorial-copy strong{color:#62c7c9}.tutorial-actions{margin-top:24px}.tutorial-skip{margin-top:8px;text-align:center;color:#68716f;font-size:8px;cursor:pointer}.howto-btn{margin-top:8px}.first-choice-hint{margin:8px 0 0;text-align:center;color:#7f8b89;font-size:8px;animation:hintPulse 1.4s ease-in-out infinite}.psych-result{margin-top:12px;border:1px solid #303b42;background:#0a1014;padding:11px 10px}.psych-kicker{color:#62c7c9;font-size:9px;letter-spacing:.12em}.psych-meta{margin:6px 0 10px;color:#8f9693;font-size:8px}.psych-row{display:grid;grid-template-columns:64px 1fr 30px;align-items:center;gap:7px;margin:7px 0;font-size:8px;color:#aab1ae}.psych-track{height:7px;border:1px solid #2f3a40;background:#11171c;overflow:hidden}.psych-track i{display:block;height:100%;background:linear-gradient(90deg,#62c7c9,#d2b06d)}.psych-row b{text-align:right;color:#efe4cc;font-size:10px}.psych-result p{margin:10px 0 0;color:#6f7976;font-size:7px;line-height:1.6}@keyframes hintPulse{50%{opacity:.5}}@media(max-width:360px){.tutorial-title{font-size:24px}.tutorial-copy{font-size:16px}.psych-row{grid-template-columns:58px 1fr 28px}}
    `;
    document.head.appendChild(style);
  }

  const slides = [
    {
      title:'這不是考試。',
      body:'接下來妳會遇到約會、曖昧、交往，以及一些很荒謬的關係事件。\n\n<strong>選妳真的會做的，不要選看起來最正確的。</strong>'
    },
    {
      title:'妳的選擇會留下痕跡。',
      body:'LOVE · RADAR · STANDARD · CHAOS 會跟著妳的選擇改變。\n\n<strong>選完才會看到影響，沒有哪一條是越高越好。</strong>'
    },
    {
      title:'有些人會再回來。',
      body:'角色可能記得妳之前怎麼回答，某些事件也會在幾題後突然出現後續。\n\n<strong>看到怪事，照自己的直覺處理就好。</strong>'
    }
  ];

  function ensureTutorial(){
    if ($('tutorialOverlay')) return;
    const overlay = document.createElement('section');
    overlay.id = 'tutorialOverlay';
    overlay.className = 'overlay tutorial-overlay hidden';
    overlay.innerHTML = `
      <div class="terminal tutorial-terminal">
        <div>
          <div class="tutorial-step" id="tutorialStep"></div>
          <div class="tutorial-title" id="tutorialTitle"></div>
          <div class="tutorial-copy" id="tutorialCopy"></div>
        </div>
        <div class="tutorial-actions">
          <button class="pxbtn" id="tutorialNext">繼續 / NEXT</button>
          <div class="tutorial-skip" id="tutorialSkip">關閉說明</div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }

  let tutorialIndex = 0;
  let launchAfterTutorial = false;
  let startGame = null;

  function renderTutorial(){
    const slide = slides[tutorialIndex];
    $('tutorialStep').textContent = `HOW TO PLAY // ${tutorialIndex + 1} / ${slides.length}`;
    $('tutorialTitle').textContent = slide.title;
    $('tutorialCopy').innerHTML = slide.body;
    $('tutorialNext').textContent = tutorialIndex === slides.length - 1 ? '開始掃描 / START SCAN' : '繼續 / NEXT';
  }

  function closeTutorial(){ $('tutorialOverlay')?.classList.add('hidden'); }
  function openTutorial(launchAfter=false){
    tutorialIndex = 0;
    launchAfterTutorial = launchAfter;
    ensureTutorial();
    renderTutorial();
    $('tutorialOverlay').classList.remove('hidden');
  }

  function installTutorial(){
    const startBtn = $('startBtn');
    if (!startBtn) return;
    startGame = startBtn.onclick;

    const help = document.createElement('button');
    help.type = 'button';
    help.id = 'howToPlay';
    help.className = 'pxbtn secondary howto-btn';
    help.textContent = '玩法說明 / HOW TO PLAY';
    startBtn.insertAdjacentElement('afterend', help);

    startBtn.onclick = () => {
      resetPsych();
      let seen = false;
      try { seen = localStorage.getItem(STORAGE_KEY) === '1'; } catch {}
      if (seen) { if (typeof startGame === 'function') startGame(); return; }
      openTutorial(true);
    };
    help.onclick = () => openTutorial(false);

    ensureTutorial();
    $('tutorialNext').onclick = () => {
      if (tutorialIndex < slides.length - 1) {
        tutorialIndex += 1;
        renderTutorial();
        return;
      }
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
      closeTutorial();
      if (launchAfterTutorial && typeof startGame === 'function') startGame();
    };
    $('tutorialSkip').onclick = closeTutorial;
  }

  function installFirstChoiceHint(){
    const choices = $('choices');
    if (!choices) return;
    let shown = false;
    const hint = document.createElement('div');
    hint.className = 'first-choice-hint hidden';
    hint.textContent = '選一個最像妳真實反應的答案 ↓';
    choices.parentNode.insertBefore(hint, choices);

    const observer = new MutationObserver(() => {
      if (shown || choices.children.length === 0 || !$('start')?.classList.contains('hidden')) return;
      hint.classList.remove('hidden');
      shown = true;
    });
    observer.observe(choices, { childList:true });
    choices.addEventListener('click', () => hint.remove(), { once:true });
  }

  function installPsychTracking(){
    const choices = $('choices');
    if (!choices) return;
    choices.addEventListener('click', event => {
      const button = event.target.closest('button[data-choice]');
      if (!button) return;
      recordChoice(button);
    }, true);

    const end = $('end');
    if (end) {
      const observer = new MutationObserver(() => {
        if (!end.classList.contains('hidden')) requestAnimationFrame(renderPsych);
      });
      observer.observe(end, { attributes:true, attributeFilter:['class'] });
    }
  }

  installStyles();
  installTutorial();
  installFirstChoiceHint();
  installPsychTracking();
  ensurePsychResult();
})();
