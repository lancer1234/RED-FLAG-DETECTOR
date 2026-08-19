(() => {
  const $=id=>document.getElementById(id);
  const storyIds=new Set([
    'P01-01','P01-03','P01-06','P01-09','P02-05','P02-08','P03-03','P04-02','P04-06','P04-09','P05-08','P05-10',
    'P06-01','P06-03','P06-07','P06-10','P07-03','P07-08','P08-08','P09-01','P09-07','P10-05','P10-08','P11-03',
    'P12-03','P12-04','P12-06','P12-08','R01','R04','R06','R09','R12',
    'B01','B02','B03','B04','B05','B06','B07','B08'
  ]);
  const choices=$('choices');
  if(!choices)return;

  function currentId(){
    const quote=String($('quote')?.textContent||'').trim();
    if(!quote)return'';
    const items=[...(window.RED_FLAG_DATA||[]),...(window.RED_FLAG_EVENTS||[])];
    return items.find(item=>String(item.quote||'').trim()===quote)?.id||'';
  }

  function guard(){
    const id=currentId();
    if(!storyIds.has(id))return;
    const unlocked=choices.querySelector('.unlocked-choice');
    if(!unlocked)return;
    observer.disconnect();
    unlocked.remove();
    observer.observe(choices,{childList:true,subtree:true});
  }

  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;guard();});
  });
  observer.observe(choices,{childList:true,subtree:true});
})();
