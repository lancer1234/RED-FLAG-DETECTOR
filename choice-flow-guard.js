(() => {
  const $=id=>document.getElementById(id);
  const choices=$('choices');
  const panel=$('interactionPanel');
  const continueBtn=$('continueBtn');
  const count=$('count');
  const quote=$('quote');
  if(!choices||!panel||!continueBtn||!count||!quote)return;

  function visible(node){return node&&!node.classList.contains('hidden');}
  function focusReply(){
    if(!visible(panel))return;
    requestAnimationFrame(()=>panel.scrollIntoView({behavior:'smooth',block:'nearest'}));
  }

  choices.addEventListener('click',event=>{
    const button=event.target.closest('button[data-choice]');
    if(!button)return;
    const round=String(count.textContent||'');
    const scenario=String(quote.dataset.scenarioId||'')+'|'+String(quote.textContent||'').trim();
    setTimeout(focusReply,360);
    setTimeout(focusReply,720);
    setTimeout(()=>{
      if(String(count.textContent||'')!==round)return;
      const now=String(quote.dataset.scenarioId||'')+'|'+String(quote.textContent||'').trim();
      if(now!==scenario)return;
      if(visible(panel)){
        focusReply();
        return;
      }
      const disabled=[...choices.querySelectorAll('button')].some(node=>node.disabled);
      if(disabled&&typeof continueBtn.onclick==='function')continueBtn.onclick();
    },1350);
  },true);
})();