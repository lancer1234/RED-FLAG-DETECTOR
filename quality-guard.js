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

  const rules = {
    DETECTIVE: /時間|時間線|前後|說法|行程|加班|消失|已讀|回覆|前任|截圖|交友軟體|限動|陌生|共同好友|朋友說|重疊|週末|謊|對不上|可疑|定位|紀錄|訊息/i,
    BOUNDARY: /控制|報備|不准|不能|要求|逼|隱私|手機|密碼|界線|穿什麼|異性|定位|查勤|雙標|冷戰|拒絕|尊重|安全感|自由|限制/i,
    HEART: /喜歡|想妳|想你|在意|約會|見面|告白|關係|曖昧|心動|未來|一起|認真|想跟妳|想和妳|想見|靠近/i,
    CHAOS: /前任|喝醉|酒後|凌晨|陌生電話|三角|撞見|婚禮|交友軟體|截圖|姐妹|群組|限動|復合|巧遇|突然|修羅場|抓包|秘密/i
  };

  function contextText() {
    return [
      $('dramaHook')?.textContent,
      $('crossHook')?.textContent,
      $('role')?.textContent,
      $('who')?.textContent,
      $('quote')?.textContent
    ].filter(Boolean).join(' ');
  }

  function roundInfo() {
    const text = $('count')?.textContent || '';
    const match = text.match(/(\d+)\s*\/\s*(\d+)/);
    return match ? { round: Number(match[1]), total: Number(match[2]) } : { round: 0, total: 15 };
  }

  function markerType(marker) {
    if (marker.includes('DETECTIVE')) return 'DETECTIVE';
    if (marker.includes('BOUNDARY')) return 'BOUNDARY';
    if (marker.includes('HEART')) return 'HEART';
    if (marker.includes('CHAOS')) return 'CHAOS';
    return '';
  }

  function contextualTitle(type, text) {
    if (type === 'DETECTIVE') {
      if (/時間|時間線|前後|行程|加班|重疊|週末|對不上/.test(text)) return 'D｜等等，前後的時間好像有哪裡對不起來';
      if (/前任|復合/.test(text)) return 'D｜先把前任這條線問清楚，我再決定要不要信';
      if (/截圖|交友軟體|限動|訊息|已讀/.test(text)) return 'D｜我先不下結論，但這個證據我會直接問清楚';
      return 'D｜這裡有個細節怪怪的，我想先確認一下';
    }
    if (type === 'BOUNDARY') {
      if (/隱私|手機|密碼/.test(text)) return 'D｜可以有隱私，但我們把彼此的界線講清楚';
      if (/報備|定位|查勤/.test(text)) return 'D｜關心可以，但我不接受把報備變成查勤';
      if (/穿什麼|不准|不能|限制|控制/.test(text)) return 'D｜你可以有感受，但不能替我決定';
      return 'D｜這件事碰到我的界線，我現在就說清楚';
    }
    if (type === 'HEART') {
      if (/告白|喜歡|在意|心動/.test(text)) return 'D｜我也有感覺，不想再繞了，直接說吧';
      if (/約會|見面|想見/.test(text)) return 'D｜我其實想見你，那就把時間真的約下來';
      if (/關係|曖昧|認真/.test(text)) return 'D｜我在意你，所以我想知道我們到底往哪裡走';
      return 'D｜我不裝沒事，直接說我現在真的有感覺';
    }
    if (type === 'CHAOS') {
      if (/前任|復合/.test(text)) return 'D｜好，我知道很危險，但我想看他到底要演哪齣';
      if (/陌生電話|截圖|抓包|秘密/.test(text)) return 'D｜先別結束，我要把這齣戲看到真相出來';
      if (/喝醉|酒後|凌晨/.test(text)) return 'D｜現在明知道不理性，但我偏想回這一句';
      return 'D｜這局已經夠荒謬了，我想看看下一幕會怎樣';
    }
    return '';
  }

  function applyGuard() {
    const button = choices.querySelector('.unlocked-choice');
    if (!button) return;

    const title = button.querySelector('b');
    const note = button.querySelector('small');
    if (!title || !note) return;

    const marker = note.textContent || '';
    const type = markerType(marker);
    if (!type) return;

    const { round, total } = roundInfo();
    if (round === 1 && lastRoundSeen > 1) {
      shownThisRun = 0;
      lastShownRound = -99;
      processedKey = '';
    }
    lastRoundSeen = round;

    const key = `${total}:${round}:${type}`;
    if (processedKey === key) return;
    processedKey = key;

    const text = contextText();
    const relevant = rules[type].test(text);
    const maxPerRun = total <= 8 ? 2 : 3;
    const cooledDown = round - lastShownRound >= 2;

    observer.disconnect();

    if (!relevant || shownThisRun >= maxPerRun || !cooledDown) {
      button.remove();
      observer.observe(choices, { childList: true, subtree: true });
      return;
    }

    const nextTitle = contextualTitle(type, text);
    if (nextTitle && title.textContent !== nextTitle) title.textContent = nextTitle;
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
