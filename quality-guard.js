(() => {
  const $=id=>document.getElementById(id);

  document.querySelectorAll('.mode-btn').forEach(button=>{
    button.addEventListener('click',()=>{ if($('modeLabel')) $('modeLabel').textContent=button.dataset.mode||'FULL SCAN'; });
  });

  const choices=$('choices');
  if(!choices)return;

  const observer=new MutationObserver(()=>{
    const button=choices.querySelector('.unlocked-choice');
    if(!button)return;
    const title=button.querySelector('b');
    const note=button.querySelector('small');
    if(!title||!note)return;

    const marker=note.textContent||'';
    if(marker.includes('DETECTIVE')) title.textContent='D｜我先記著這個細節，看後面對不對得起來';
    else if(marker.includes('BOUNDARY')) title.textContent='D｜這件事讓我不舒服，我現在就講清楚';
    else if(marker.includes('HEART')) title.textContent='D｜我不裝沒事，直接說我現在真的有感覺';
    else if(marker.includes('CHAOS')) title.textContent='D｜我知道可能不理性，但我想看看下一幕會怎樣';
  });
  observer.observe(choices,{childList:true,subtree:true});
})();
