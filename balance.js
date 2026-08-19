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

  // 1) First reduce overall volatility so a normal run can usually reach the end.
  rows.forEach(({choice,kind}) => {
    const factor = kind === 'event' ? 0.78 : 0.68;
    const cap = kind === 'event' ? 9 : 8;
    choice.delta = choice.delta.map(value => {
      if (!value) return 0;
      const scaled = Math.max(1, Math.round(Math.abs(value) * factor));
      return Math.sign(value) * Math.min(cap, scaled);
    });
  });

  // 2) Measure the scaled library, then independently balance positive and
  // negative magnitude for every meter. This removes structural drift such as
  // STANDARD being positive in most high-frequency choice templates.
  const scaled = audit(rows);
  const directionFactors = scaled.map(stat => {
    if (!stat.positiveSum || !stat.negativeSum) return {positive:1,negative:1};
    const positive = clamp(Math.sqrt(stat.negativeSum / stat.positiveSum), 0.68, 1.32);
    const negative = clamp(Math.sqrt(stat.positiveSum / stat.negativeSum), 0.68, 1.32);
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

  // 3) Equalise total activity across all four meters so one meter does not
  // simply move much more often/strongly than the others.
  const directional = audit(rows);
  const activity = directional.map(stat => stat.positiveSum + stat.negativeSum);
  const targetActivity = activity.reduce((a,b)=>a+b,0) / Math.max(1,activity.length);
  const axisFactors = activity.map(value => value ? clamp(targetActivity/value,0.82,1.18) : 1);

  rows.forEach(({choice}) => {
    choice.delta = choice.delta.map((value,index) => {
      if (!value) return 0;
      const adjusted = Math.max(1, Math.round(Math.abs(value) * axisFactors[index]));
      return Math.sign(value) * adjusted;
    });
  });

  // TONIGHT MODIFIER still changes the feel of a run, but no longer stacks a
  // huge multiplier on top of an already directional card pool.
  (window.RED_FLAG_META?.modifiers || []).forEach(modifier => {
    if (!Array.isArray(modifier.mult)) return;
    modifier.mult = modifier.mult.map(value => {
      const balanced = 1 + (value - 1) * 0.35;
      return Math.round(balanced * 100) / 100;
    });
  });

  const after = audit(rows);
  window.RED_FLAG_BALANCE_REPORT = {
    cards: rows.length,
    before,
    after,
    directionFactors,
    axisFactors
  };

  // Useful when tuning future content: open DevTools and inspect the exact
  // whole-library positive/negative distribution before and after balancing.
  if (typeof console !== 'undefined' && console.table) {
    console.info('[RED FLAG DETECTOR] Full card-pool balance audit — BEFORE');
    console.table(before);
    console.info('[RED FLAG DETECTOR] Full card-pool balance audit — AFTER');
    console.table(after);
  }
})();
