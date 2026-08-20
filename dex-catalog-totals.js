(() => {
  const personas = window.RED_FLAG_PERSONAS || {};
  const data = window.RED_FLAG_DATA || [];
  const events = window.RED_FLAG_EVENTS || [];

  // Capture the complete catalog before audio-system.js narrows RED_FLAG_EVENTS
  // to a per-run candidate pool. DEX denominators describe the whole game,
  // never the current deck or current candidate pool.
  const uniqueCount = (items, predicate = () => true) => new Set(
    items.filter(item => item && item.id && predicate(item)).map(item => item.id)
  ).size;

  const totals = Object.freeze({
    characters: Object.keys(personas).length,
    events: uniqueCount(events),
    rare: uniqueCount(data, item => item.rare === true || item.special === true)
  });

  window.RED_FLAG_CATALOG_TOTALS = totals;

  function syncDexTotals() {
    const root = document.getElementById('dexContent');
    if (!root) return;

    root.querySelectorAll('.dex-group > b').forEach(label => {
      const text = String(label.textContent || '').trim();
      let match = text.match(/^CHARACTERS\s+(\d+)\s*\/\s*\d+$/i);
      if (match) {
        label.textContent = `CHARACTERS ${match[1]}/${Math.max(Number(match[1]), totals.characters)}`;
        return;
      }

      match = text.match(/^EVENTS\s+(\d+)\s*\/\s*\d+$/i);
      if (match) {
        label.textContent = `EVENTS ${match[1]}/${Math.max(Number(match[1]), totals.events)}`;
        return;
      }

      match = text.match(/^RARE FILES\s+(\d+)\s*\/\s*\d+$/i);
      if (match) {
        label.textContent = `RARE FILES ${match[1]}/${Math.max(Number(match[1]), totals.rare)}`;
      }
    });
  }

  ['openDex', 'openDexEnd'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => requestAnimationFrame(syncDexTotals));
  });

  const overlay = document.getElementById('dexOverlay');
  if (overlay) {
    new MutationObserver(() => {
      if (!overlay.classList.contains('hidden')) requestAnimationFrame(syncDexTotals);
    }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
  }

  // Public hook for diagnostics and future catalog additions.
  window.RED_FLAG_SYNC_DEX_TOTALS = syncDexTotals;
})();