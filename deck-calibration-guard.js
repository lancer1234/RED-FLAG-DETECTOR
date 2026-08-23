(() => {
  const CALIBRATION_IDS = new Set([
    'P01-01','P01-03','P01-04','P01-08','P01-09','P01-10',
    'P02-04','P02-07','P02-08','P02-09','P02-10',
    'P03-03','P03-05','P03-08','P03-10',
    'P04-02','P04-06','P04-09','P05-08','P06-01','P06-07','P06-10',
    'P09-01','P09-07','P10-05','P11-03','P12-04','P13-01','P14-01',
    'P15-01','P16-01','P17-01','P17-04','P18-01','P19-01','P20-01'
  ]);

  const HISTORY_KEY = 'rfd-deck-history-v2';
  const data = window.RED_FLAG_DATA || [];
  const eventData = window.RED_FLAG_EVENTS || [];
  const startBtn = document.getElementById('startBtn');
  const againBtn = document.getElementById('again');
  if (!startBtn || typeof startBtn.onclick !== 'function' || !data.length) return;

  const nativeRandom = Math.random.bind(Math);
  const nativeFilter = Array.prototype.filter;
  const nativeStart = startBtn.onclick;
  const nativeAgain = typeof againBtn?.onclick === 'function' ? againBtn.onclick : null;

  function shuffle(list) {
    const a = [...list];
    for (let i=a.length-1;i>0;i--) {
      const j = Math.floor(nativeRandom()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  function loadHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
      return {
        runs: Array.isArray(parsed.runs) ? parsed.runs.filter(Array.isArray).slice(0,2) : [],
        current: Array.isArray(parsed.current) ? parsed.current : []
      };
    } catch {
      return { runs:[], current:[] };
    }
  }

  function saveHistory(state) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(state)); } catch {}
  }

  function archiveCurrentRun() {
    const state = loadHistory();
    if (state.current.length) {
      state.runs.unshift([...new Set(state.current)]);
      state.runs = state.runs.slice(0,2);
    }
    state.current = [];
    saveHistory(state);
    return state;
  }

  function recentSet(history) {
    return new Set(history.runs.flat());
  }

  function preferFresh(list, recent) {
    const mixed = shuffle(list);
    return [
      ...mixed.filter(item => !recent.has(item.id)),
      ...mixed.filter(item => recent.has(item.id))
    ];
  }

  function selectedRounds() {
    const active = document.querySelector('.mode-btn.active');
    return Number(active?.dataset?.rounds || 20);
  }

  function quotaFor(rounds) {
    return rounds >= 50 ? 16 : 8;
  }

  function chooseArc(arcs, recent) {
    const groups = [...arcs.values()];
    if (!groups.length) return [];
    const scored = groups.map(group => ({
      group,
      repeats: group.reduce((n,item) => n + (recent.has(item.id) ? 1 : 0), 0)
    }));
    const best = Math.min(...scored.map(x => x.repeats));
    return shuffle(scored.filter(x => x.repeats === best).map(x => x.group))[0] || [];
  }

  function preparePlan(rounds, history) {
    const eventCount = rounds >= 15 ? 2 : 1;
    const coreRounds = rounds - eventCount;
    const recent = recentSet(history);
    const all = [...data];
    const rare = nativeFilter.call(all, x => x.rare);
    const singles = nativeFilter.call(all, x => !x.rare && !x.arc);
    const arcs = new Map();
    nativeFilter.call(all, x => x.arc).forEach(x => {
      if (!arcs.has(x.arc)) arcs.set(x.arc, []);
      arcs.get(x.arc).push(x);
    });
    [...arcs.values()].forEach(group => group.sort((a,b)=>(a.stage||0)-(b.stage||0)));

    const includeArc = arcs.size > 0 && nativeRandom() < .90;
    const includeRare = rare.length > 0 && nativeRandom() < .25;
    const chosenArc = includeArc ? chooseArc(arcs, recent) : [];
    const orderedRare = preferFresh(rare, recent);
    const chosenRare = includeRare ? orderedRare.slice(0,1) : [];
    const arcCalibration = chosenArc.filter(x => CALIBRATION_IDS.has(x.id)).length;

    const fillerSlots = Math.max(0, coreRounds - chosenArc.length - chosenRare.length);
    const calibrationSingles = preferFresh(singles.filter(x => CALIBRATION_IDS.has(x.id)), recent);
    const normalSingles = preferFresh(singles.filter(x => !CALIBRATION_IDS.has(x.id)), recent);
    const neededCalibration = Math.max(0, quotaFor(rounds) - arcCalibration);
    const calTake = Math.min(fillerSlots, neededCalibration, calibrationSingles.length);

    let selectedSingles = calibrationSingles.slice(0, calTake);
    const remainingSlots = fillerSlots - selectedSingles.length;
    selectedSingles.push(...normalSingles.slice(0, remainingSlots));

    if (selectedSingles.length < fillerSlots) {
      const used = new Set(selectedSingles.map(x => x.id));
      selectedSingles.push(...calibrationSingles.filter(x => !used.has(x.id)).slice(0, fillerSlots-selectedSingles.length));
    }

    const guaranteed = selectedSingles.filter(x => CALIBRATION_IDS.has(x.id)).length + arcCalibration;
    const repeatCount = [...selectedSingles, ...chosenArc, ...chosenRare].filter(x => recent.has(x.id)).length;
    return {
      rounds,
      quota: quotaFor(rounds),
      guaranteed,
      includeArc,
      includeRare,
      chosenArc,
      rare: orderedRare,
      selectedSingles,
      repeatCount,
      recentRuns: history.runs.length,
      poolSize: CALIBRATION_IDS.size
    };
  }

  function runWithPlan(nativeHandler, thisArg, args) {
    const history = archiveCurrentRun();
    const plan = preparePlan(selectedRounds(), history);
    const originalFilter = data.filter;
    const originalRandom = Math.random;
    let filterCall = 0;
    let randomCall = 0;

    data.filter = function(callback, thisArg2) {
      filterCall += 1;
      if (filterCall === 1) return plan.rare;
      if (filterCall === 2) return plan.selectedSingles;
      if (filterCall === 3) return plan.chosenArc;
      return nativeFilter.call(this, callback, thisArg2);
    };

    Math.random = function() {
      randomCall += 1;
      if (randomCall === 1) return plan.includeArc ? 0 : .999999;
      if (randomCall === 2) return plan.includeRare ? 0 : .999999;
      return nativeRandom();
    };

    try {
      const result = nativeHandler.apply(thisArg, args);
      window.RED_FLAG_DECK_CALIBRATION = {
        rounds: plan.rounds,
        calibrationPool: plan.poolSize,
        requestedMinimum: plan.quota,
        guaranteedMinimum: plan.guaranteed,
        arcIncluded: plan.includeArc,
        rareIncluded: plan.includeRare,
        recentRunsAvoided: plan.recentRuns,
        plannedRecentRepeats: plan.repeatCount
      };
      requestAnimationFrame(recordActiveCard);
      return result;
    } finally {
      data.filter = originalFilter;
      Math.random = originalRandom;
    }
  }

  function currentCardId() {
    const quote = document.getElementById('quote');
    const text = String(quote?.textContent || '').trim();
    if (!text) return '';
    const all = [...data, ...eventData];
    const exact = all.find(item => String(item.quote || '').trim() === text);
    if (exact?.id) return exact.id;
    const tagged = quote?.dataset?.scenarioId || '';
    return all.some(item => item.id === tagged) ? tagged : '';
  }

  function recordActiveCard() {
    const id = currentCardId();
    if (!id) return;
    const state = loadHistory();
    if (!state.current.includes(id)) {
      state.current.push(id);
      saveHistory(state);
    }
  }

  startBtn.onclick = function(...args) {
    return runWithPlan(nativeStart, this, args);
  };

  if (againBtn && nativeAgain) {
    againBtn.onclick = function(...args) {
      return runWithPlan(nativeAgain, this, args);
    };
  }

  const quote = document.getElementById('quote');
  const count = document.getElementById('count');
  let scheduled = false;
  const scheduleRecord = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      recordActiveCard();
    });
  };
  if (quote) new MutationObserver(scheduleRecord).observe(quote, { childList:true, characterData:true, subtree:true });
  if (count) new MutationObserver(scheduleRecord).observe(count, { childList:true, characterData:true, subtree:true });
})();