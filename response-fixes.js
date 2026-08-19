(() => {
  const interactions = window.RED_FLAG_INTERACTIONS || {};
  const baseReply = interactions.characterReply;

  const exact = {
    'P06-08': [
      '他回：「好，我放管理室。妳有空再拿就好。」',
      '他回：「是妳以前放我這裡的東西。我拍給妳看，妳再決定要不要拿。」',
      '他停了一下：「好，那我找個妳方便的方式，不一定要見面。」'
    ],
    'P06-09': [
      '他隔了一下回：「沒有啦，只是剛好看到。妳玩得開心就好。」',
      '他回：「也沒什麼，就看到妳最近好像過得不錯。」語氣聽起來比問題本身更在意。',
      '他很快回：「我還行啊。看妳出去玩，感覺妳最近滿開心的。」話題沒有立刻停在那裡。'
    ],
    'P06-10': [
      '他回：「好，我懂。那我不會用朋友的名義一直黏著妳。」',
      '他停了一下：「我只是覺得完全不聯絡很奇怪，但如果妳不舒服我會退回去。」',
      '他回：「那就先聊天啊，我也沒有要逼妳怎樣。」每天傳訊息這件事仍然沒有被解釋。'
    ]
  };

  function characterReply(item, choiceIndex) {
    const rows = item && exact[item.id];
    if (rows) return rows[Math.min(choiceIndex, rows.length - 1)] || rows[0];
    return typeof baseReply === 'function' ? baseReply(item, choiceIndex) : '「好，我知道了。」';
  }

  window.RED_FLAG_INTERACTIONS = { ...interactions, characterReply };
})();
