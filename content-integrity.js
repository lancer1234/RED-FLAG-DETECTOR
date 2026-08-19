(() => {
  const full = window.RED_FLAG_FULL_CHOICES || (window.RED_FLAG_FULL_CHOICES = {});
  const data = window.RED_FLAG_DATA || [];
  const events = window.RED_FLAG_EVENTS || [];
  const invalid = [];
  let synced = 0;

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

  // Event cards use their own options directly, but validate them here too so
  // broken expansion content cannot silently enter a run.
  events.forEach(item => {
    if (!item || !item.id) return;
    if (!validOptions(item.options)) invalid.push(item.id);
  });

  window.RED_FLAG_CONTENT_REPORT = {
    syncedStrictChoices: synced,
    invalidIds: [...new Set(invalid)]
  };

  if (invalid.length) {
    console.error('[RED FLAG DETECTOR] Invalid card content:', [...new Set(invalid)]);
  } else {
    console.info(`[RED FLAG DETECTOR] content integrity OK; synced ${synced} expansion cards into strict choices.`);
  }
})();
