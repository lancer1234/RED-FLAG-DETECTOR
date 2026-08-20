(() => {
  const $ = id => document.getElementById(id);
  const nativeSetTimeout = window.setTimeout.bind(window);
  const labels = ['LOVE','RADAR','STANDARD','CHAOS'];

  const calibrationIds = new Set([
    'P01-01','P01-09','P02-08','P04-02','P04-06','P04-09','P05-08','P06-01',
    'P06-07','P06-10','P09-01','P09-07','P10-05','P11-03','P12-04','P13-01',
    'P14-01','P15-01','P16-01','P17-01','P17-04','P18-01','P19-01','P20-01'
  ]);

  const run = {
    calibrationSeen: new Set(),
    streakKey: '',
    streak: 0,
    lastRound: 0
  };

  function resetRun() {
    run.calibrationSeen.clear();
    run.streakKey = '';
    run.streak = 0;
    run.lastRound = 0;
  }

  function roundInfo() {
    const match = String($('count')?.textContent || '').match(/(\d+)\s*\/\s*(\d+)/);
    return match ? { round:Number(match[1]), total:Number(match[2]) } : { round:0, total:20 };
  }

  function currentItem() {
    const quoteNode = $('quote');
    const tagged = quoteNode?.dataset?.scenarioId || '';
    const items = [...(window.RED_FLAG_DATA || []), ...(window.RED_FLAG_EVENTS || [])];
    if (tagged) return items.find(item => item.id === tagged) || null;
    const quote = String(quoteNode?.textContent || '').trim();
    return items.find(item => String(item.quote || '').trim() === quote) || null;
  }

  function visibleStats() {
    return [0,1,2,3].map(i => {
      const value = parseFloat($('s'+i)?.style?.width || '50');
      return Number.isFinite(value) ? value : 50;
    });
  }

  function crisisFromStats() {
    const stats = visibleStats();
    for (let i=0;i<4;i++) {
      if (stats[i] <= 0) return { index:i, side:'low' };
      if (stats[i] >= 100) return { index:i, side:'high' };
    }
    return null;
  }

  function feedbackDelta(index) {
    const raw = String($('feedback')?.textContent || '');
    const match = raw.match(new RegExp(`${labels[index]}\\s+([+-]\\d+)`));
    return match ? Number(match[1]) : 0;
  }

  function minimumRound(total) {
    return total >= 50 ? 31 : 13;
  }

  function setExtremeWarning(crisis, reason='') {
    const warning = $('systemWarning');
    if (!warning || !crisis) return;
    const side = crisis.side === 'high' ? 'HIGH' : 'LOW';
    const suffix = reason ? ` · ${reason}` : '';
    warning.textContent = `⚠ ${labels[crisis.index]} EXTREME ${side} // 已進入極端區，持續往同方向選擇才可能提前結束${suffix}`;
    warning.classList.remove('hidden');
  }

  function payloadFor(item, choiceIndex) {
    const interactions = window.RED_FLAG_INTERACTIONS || {};
    if (!item || item.kind === 'event') return { shouldReply:false, story:null, reply:'', consequence:'' };
    const i = Math.min(choiceIndex, 2);
    const shouldReply = typeof interactions.shouldReply === 'function' && interactions.shouldReply(item);
    const story = typeof interactions.storyFor === 'function' ? interactions.storyFor(item, i) : null;
    const reply = story ? story.beats[0] : shouldReply && typeof interactions.characterReply === 'function' ? interactions.characterReply(item, i) : '';
    return { shouldReply, story, reply, consequence:story ? story.beats[1] : '' };
  }

  function showProtectedInteraction(item, choiceIndex) {
    const p = payloadFor(item, choiceIndex);
    if (!p.story && !p.shouldReply) {
      nativeSetTimeout(() => $('continueBtn')?.click(), 140);
      return;
    }

    const personas = window.RED_FLAG_PERSONAS || {};
    const persona = personas[item?.persona] || { role:'對方', name:'UNKNOWN' };
    const panel = $('interactionPanel');
    if (!panel) {
      nativeSetTimeout(() => $('continueBtn')?.click(), 140);
      return;
    }

    panel.className = 'interaction-panel' + (p.story ? ' story' : '');
    $('interactionSpeaker').textContent = (item?.rare || item?.special) ? persona.name : persona.role;
    if (p.story) {
      $('interactionKicker').textContent = p.story.title;
      $('interactionText').textContent = p.story.beats[0];
      $('storyBeat').textContent = p.story.beats[1];
      $('storyBeat').classList.remove('hidden');
    } else {
      $('interactionKicker').textContent = 'RESPONSE // 對方回覆';
      $('interactionText').textContent = p.reply || '「好，我知道了。」';
      $('storyBeat').classList.add('hidden');
    }
    $('continueBtn').textContent = '好吧，繼續 / CONTINUE';
    nativeSetTimeout(() => panel.scrollIntoView({behavior:'smooth',block:'nearest'}), 80);
  }

  function shouldAllowExtreme(snapshot) {
    const { crisis, round, total, delta } = snapshot;
    if (!crisis) return false;

    if (round < minimumRound(total)) {
      run.streakKey = '';
      run.streak = 0;
      setExtremeWarning(crisis, `前 ${total >= 50 ? 30 : 12} 題不會強制結局`);
      return false;
    }
    if (run.calibrationSeen.size < 5) {
      run.streakKey = '';
      run.streak = 0;
      setExtremeWarning(crisis, '目前校準情境不足 5 題');
      return false;
    }

    const outward = crisis.side === 'high' ? delta > 0 : delta < 0;
    if (!outward) {
      run.streakKey = '';
      run.streak = 0;
      setExtremeWarning(crisis);
      return false;
    }

    const key = `${crisis.index}-${crisis.side}`;
    if (run.streakKey === key && run.lastRound === round - 1) run.streak += 1;
    else run.streak = 1;
    run.streakKey = key;
    run.lastRound = round;

    if (run.streak < 3) {
      setExtremeWarning(crisis, `極端持續 ${run.streak}/3`);
      return false;
    }
    return true;
  }

  function isCrisisFinishCallback(fn, delay) {
    if (typeof fn !== 'function' || Number(delay) !== 520) return false;
    try { return /finish\s*\(\s*crisis\s*\)/.test(Function.prototype.toString.call(fn)); }
    catch { return false; }
  }

  window.setTimeout = function(fn, delay, ...args) {
    if (!isCrisisFinishCallback(fn, delay)) return nativeSetTimeout(fn, delay, ...args);

    const crisis = crisisFromStats();
    const { round, total } = roundInfo();
    const selected = $('choices')?.querySelector('button.selected');
    const choiceIndex = Number(selected?.dataset?.choice ?? -1);
    const item = currentItem();
    const delta = crisis ? feedbackDelta(crisis.index) : 0;
    const snapshot = { crisis, round, total, choiceIndex, item, delta };

    return nativeSetTimeout(() => {
      if (shouldAllowExtreme(snapshot)) {
        fn(...args);
        return;
      }
      showProtectedInteraction(snapshot.item, snapshot.choiceIndex);
    }, delay);
  };

  const choices = $('choices');
  if (choices) {
    choices.addEventListener('click', event => {
      const button = event.target.closest('button[data-choice]');
      if (!button) return;
      const item = currentItem();
      const index = Number(button.dataset.choice);
      if (item && calibrationIds.has(item.id) && index >= 0 && index <= 2) run.calibrationSeen.add(item.id);

      nativeSetTimeout(() => {
        if (!crisisFromStats()) {
          run.streakKey = '';
          run.streak = 0;
          run.lastRound = 0;
        }
      }, 0);
    }, true);
  }

  $('startBtn')?.addEventListener('click', resetRun, true);
  $('again')?.addEventListener('click', resetRun, true);

  window.RED_FLAG_EXTREME_POLICY = {
    mode:'sustained',
    protectedRounds:{ full:12, long:30 },
    minimumCalibrationSamples:5,
    requiredConsecutiveOutwardPushes:3
  };
})();