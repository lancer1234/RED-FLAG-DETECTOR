(() => {
  // BUILD 4.0 balance pass
  // Keep extreme endings meaningful, but make ordinary runs less likely to hit
  // 0 / 100 before the player can see the full session.

  const scaleDelta = (delta, factor, cap) => {
    if (!Array.isArray(delta)) return delta;
    return delta.map(value => {
      if (!value) return 0;
      const sign = Math.sign(value);
      const scaled = Math.max(1, Math.round(Math.abs(value) * factor));
      return sign * Math.min(cap, scaled);
    });
  };

  // Character choices used to swing as much as 12 points at a time.
  // Bring normal decisions closer to 1–8 so repeated behaviour still matters,
  // but one or two cards cannot decide an entire run.
  const choices = window.RED_FLAG_FULL_CHOICES || {};
  Object.values(choices).forEach(group => {
    if (!Array.isArray(group)) return;
    group.forEach(choice => {
      if (choice && Array.isArray(choice.delta)) {
        choice.delta = scaleDelta(choice.delta, 0.68, 8);
      }
    });
  });

  // Event cards should remain more dangerous than normal character cards,
  // just not so explosive that one event plus a modifier ends the run.
  const events = window.RED_FLAG_EVENTS || [];
  events.forEach(event => {
    (event.options || []).forEach(choice => {
      if (choice && Array.isArray(choice.delta)) {
        choice.delta = scaleDelta(choice.delta, 0.72, 9);
      }
    });
  });

  // Compress TONIGHT MODIFIER multipliers toward 1.0.
  // Example: 1.35 becomes ~1.16 instead of stacking another huge swing.
  const modifiers = window.RED_FLAG_META?.modifiers || [];
  modifiers.forEach(modifier => {
    if (!Array.isArray(modifier.mult)) return;
    modifier.mult = modifier.mult.map(value => {
      const balanced = 1 + (value - 1) * 0.45;
      return Math.round(balanced * 100) / 100;
    });
  });
})();
