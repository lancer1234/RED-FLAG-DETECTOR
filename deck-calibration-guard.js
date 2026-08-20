(() => {
  const CALIBRATION_IDS = new Set([
    'P01-01','P01-09','P02-08','P04-02','P04-06','P04-09','P05-08','P06-01',
    'P06-07','P06-10','P09-01','P09-07','P10-05','P11-03','P12-04','P13-01',
    'P14-01','P15-01','P16-01','P17-01','P17-04','P18-01','P19-01','P20-01'
  ]);

  const data = window.RED_FLAG_DATA || [];
  const startBtn = document.getElementById('startBtn');
  if (!startBtn || typeof startBtn.onclick !== 'function' || !data.length) return;

  const nativeStart = startBtn.onclick;
  const nativeRandom = Math.random.bind(Math);
  const nativeFilter = Array.prototype.filter;

  function shuffle(list) {
    const a = [...list];
    for (let i=a.length-1;i>0;i--) {
      const j = Math.floor(nativeRandom()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  function selectedRounds() {
    const active = document.querySelector('.mode-btn.active');
    return Number(active?.dataset?.rounds || 20);
  }

  function quotaFor(rounds) {
    return rounds >= 50 ? 12 : 6;
  }

  function preparePlan(rounds) {
    const eventCount = rounds >= 15 ? 2 : 1;
    const coreRounds = rounds - eventCount;
    const all = [...data];
    const rare = nativeFilter.call(all, x => x.rare);
    const singles = nativeFilter.call(all, x => !x.rare && !x.arc);
    const arcs = new Map();
    nativeFilter.call(all, x => x.arc).forEach(x => {
      if (!arcs.has(x.arc)) arcs.set(x.arc, []);
      arcs.get(x.arc).push(x);
    });
    [...arcs.values()].forEach(group => group.sort((a,b)=>(a.stage||0)-(b.stage||0)));

    // Keep the original feel: arcs remain common and rare files remain occasional.
    const includeArc = arcs.size > 0 && nativeRandom() < .90;
    const includeRare = rare.length > 0 && nativeRandom() < .25;
    const chosenArc = includeArc ? shuffle([...arcs.values()])[0] : [];
    const chosenRare = includeRare ? shuffle(rare) : [];
    const arcCalibration = chosenArc.filter(x => CALIBRATION_IDS.has(x.id)).length;

    const fillerSlots = Math.max(0, coreRounds - chosenArc.length - (includeRare ? 1 : 0));
    const calibrationSingles = shuffle(singles.filter(x => CALIBRATION_IDS.has(x.id)));
    const normalSingles = shuffle(singles.filter(x => !CALIBRATION_IDS.has(x.id)));
    const neededCalibration = Math.max(0, quotaFor(rounds) - arcCalibration);
    const calTake = Math.min(fillerSlots, Math.max(neededCalibration, 0), calibrationSingles.length);

    let selectedSingles = calibrationSingles.slice(0, calTake);
    const remainingSlots = fillerSlots - selectedSingles.length;
    selectedSingles.push(...normalSingles.slice(0, remainingSlots));

    if (selectedSingles.length < fillerSlots) {
      const used = new Set(selectedSingles.map(x => x.id));
      selectedSingles.push(...calibrationSingles.filter(x => !used.has(x.id)).slice(0, fillerSlots-selectedSingles.length));
    }

    // If a future content change reduces the calibration pool, report it rather
    // than cloning cards or silently changing scoring semantics.
    const guaranteed = selectedSingles.filter(x => CALIBRATION_IDS.has(x.id)).length + arcCalibration;
    return {
      rounds,
      quota: quotaFor(rounds),
      guaranteed,
      includeArc,
      includeRare,
      chosenArc,
      rare,
      selectedSingles
    };
  }

  startBtn.onclick = function(...args) {
    const plan = preparePlan(selectedRounds());
    const originalFilter = data.filter;
    const originalRandom = Math.random;
    let filterCall = 0;
    let randomCall = 0;

    // app-v2's buildDeck is closure-private. During only this synchronous call,
    // provide it a pre-balanced view of the same data arrays. Nothing persists
    // after the deck has been built.
    data.filter = function(callback, thisArg) {
      filterCall += 1;
      if (filterCall === 1) return plan.rare;
      if (filterCall === 2) return plan.selectedSingles;
      if (filterCall === 3) return plan.chosenArc;
      return nativeFilter.call(this, callback, thisArg);
    };

    Math.random = function() {
      randomCall += 1;
      if (randomCall === 1) return plan.includeArc ? 0 : .999999;
      if (randomCall === 2) return plan.includeRare ? 0 : .999999;
      return nativeRandom();
    };

    try {
      const result = nativeStart.apply(this, args);
      window.RED_FLAG_DECK_CALIBRATION = {
        rounds: plan.rounds,
        requestedMinimum: plan.quota,
        guaranteedMinimum: plan.guaranteed,
        arcIncluded: plan.includeArc,
        rareIncluded: plan.includeRare
      };
      return result;
    } finally {
      data.filter = originalFilter;
      Math.random = originalRandom;
    }
  };
})();