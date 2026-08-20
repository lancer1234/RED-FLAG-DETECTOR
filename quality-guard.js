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

// Strong post-choice feedback: reveal the actual score change only after the choice.
(() => {
  const feedback = document.getElementById('feedback');
  if (!feedback) return;
  const labels = ['LOVE','RADAR','STANDARD','CHAOS'];

  function enhanceFeedback() {
    if (feedback.classList.contains('hidden')) return;
    const raw = feedback.textContent || '';
    if (!raw || feedback.dataset.enhancedRaw === raw) return;
    feedback.dataset.enhancedRaw = raw;

    const parts = raw.split(' // ');
    const note = parts.shift() || '';
    const deltaText = parts.join(' // ');
    const changes = [];
    labels.forEach((label, index) => {
      const match = deltaText.match(new RegExp(`${label}\\s+([+-]\\d+)`));
      if (!match) return;
      const value = Number(match[1]);
      changes.push({ label, value, index });
    });

    feedback.innerHTML = '';
    const noteNode = document.createElement('div');
    noteNode.className = 'feedback-note';
    noteNode.textContent = note;
    feedback.appendChild(noteNode);

    if (changes.length) {
      const row = document.createElement('div');
      row.className = 'feedback-deltas';
      changes.forEach(({label,value,index}) => {
        const chip = document.createElement('span');
        chip.className = `delta-chip ${value > 0 ? 'up' : 'down'}`;
        chip.innerHTML = `<small>${label}</small><b>${value > 0 ? '+' : ''}${value}</b>`;
        row.appendChild(chip);

        const stat = document.querySelectorAll('.stat')[index];
        if (stat) {
          stat.classList.remove('score-pulse-up','score-pulse-down');
          void stat.offsetWidth;
          stat.classList.add(value > 0 ? 'score-pulse-up' : 'score-pulse-down');
          setTimeout(() => stat.classList.remove('score-pulse-up','score-pulse-down'), 650);
        }
      });
      feedback.appendChild(row);
    }
  }

  const feedbackObserver = new MutationObserver(() => requestAnimationFrame(enhanceFeedback));
  feedbackObserver.observe(feedback, { attributes:true, attributeFilter:['class'] });
})();

// Shared four-axis result visualization used by both the result screen and PNG card.
(() => {
  const $ = id => document.getElementById(id);
  const end = $('end');
  const terminal = $('resultTerminal');
  if (!end || !terminal) return;

  function stats() { return ['r0','r1','r2','r3'].map(id => Math.max(0, Math.min(100, Number($(id)?.textContent || 0)))); }

  function drawRadar(canvas, values, compact=false) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w/2, cy = h/2;
    const radius = Math.min(w,h) * (compact ? .30 : .29);
    const angles = [-Math.PI/2, 0, Math.PI/2, Math.PI];
    const labels = ['LOVE','RADAR','STANDARD','CHAOS'];
    ctx.clearRect(0,0,w,h);

    ctx.lineWidth = compact ? 3 : 2;
    [0.25,0.5,0.75,1].forEach((level, li) => {
      ctx.beginPath();
      angles.forEach((a,i) => {
        const x = cx + Math.cos(a)*radius*level;
        const y = cy + Math.sin(a)*radius*level;
        i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
      });
      ctx.closePath();
      ctx.strokeStyle = li === 3 ? '#52616a' : '#28343b';
      ctx.stroke();
    });

    angles.forEach(a => {
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.lineTo(cx+Math.cos(a)*radius, cy+Math.sin(a)*radius);
      ctx.strokeStyle='#263139'; ctx.stroke();
    });

    ctx.beginPath();
    values.forEach((v,i) => {
      const rr = radius*(v/100);
      const x = cx + Math.cos(angles[i])*rr;
      const y = cy + Math.sin(angles[i])*rr;
      i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
    });
    ctx.closePath();
    ctx.fillStyle='rgba(210,176,109,.16)'; ctx.fill();
    ctx.strokeStyle='#d2b06d'; ctx.lineWidth=compact ? 5 : 3; ctx.stroke();

    values.forEach((v,i) => {
      const rr = radius*(v/100);
      const x = cx + Math.cos(angles[i])*rr;
      const y = cy + Math.sin(angles[i])*rr;
      ctx.beginPath(); ctx.arc(x,y, compact ? 7 : 4,0,Math.PI*2);
      ctx.fillStyle='#62c7c9'; ctx.fill();
    });

    ctx.textAlign='center'; ctx.textBaseline='middle';
    labels.forEach((label,i) => {
      const rr = radius + (compact ? 72 : 34);
      const x = cx + Math.cos(angles[i])*rr;
      const y = cy + Math.sin(angles[i])*rr;
      ctx.fillStyle='#8f9693'; ctx.font=compact?'24px monospace':'10px monospace';
      ctx.fillText(label,x,y-(compact?12:5));
      ctx.fillStyle='#efe4cc'; ctx.font=compact?'700 34px monospace':'700 15px monospace';
      ctx.fillText(String(values[i]),x,y+(compact?20:10));
    });
  }

  let radar = $('resultRadar');
  if (!radar) {
    const wrap = document.createElement('div');
    wrap.className='result-radar-wrap';
    wrap.innerHTML='<div class="result-radar-title">RELATIONSHIP SHAPE // 四軸分布</div><canvas id="resultRadar" width="340" height="300" aria-label="LOVE、RADAR、STANDARD、CHAOS 四軸結果圖"></canvas>';
    const grid = terminal.querySelector('.rgrid');
    terminal.insertBefore(wrap, grid);
    radar = $('resultRadar');
  }

  function render() { if (!end.classList.contains('hidden')) drawRadar(radar, stats()); }
  const endObserver = new MutationObserver(() => requestAnimationFrame(render));
  endObserver.observe(end,{attributes:true,attributeFilter:['class']});
  window.RED_FLAG_DRAW_RADAR = drawRadar;
})();

