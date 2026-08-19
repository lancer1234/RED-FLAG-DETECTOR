(() => {
  const panel = document.getElementById('recapPanel');
  if (!panel) return;

  const groupNames = /^(小安|Vivi|姐妹群組)[：:]/;
  const characterLead = /^(他|阿澤|宇衡|Leo|Kevin|子謙|阿凱|柏勳|承恩|Ryan|俊瑋|Eason|Nick)(\s|：|回|說|停|笑|點|皺|沉默|隔|很快|立刻|低頭|盯|愣|把|沒有|只|語氣|想|看)/;

  function cleanPrefix(text) {
    return String(text || '').replace(/^對方[：:]\s*/, '').replace(/^→\s*/, '').trim();
  }

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

  // app-v2 toggles only the recap panel's own hidden class when a new recap is ready.
  // Observe that attribute only; never observe descendants, so this formatter cannot loop on itself.
  const observer = new MutationObserver(() => requestAnimationFrame(fixRecap));
  observer.observe(panel, { attributes: true, attributeFilter: ['class'] });
  fixRecap();
})();
