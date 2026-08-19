(() => {
  const $ = id => document.getElementById(id);

  document.querySelectorAll('.mode-btn').forEach(button => {
    button.addEventListener('click', () => {
      if ($('modeLabel')) $('modeLabel').textContent = button.dataset.mode || 'FULL SCAN';
    });
  });

  const choices = $('choices');
  if (!choices) return;

  let shownThisRun = 0;
  let lastShownRound = -99;
  let lastRoundSeen = 0;
  let processedKey = '';

  // D choices are intentionally strict: no keyword guessing and no persona fallback.
  // If a scenario is not listed here, it does not get a D choice.
  const exactD = {
    'P01-01':'D｜你不想定義關係，卻要求排他？這個規則先講清楚',
    'P01-09':'D｜先把你前後對「我們算什麼」的說法對一次',
    'P02-08':'D｜可以有隱私，但我們把彼此手機與私人空間的界線講清楚',
    'P04-02':'D｜關心可以，但我不接受把定位變成查勤',
    'P04-06':'D｜你可以沒有安全感，但不能把它變成限制我的規則',
    'P04-09':'D｜我想直接確認：你要求我的那些規則，你自己也做得到嗎？',
    'P05-08':'D｜先把最近幾次臨時改約的時間排開看，我想知道是不是固定模式',
    'P06-01':'D｜凌晨突然找我可以，但先說清楚你現在到底想做什麼',
    'P06-07':'D｜先別聊回憶，我想知道你現在聯絡我的真正原因',
    'P06-10':'D｜如果要當朋友，我們先把聯絡頻率和界線說清楚',
    'P09-01':'D｜你有時間發限動卻一直沒回我，我想直接問這個落差',
    'P09-07':'D｜我不猜限動暗示，你有話就直接對我說',
    'P10-05':'D｜錢可以算清楚，但我想先確認我們對「公平」是不是同一件事',
    'P11-03':'D｜既然還有其他約會對象，我想先把我們現在的規則講明白',
    'P12-04':'D｜先不要再說「下次」，直接把時間和地點定下來',
    'P13-01':'D｜表格先放旁邊，你本人對這次約會到底是什麼感覺？',
    'P14-01':'D｜先等等，你媽媽為什麼已經知道我要來？',
    'P14-05':'D｜先處理一件事：她是怎麼拿到我電話的？',
    'P15-01':'D｜出生時間可以先不給，你先說這資料準備拿來做什麼',
    'P16-01':'D｜先不要問 AI，這件事你本人到底怎麼想？',
    'P17-01':'D｜Netflix、Costco、狗各自怎麼分，我想把這條前任線一次問清楚',
    'P17-04':'D｜聯絡人還叫「寶」不是懶而已，我想知道你為什麼一直沒改',
    'P18-01':'D｜先暫停面試模式：你為什麼第一次約會就需要知道收入？',
    'P19-01':'D｜你說「沒有重疊」，那我們把實際日期一個一個排出來',
    'P19-02':'D｜先看完整時間線，我不想只聽「技術上沒有」',
    'P20-01':'D｜先確認一下：你跟我分手後，為什麼還一直跟我家人聯絡？'
  };

  function roundInfo() {
    const text = $('count')?.textContent || '';
    const match = text.match(/(\d+)\s*\/\s*(\d+)/);
    return match ? { round: Number(match[1]), total: Number(match[2]) } : { round: 0, total: 20 };
  }

  function currentId() {
    const quoteNode = $('quote');
    const tagged = quoteNode?.dataset?.scenarioId || '';
    if (tagged) return tagged;
    const quote = String(quoteNode?.textContent || '').trim();
    if (!quote) return '';
    const items = [...(window.RED_FLAG_DATA || []), ...(window.RED_FLAG_EVENTS || [])];
    return items.find(item => String(item.quote || '').trim() === quote)?.id || '';
  }

  function applyGuard() {
    const button = choices.querySelector('.unlocked-choice');
    if (!button) return;

    const title = button.querySelector('b');
    if (!title) return;

    const { round, total } = roundInfo();
    if (round === 1 && lastRoundSeen > 1) {
      shownThisRun = 0;
      lastShownRound = -99;
      processedKey = '';
    }
    lastRoundSeen = round;

    const id = currentId();
    const key = `${total}:${round}:${id}`;
    if (processedKey === key) return;
    processedKey = key;

    const exactTitle = exactD[id];
    const maxPerRun = total >= 50 ? 6 : 3;
    const cooledDown = round - lastShownRound >= 2;

    observer.disconnect();

    if (!exactTitle || shownThisRun >= maxPerRun || !cooledDown) {
      button.remove();
      observer.observe(choices, { childList: true, subtree: true });
      return;
    }

    if (title.textContent !== exactTitle) title.textContent = exactTitle;
    shownThisRun += 1;
    lastShownRound = round;

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

// Mobile-first result card sharing. iOS Safari does not reliably honour
// <a download> for Canvas data URLs, so use the native Share Sheet with a real
// PNG File whenever file sharing is supported.
(() => {
  const $ = id => document.getElementById(id);
  const shareButton = $('saveCard');
  const canvas = $('resultCanvas');
  if (!shareButton || !canvas) return;

  shareButton.textContent = '分享結果卡 / SHARE CARD';

  function wrap(ctx,text,x,y,maxWidth,lineHeight,maxLines=4) {
    const chars=[...String(text||'')];
    let line='',row=0;
    for(let i=0;i<chars.length;i++){
      const test=line+chars[i];
      if(ctx.measureText(test).width>maxWidth&&line){
        ctx.fillText(line,x,y+row*lineHeight);
        line=chars[i];row++;
        if(row>=maxLines-1){
          const rest=chars.slice(i+1).join('');
          let last=line;
          for(const ch of rest){if(ctx.measureText(last+'…').width>maxWidth)break;last+=ch;}
          ctx.fillText(last+'…',x,y+row*lineHeight);return;
        }
      }else line=test;
    }
    if(line)ctx.fillText(line,x,y+row*lineHeight);
  }

  function drawCard() {
    const ctx=canvas.getContext('2d');
    const stats=['r0','r1','r2','r3'].map(id=>Number($(id)?.textContent||0));
    const labels=['LOVE','RADAR','STANDARD','CHAOS'];
    const title=$('className')?.textContent||'RED FLAG DETECTOR';
    const desc=$('classDesc')?.textContent||'';
    const summary=$('summaryLine')?.textContent||'';
    const traits=$('traitResult')?.textContent||'';

    ctx.clearRect(0,0,1080,1920);
    ctx.fillStyle='#07090b';ctx.fillRect(0,0,1080,1920);
    ctx.strokeStyle='#364049';ctx.lineWidth=4;ctx.strokeRect(70,70,940,1780);
    ctx.fillStyle='#d2b06d';ctx.font='700 54px Georgia';ctx.textAlign='center';ctx.fillText('RED FLAG DETECTOR',540,180);
    ctx.fillStyle='#62c7c9';ctx.font='24px monospace';ctx.fillText('RELATIONSHIP OS',540,245);
    ctx.fillStyle='#efe4cc';ctx.font='700 72px serif';ctx.fillText(title,540,380);
    ctx.textAlign='left';ctx.fillStyle='#a9aaa1';ctx.font='30px sans-serif';wrap(ctx,desc,130,470,820,48,4);

    labels.forEach((label,i)=>{
      const y=760+i*165;
      ctx.fillStyle='#8f9693';ctx.font='24px monospace';ctx.fillText(label,130,y);
      ctx.fillStyle='#efe4cc';ctx.font='700 54px monospace';ctx.fillText(String(stats[i]),130,y+58);
      ctx.strokeStyle='#263038';ctx.lineWidth=3;ctx.strokeRect(360,y+10,570,34);
      ctx.fillStyle='#d2b06d';ctx.fillRect(360,y+10,570*Math.max(0,Math.min(100,stats[i]))/100,34);
    });

    ctx.fillStyle='#d2b06d';ctx.font='27px monospace';wrap(ctx,summary,130,1470,820,42,3);
    ctx.fillStyle='#81bc8e';ctx.font='23px monospace';wrap(ctx,traits,130,1600,820,38,3);
    ctx.fillStyle='#68716f';ctx.font='21px monospace';ctx.fillText('lancer1234.github.io/RED-FLAG-DETECTOR/',130,1775);

    return canvas.toDataURL('image/png');
  }

  function dataUrlToBlob(dataUrl) {
    const [header,data]=dataUrl.split(',');
    const mime=(header.match(/data:([^;]+)/)||[])[1]||'image/png';
    const binary=atob(data);const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return new Blob([bytes],{type:mime});
  }

  function fallbackDownload(blob) {
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='red-flag-detector-result.png';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  function setStatus(text) {
    const box=$('copyStatus');if(!box)return;
    box.textContent=text;box.classList.remove('hidden');
    setTimeout(()=>box.classList.add('hidden'),2200);
  }

  shareButton.onclick = async () => {
    try {
      const dataUrl=drawCard();
      const blob=dataUrlToBlob(dataUrl);
      const file=new File([blob],'red-flag-detector-result.png',{type:'image/png'});

      if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))) {
        await navigator.share({
          title:'RED FLAG DETECTOR',
          text:`我的 RED FLAG DETECTOR 結果：${$('className')?.textContent||''}`,
          files:[file]
        });
        setStatus('已開啟分享選單');
        return;
      }

      fallbackDownload(blob);
      setStatus('此瀏覽器不支援圖片分享，已改為下載');
    } catch (error) {
      if(error?.name==='AbortError') return;
      try {
        const blob=dataUrlToBlob(drawCard());
        fallbackDownload(blob);
        setStatus('分享失敗，已改為下載圖片');
      } catch {
        setStatus('無法建立結果圖片，請稍後再試');
      }
    }
  };
})();