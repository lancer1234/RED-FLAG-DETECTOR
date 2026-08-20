(() => {
  // BUILD 5.5 presentation runtime
  // Consolidates small UI-only helpers. Observers read one surface and mutate
  // a different surface (or react only to class visibility), avoiding observer loops.

  function installDangerPresentation() {
    const role = document.getElementById('role');
    const badge = document.getElementById('eventBadge');
    const dialog = document.getElementById('dialog');
    const portraitWrap = document.getElementById('portraitWrap');
    if (!role || !badge) return;

    function apply() {
      const danger = /DANGER FILE/i.test(role.textContent || '');
      if (danger) {
        badge.textContent = '⚠ DANGER FILE';
        badge.className = 'event-badge danger-file';
        dialog?.classList.add('danger-dialog');
        portraitWrap?.classList.add('danger-visual');
      } else {
        dialog?.classList.remove('danger-dialog');
        portraitWrap?.classList.remove('danger-visual');
      }
    }

    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        apply();
      });
    });
    observer.observe(role, { childList:true, characterData:true, subtree:true });
    apply();
  }

  function installRecapSourceLabels() {
    const panel = document.getElementById('recapPanel');
    if (!panel) return;

    const groupNames = /^(小安|Vivi|姐妹群組)[：:]/;
    const characterLead = /^(他|阿澤|宇衡|Leo|Kevin|子謙|阿凱|柏勳|承恩|Ryan|俊瑋|Eason|Nick)(\s|：|回|說|停|笑|點|皺|沉默|隔|很快|立刻|低頭|盯|愣|把|沒有|只|語氣|想|看)/;

    const cleanPrefix = text => String(text || '')
      .replace(/^對方[：:]\s*/, '')
      .replace(/^→\s*/, '')
      .trim();

    function sourceLabel(text, wasConsequence) {
      if (groupNames.test(text)) return '姐妹群組｜';
      if (!wasConsequence && (characterLead.test(text) || /^[「『]/.test(text))) return '對方｜';
      return '劇情｜';
    }

    function fixRecap() {
      if (panel.classList.contains('hidden')) return;
      panel.querySelectorAll('.recap-response').forEach(node => {
        const raw = node.textContent || '';
        const wasConsequence = /^\s*→/.test(raw);
        const body = cleanPrefix(raw);
        const next = sourceLabel(body, wasConsequence) + body;
        if (node.textContent !== next) node.textContent = next;
      });
    }

    const observer = new MutationObserver(() => requestAnimationFrame(fixRecap));
    observer.observe(panel, { attributes:true, attributeFilter:['class'] });
    fixRecap();
  }

  function installDexCatalogTotals() {
    const personas = window.RED_FLAG_PERSONAS || {};
    const data = window.RED_FLAG_DATA || [];
    const events = window.RED_FLAG_EVENTS || [];

    // Capture complete totals before audio-system.js narrows RED_FLAG_EVENTS to
    // a per-run candidate pool. DEX totals describe the whole game catalog.
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
      }).observe(overlay, { attributes:true, attributeFilter:['class'] });
    }

    window.RED_FLAG_SYNC_DEX_TOTALS = syncDexTotals;
  }

  installDangerPresentation();
  installRecapSourceLabels();
  installDexCatalogTotals();
})();
