(() => {
  const $=id=>document.getElementById(id);
  const data=window.RED_FLAG_DATA||[];
  const byQuote=new Map(data.map(item=>[String(item.quote||'').trim(),item]));

  // These follow-up cards previously assumed the player picked one specific
  // answer in the previous beat. Keep the same story event, but remove that
  // assumption so PREVIOUSLY ON can truthfully show any A/B/C choice.
  const neutral={
    'P02-05':'過了一陣子，他主動回來說：「剛剛我語氣不好，但我還是想把問題講完。」',
    'P03-03':'當妳開始把節奏拉回自己舒服的速度，他回：「我只是對妳認真，妳為什麼一直把我推開？」',
    'P03-05':'後來他自己補了一句：「我太興奮了，妳舒服的速度比較重要。」',
    'P04-06':'回國後再談到旅行期間的聯絡方式，他反問：「所以現在關心妳也不行？」',
    'P06-05':'妳沒有立刻給他一個明確答案，他沒有催，只傳：「不用現在回答，我只是想讓妳知道。」',
    'P07-05':'後來再談到他一有壓力就消失這件事，他回：「好，下次至少先跟妳說我需要時間。」',
    'P08-02':'他沒有臨時取消原本的朋友行程，只問：「妳要不要跟我講今天怎麼了？我晚點回來可以打給妳。」',
    'P08-05':'情緒降下來後，他說：「我知道剛剛大家都不好受，但我們不能每次都靠傷人來發洩。」',
    'P09-02':'後來再聊到「限動很勤、訊息很慢」的落差，他回：「我發限動跟回訊息是兩種心情啦。」',
    'P09-05':'談到拍照和公開限動的界線時，他先問：「那只拍不發可以嗎？」',
    'P09-06':'當妳把影像界線講得更清楚後，他把手機收起來，沒有再提。',
    'P10-02':'聊到共同約會預算時，他主動補充：「我們抓大方向就好，不需要每筆都算。」',
    'P10-05':'妳們繼續談旅行分帳，他說：「公平不是每一塊錢都一定要五五分。」',
    'P11-02':'妳們繼續談他同時認識其他人的狀態，他說：「如果妳不想繼續也可以，我不想藏到之後才說。」',
    'P11-05':'妳們繼續談關係節奏，他說：「我不知道需要多久，但我不想用一個期限騙妳。」',
    'P12-02':'妳對臨時改約的反應沒有讓問題消失，他回：「不要生氣啦，下次我請妳吃好的。」',
    'P12-06':'妳把「說得好聽但沒有安排」這件事講明後，隔週他真的提前訂好餐廳並傳定位。'
  };

  let lastKey='';
  function currentItem(){
    const q=$('quote');
    if(!q)return null;
    const visible=String(q.textContent||'').trim();
    const direct=byQuote.get(visible);
    if(direct){
      q.dataset.scenarioId=direct.id;
      q.dataset.originalQuote=direct.quote;
      return direct;
    }
    const id=q.dataset.scenarioId;
    return id?data.find(x=>x.id===id)||null:null;
  }

  function apply(){
    const q=$('quote');if(!q)return;
    const item=currentItem();if(!item)return;
    const count=String($('count')?.textContent||'');
    const key=`${count}:${item.id}`;
    if(key===lastKey&&q.dataset.continuityApplied==='1')return;
    lastKey=key;
    const next=neutral[item.id];
    if(next&&q.textContent!==next){
      q.textContent=next;
      q.dataset.continuityApplied='1';
    }else{
      q.dataset.continuityApplied='1';
    }
  }

  let queued=false;
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});};
  const observer=new MutationObserver(queue);
  if($('quote'))observer.observe($('quote'),{childList:true,characterData:true,subtree:true});
  if($('count'))observer.observe($('count'),{childList:true,characterData:true,subtree:true});
  queue();
})();