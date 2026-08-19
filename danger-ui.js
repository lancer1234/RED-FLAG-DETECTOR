(() => {
  const role=document.getElementById('role');
  const badge=document.getElementById('eventBadge');
  const dialog=document.getElementById('dialog');
  const portraitWrap=document.getElementById('portraitWrap');
  if(!role||!badge)return;

  function apply(){
    const danger=/DANGER FILE/i.test(role.textContent||'');
    if(danger){
      badge.textContent='⚠ DANGER FILE';
      badge.className='event-badge danger-file';
      dialog?.classList.add('danger-dialog');
      portraitWrap?.classList.add('danger-visual');
    }else{
      dialog?.classList.remove('danger-dialog');
      portraitWrap?.classList.remove('danger-visual');
    }
  }

  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  });
  observer.observe(role,{childList:true,characterData:true,subtree:true});
  apply();
})();