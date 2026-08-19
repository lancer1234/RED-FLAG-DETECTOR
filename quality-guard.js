(() => {
  const $ = id => document.getElementById(id);

  document.querySelectorAll('.mode-btn').forEach(button => {
    button.addEventListener('click', () => {
      if ($('modeLabel')) $('modeLabel').textContent = button.dataset.mode || 'FULL SCAN';
    });
  });

  const choices = $('choices');
  if (!choices) return;

  function expectedTitle(marker) {
    if (marker.includes('DETECTIVE')) return 'D｜我先記著這個細節，看後面對不對得起來';
    if (marker.includes('BOUNDARY')) return 'D｜這件事讓我不舒服，我現在就講清楚';
    if (marker.includes('HEART')) return 'D｜我不裝沒事，直接說我現在真的有感覺';
    if (marker.includes('CHAOS')) return 'D｜我知道可能不理性，但我想看看下一幕會怎樣';
    return '';
  }

  function applyGuard() {
    const button = choices.querySelector('.unlocked-choice');
    if (!button) return;

    const title = button.querySelector('b');
    const note = button.querySelector('small');
    if (!title || !note) return;

    const nextTitle = expectedTitle(note.textContent || '');
    if (!nextTitle || title.textContent === nextTitle) return;

    // Disconnect while changing DOM so our own correction cannot retrigger
    // the observer indefinitely (this previously froze Safari when D unlocked).
    observer.disconnect();
    title.textContent = nextTitle;
    observer.observe(choices, { childList: true, subtree: true });
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyGuard();
    });
  });

  observer.observe(choices, { childList: true, subtree: true });
})();
