(() => {
  const interactions = window.RED_FLAG_INTERACTIONS || {};
  const exactReplyIds = new Set(['P06-08','P06-09','P06-10']);
  const baseStoryFor = interactions.storyFor;
  const baseCharacterReply = interactions.characterReply;

  function hasStory(item) {
    if (!item || typeof baseStoryFor !== 'function') return false;
    try {
      return Boolean(baseStoryFor(item, 0));
    } catch (err) {
      console.error('[RED FLAG DETECTOR] story check failed:', item.id, err);
      return false;
    }
  }

  function shouldReply(item) {
    if (!item || item.kind === 'event') return false;
    return exactReplyIds.has(item.id) || hasStory(item);
  }

  function characterReply(item, choiceIndex) {
    if (!item || !exactReplyIds.has(item.id)) return '';
    return typeof baseCharacterReply === 'function' ? baseCharacterReply(item, choiceIndex) : '';
  }

  window.RED_FLAG_INTERACTIONS = {
    ...interactions,
    shouldReply,
    characterReply
  };
})();
