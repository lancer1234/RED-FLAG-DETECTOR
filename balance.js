(() => {
  const LABELS = ['LOVE','RADAR','STANDARD','CHAOS'];
  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));

  function allChoices() {
    const character = Object.values(window.RED_FLAG_FULL_CHOICES || {})
      .flatMap(group => Array.isArray(group) ? group : [])
      .filter(choice => Array.isArray(choice?.delta))
      .map(choice => ({choice, kind:'character'}));

    const events = (window.RED_FLAG_EVENTS || [])
      .flatMap(event => (event.options || []).map(choice => ({choice, kind:'event'})))
      .filter(row => Array.isArray(row.choice?.delta));

    return [...character, ...events];
  }

  function audit(rows) {
    return LABELS.map((label,index) => {
      let positiveCount=0, negativeCount=0, zeroCount=0, positiveSum=0, negativeSum=0;
      rows.forEach(({choice}) => {
        const v = Number(choice.delta[index] || 0);
        if (v > 0) { positiveCount++; positiveSum += v; }
        else if (v < 0) { negativeCount++; negativeSum += Math.abs(v); }
        else zeroCount++;
      });
      const signedCount = positiveCount + negativeCount;
      const magnitude = positiveSum + negativeSum;
      return {
        label,
        positiveCount,
        negativeCount,
        zeroCount,
        positiveSum,
        negativeSum,
        positiveChoicePct: signedCount ? +(positiveCount / signedCount * 100).toFixed(1) : 0,
        negativeChoicePct: signedCount ? +(negativeCount / signedCount * 100).toFixed(1) : 0,
        positiveWeightPct: magnitude ? +(positiveSum / magnitude * 100).toFixed(1) : 0,
        negativeWeightPct: magnitude ? +(negativeSum / magnitude * 100).toFixed(1) : 0,
        net: positiveSum - negativeSum
      };
    });
  }

  const rows = allChoices();
  const before = audit(rows);

  // Choice semantics are more important than a mathematically symmetrical pool.
  // Healthy communication/trust/balanced choices should be able to build LOVE,
  // and merely being mature should not automatically drain CHAOS every round.
  // These signatures correspond to the shared choice templates in choices.js.
  const semanticPresets = new Map([
    ['-3,8,12,-3',[-1,6,9,-2]],   // boundary
    ['1,9,6,-1',[2,7,5,0]],       // verify
    ['7,-6,-6,7',[5,-4,-4,4]],    // soften / accommodate
    ['3,6,8,-3',[5,5,7,0]],       // communicate
    ['1,7,4,-1',[2,6,4,0]],       // observe
    ['2,-5,-5,5',[2,-4,-4,4]],    // avoid
    ['7,1,4,-3',[7,1,4,0]],        // trust
    ['3,5,4,-1',[5,4,4,0]],        // balanced
    ['-1,7,2,2',[0,7,2,2]],        // radar
    ['-6,11,12,-5',[-6,10,11,-4]], // exit
    ['9,-7,-7,8',[8,-6,-6,7]],     // chance
    ['8,1,3,-1',[8,1,3,1]],        // love
    ['9,-5,-5,12',[8,-5,-5,10]],   // chaos
    ['1,7,8,-3',[3,6,7,-1]],       // pace
    ['1,7,9,-2',[3,6,8,-1]]        // money
  ]);

  let semanticAdjusted = 0;
  rows.forEach(({choice,kind}) => {
    if (kind !== 'character') return;
    const signature = choice.delta.map(v => Number(v || 0)).join(',');
    const preset = semanticPresets.get(signature);
    if (!preset) return;
    choice.delta = [...preset];
    semanticAdjusted += 1;
  });

  const semantic = audit(rows);

  // Reduce volatility so ordinary 20/50-card runs can still reach the end.
  rows.forEach(({choice,kind}) => {
    const factor = kind === 'event' ? 0.78 : 0.72;
    const cap = kind === 'event' ? 9 : 8;
    choice.delta = choice.delta.map(value => {
      if (!value) return 0;
      const scaled = Math.max(1, Math.round(Math.abs(value) * factor));
      return Math.sign(value) * Math.min(cap, scaled);
    });
  });

  // Whole-library correction is intentionally gentle now. The previous wider
  // 0.68–1.32 correction could undo semantic tuning just to make totals look even.
  const scaled = audit(rows);
  const directionFactors = scaled.map(stat => {
    if (!stat.positiveSum || !stat.negativeSum) return {positive:1,negative:1};
    const positive = clamp(Math.sqrt(stat.negativeSum / stat.positiveSum), 0.85, 1.15);
    const negative = clamp(Math.sqrt(stat.positiveSum / stat.negativeSum), 0.85, 1.15);
    return {positive,negative};
  });

  rows.forEach(({choice}) => {
    choice.delta = choice.delta.map((value,index) => {
      if (!value) return 0;
      const factor = value > 0 ? directionFactors[index].positive : directionFactors[index].negative;
      const adjusted = Math.max(1, Math.round(Math.abs(value) * factor));
      return Math.sign(value) * adjusted;
    });
  });

  // Keep the four meters similarly active without forcing them to be identical.
  const directional = audit(rows);
  const activity = directional.map(stat => stat.positiveSum + stat.negativeSum);
  const targetActivity = activity.reduce((a,b)=>a+b,0) / Math.max(1,activity.length);
  const axisFactors = activity.map(value => value ? clamp(targetActivity/value,0.90,1.10) : 1);

  rows.forEach(({choice}) => {
    choice.delta = choice.delta.map((value,index) => {
      if (!value) return 0;
      const adjusted = Math.max(1, Math.round(Math.abs(value) * axisFactors[index]));
      return Math.sign(value) * adjusted;
    });
  });

  // TONIGHT MODIFIER changes flavour, not the fundamental meaning of a choice.
  (window.RED_FLAG_META?.modifiers || []).forEach(modifier => {
    if (!Array.isArray(modifier.mult)) return;
    modifier.mult = modifier.mult.map(value => {
      const balanced = 1 + (value - 1) * 0.30;
      return Math.round(balanced * 100) / 100;
    });
  });

  const after = audit(rows);
  window.RED_FLAG_BALANCE_REPORT = {
    cards: rows.length,
    semanticAdjusted,
    before,
    semantic,
    after,
    directionFactors,
    axisFactors,
    policy: {
      love: 'Healthy intimacy and communication may increase LOVE; LOVE is emotional investment, not gullibility.',
      chaos: 'Neutral mature choices usually leave CHAOS near zero; CHAOS moves mainly for playfulness, risk, impulse or active drama avoidance.'
    }
  };

  if (typeof console !== 'undefined' && console.table) {
    console.info('[RED FLAG DETECTOR] Balance audit — ORIGINAL');
    console.table(before);
    console.info('[RED FLAG DETECTOR] Balance audit — SEMANTIC RECALIBRATION');
    console.table(semantic);
    console.info('[RED FLAG DETECTOR] Balance audit — FINAL');
    console.table(after);
  }
})();