// Mobile-first result card sharing with the same comparison chart.
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
        ctx.fillText(line,x,y+row*lineHeight); line=chars[i]; row++;
        if(row>=maxLines-1){
          const rest=chars.slice(i+1).join(''); let last=line;
          for(const ch of rest){if(ctx.measureText(last+'…').width>maxWidth)break;last+=ch;}
          ctx.fillText(last+'…',x,y+row*lineHeight); return;
        }
      } else line=test;
    }
    if(line)ctx.fillText(line,x,y+row*lineHeight);
  }

  function drawMiniRadar(ctx, values, cx, cy, radius) {
    const angles=[-Math.PI/2,0,Math.PI/2,Math.PI];
    const labels=['LOVE','RADAR','STANDARD','CHAOS'];
    [0.25,0.5,0.75,1].forEach((level,li)=>{
      ctx.beginPath(); angles.forEach((a,i)=>{const x=cx+Math.cos(a)*radius*level,y=cy+Math.sin(a)*radius*level;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();
      ctx.strokeStyle=li===3?'#52616a':'#263139';ctx.lineWidth=3;ctx.stroke();
    });
    angles.forEach(a=>{ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);ctx.strokeStyle='#263139';ctx.stroke();});
    ctx.beginPath(); values.forEach((v,i)=>{const rr=radius*v/100,x=cx+Math.cos(angles[i])*rr,y=cy+Math.sin(angles[i])*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();
    ctx.fillStyle='rgba(210,176,109,.16)';ctx.fill();ctx.strokeStyle='#d2b06d';ctx.lineWidth=6;ctx.stroke();
    values.forEach((v,i)=>{const rr=radius*v/100,x=cx+Math.cos(angles[i])*rr,y=cy+Math.sin(angles[i])*rr;ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fillStyle='#62c7c9';ctx.fill();});
    labels.forEach((label,i)=>{const rr=radius+92,x=cx+Math.cos(angles[i])*rr,y=cy+Math.sin(angles[i])*rr;ctx.textAlign='center';ctx.fillStyle='#8f9693';ctx.font='24px monospace';ctx.fillText(label,x,y-12);ctx.fillStyle='#efe4cc';ctx.font='700 38px monospace';ctx.fillText(String(values[i]),x,y+30);});
  }

  function drawCard() {
    const ctx=canvas.getContext('2d');
    const stats=['r0','r1','r2','r3'].map(id=>Math.max(0,Math.min(100,Number($(id)?.textContent||0))));
    const title=$('className')?.textContent||'RED FLAG DETECTOR';
    const desc=$('classDesc')?.textContent||'';
    const summary=$('summaryLine')?.textContent||'';
    const traits=$('traitResult')?.textContent||'';

    ctx.clearRect(0,0,1080,1920); ctx.fillStyle='#07090b';ctx.fillRect(0,0,1080,1920);
    ctx.strokeStyle='#364049';ctx.lineWidth=4;ctx.strokeRect(70,70,940,1780);
    ctx.fillStyle='#d2b06d';ctx.font='700 54px Georgia';ctx.textAlign='center';ctx.fillText('RED FLAG DETECTOR',540,180);
    ctx.fillStyle='#62c7c9';ctx.font='24px monospace';ctx.fillText('RELATIONSHIP OS // PLAYER FILE',540,245);
    ctx.fillStyle='#efe4cc';ctx.font='700 72px serif';ctx.fillText(title,540,365);
    ctx.textAlign='left';ctx.fillStyle='#a9aaa1';ctx.font='30px sans-serif';wrap(ctx,desc,130,445,820,48,3);

    drawMiniRadar(ctx,stats,540,940,270);

    ctx.fillStyle='#d2b06d';ctx.font='28px monospace';ctx.textAlign='left';wrap(ctx,summary,130,1390,820,44,3);
    ctx.fillStyle='#81bc8e';ctx.font='23px monospace';wrap(ctx,traits,130,1545,820,38,3);
    ctx.fillStyle='#68716f';ctx.font='21px monospace';ctx.fillText('lancer1234.github.io/RED-FLAG-DETECTOR/',130,1775);
    return canvas.toDataURL('image/png');
  }

  function dataUrlToBlob(dataUrl) {
    const [header,data]=dataUrl.split(',');
    const mime=(header.match(/data:([^;]+)/)||[])[1]||'image/png';
    const binary=atob(data),bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return new Blob([bytes],{type:mime});
  }

  function fallbackDownload(blob) {
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='red-flag-detector-result.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function setStatus(text) { const box=$('copyStatus');if(!box)return;box.textContent=text;box.classList.remove('hidden');setTimeout(()=>box.classList.add('hidden'),2200); }

  shareButton.onclick = async () => {
    try {
      const blob=dataUrlToBlob(drawCard());
      const file=new File([blob],'red-flag-detector-result.png',{type:'image/png'});
      if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))) {
        await navigator.share({title:'RED FLAG DETECTOR',text:`我的 RED FLAG DETECTOR 結果：${$('className')?.textContent||''}`,files:[file]});
        setStatus('已開啟分享選單'); return;
      }
      fallbackDownload(blob); setStatus('此瀏覽器不支援圖片分享，已改為下載');
    } catch (error) {
      if(error?.name==='AbortError') return;
      try { fallbackDownload(dataUrlToBlob(drawCard())); setStatus('分享失敗，已改為下載圖片'); }
      catch { setStatus('無法建立結果圖片，請稍後再試'); }
    }
  };
})();