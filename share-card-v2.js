(() => {
  const $=id=>document.getElementById(id);
  const button=$('saveCard');
  const canvas=$('resultCanvas');
  if(!button||!canvas)return;

  function wrap(ctx,text,x,y,maxWidth,lineHeight,maxLines=4){
    const chars=[...String(text||'')];
    let line='',row=0;
    for(let i=0;i<chars.length;i++){
      const test=line+chars[i];
      if(ctx.measureText(test).width>maxWidth&&line){
        ctx.fillText(line,x,y+row*lineHeight);
        line=chars[i];
        row++;
        if(row>=maxLines-1){
          const rest=chars.slice(i+1).join('');
          let last=line;
          for(const ch of rest){
            if(ctx.measureText(last+'…').width>maxWidth)break;
            last+=ch;
          }
          ctx.fillText(last+'…',x,y+row*lineHeight);
          return;
        }
      }else line=test;
    }
    if(line)ctx.fillText(line,x,y+row*lineHeight);
  }

  function drawRadar(ctx,values,cx,cy,radius){
    const angles=[-Math.PI/2,0,Math.PI/2,Math.PI];
    const labels=['LOVE','RADAR','STANDARD','CHAOS'];
    [0.25,0.5,0.75,1].forEach((level,li)=>{
      ctx.beginPath();
      angles.forEach((a,i)=>{
        const x=cx+Math.cos(a)*radius*level;
        const y=cy+Math.sin(a)*radius*level;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      });
      ctx.closePath();
      ctx.strokeStyle=li===3?'#52616a':'#263139';
      ctx.lineWidth=3;
      ctx.stroke();
    });
    angles.forEach(a=>{
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);
      ctx.strokeStyle='#263139';
      ctx.stroke();
    });
    ctx.beginPath();
    values.forEach((v,i)=>{
      const rr=radius*v/100;
      const x=cx+Math.cos(angles[i])*rr;
      const y=cy+Math.sin(angles[i])*rr;
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    });
    ctx.closePath();
    ctx.fillStyle='rgba(210,176,109,.16)';
    ctx.fill();
    ctx.strokeStyle='#d2b06d';
    ctx.lineWidth=6;
    ctx.stroke();
    values.forEach((v,i)=>{
      const rr=radius*v/100;
      const x=cx+Math.cos(angles[i])*rr;
      const y=cy+Math.sin(angles[i])*rr;
      ctx.beginPath();
      ctx.arc(x,y,8,0,Math.PI*2);
      ctx.fillStyle='#62c7c9';
      ctx.fill();
    });
    labels.forEach((label,i)=>{
      const rr=radius+78;
      const x=cx+Math.cos(angles[i])*rr;
      const y=cy+Math.sin(angles[i])*rr;
      ctx.textAlign='center';
      ctx.fillStyle='#8f9693';
      ctx.font='22px monospace';
      ctx.fillText(label,x,y-10);
      ctx.fillStyle='#efe4cc';
      ctx.font='700 34px monospace';
      ctx.fillText(String(values[i]),x,y+26);
    });
  }

  function drawCard(){
    const ctx=canvas.getContext('2d');
    const stats=['r0','r1','r2','r3'].map(id=>Math.max(0,Math.min(100,Number($(id)?.textContent||0))));
    const title=$('className')?.textContent||'RED FLAG DETECTOR';
    const desc=$('classDesc')?.textContent||'';
    const summary=$('summaryLine')?.textContent||'';
    const traits=$('traitResult')?.textContent||'';
    const psychRows=[...document.querySelectorAll('#psychResult .psych-row')].map(row=>({
      label:String(row.querySelector('span')?.textContent||'').trim(),
      value:Math.max(0,Math.min(100,Number(row.querySelector('b')?.textContent||0)))
    })).filter(row=>row.label);
    const psychMeta=String(document.querySelector('#psychResult .psych-meta')?.textContent||'').trim();

    canvas.width=1080;
    canvas.height=1920;
    ctx.clearRect(0,0,1080,1920);
    ctx.fillStyle='#07090b';
    ctx.fillRect(0,0,1080,1920);
    ctx.strokeStyle='#364049';
    ctx.lineWidth=4;
    ctx.strokeRect(70,70,940,1780);

    ctx.fillStyle='#d2b06d';
    ctx.font='700 52px Georgia';
    ctx.textAlign='center';
    ctx.fillText('RED FLAG DETECTOR',540,155);
    ctx.fillStyle='#62c7c9';
    ctx.font='23px monospace';
    ctx.fillText('RELATIONSHIP OS // PLAYER FILE',540,215);
    ctx.fillStyle='#efe4cc';
    ctx.font='700 66px serif';
    ctx.fillText(title,540,315);

    ctx.textAlign='left';
    ctx.fillStyle='#a9aaa1';
    ctx.font='27px sans-serif';
    wrap(ctx,desc,130,390,820,42,2);

    drawRadar(ctx,stats,540,770,220);

    ctx.fillStyle='#d2b06d';
    ctx.font='26px monospace';
    ctx.textAlign='left';
    wrap(ctx,summary,130,1100,820,38,2);
    ctx.fillStyle='#81bc8e';
    ctx.font='21px monospace';
    wrap(ctx,traits,130,1205,820,32,2);

    ctx.strokeStyle='#303b42';
    ctx.lineWidth=2;
    ctx.strokeRect(110,1285,860,410);
    ctx.fillStyle='#62c7c9';
    ctx.font='22px monospace';
    ctx.fillText('RELATIONSHIP PATTERN // 關係傾向',140,1335);
    if(psychMeta){
      ctx.fillStyle='#8f9693';
      ctx.font='18px sans-serif';
      ctx.fillText(psychMeta,140,1373);
    }

    const rowStart=1420;
    const rowGap=58;
    psychRows.slice(0,4).forEach((row,i)=>{
      const y=rowStart+i*rowGap;
      ctx.fillStyle='#aab1ae';
      ctx.font='20px sans-serif';
      ctx.fillText(row.label,140,y);
      ctx.strokeStyle='#2f3a40';
      ctx.strokeRect(320,y-19,500,20);
      ctx.fillStyle='#62c7c9';
      ctx.fillRect(322,y-17,Math.max(0,496*row.value/100),16);
      ctx.fillStyle='#efe4cc';
      ctx.font='700 22px monospace';
      ctx.textAlign='right';
      ctx.fillText(String(row.value),915,y);
      ctx.textAlign='left';
    });

    ctx.fillStyle='#68716f';
    ctx.font='16px sans-serif';
    wrap(ctx,'依本局部分日常關係情境的選擇整理，用來幫助自我觀察。這不是心理診斷，也不是正式心理量表分數。',140,1668,780,25,2);

    ctx.fillStyle='#d2b06d';
    ctx.font='700 18px monospace';
    ctx.textAlign='center';
    ctx.fillText('MAKOTO LAB',540,1788);
    ctx.fillStyle='#68716f';
    ctx.font='17px monospace';
    ctx.fillText('lancer1234.github.io/RED-FLAG-DETECTOR/',540,1828);

    return canvas.toDataURL('image/png');
  }

  function dataUrlToBlob(dataUrl){
    const [header,data]=dataUrl.split(',');
    const mime=(header.match(/data:([^;]+)/)||[])[1]||'image/png';
    const binary=atob(data);
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return new Blob([bytes],{type:mime});
  }

  function fallback(blob){
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='red-flag-detector-result.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  function status(text){
    const box=$('copyStatus');
    if(!box)return;
    box.textContent=text;
    box.classList.remove('hidden');
    setTimeout(()=>box.classList.add('hidden'),2200);
  }

  button.textContent='分享結果卡 / SHARE CARD';
  button.onclick=async()=>{
    try{
      const blob=dataUrlToBlob(drawCard());
      const file=new File([blob],'red-flag-detector-result.png',{type:'image/png'});
      if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
        await navigator.share({title:'RED FLAG DETECTOR',text:`我的 RED FLAG DETECTOR 結果：${$('className')?.textContent||''}`,files:[file]});
        status('已開啟分享選單');
        return;
      }
      fallback(blob);
      status('此瀏覽器不支援圖片分享，已改為下載');
    }catch(error){
      if(error?.name==='AbortError')return;
      try{
        fallback(dataUrlToBlob(drawCard()));
        status('分享失敗，已改為下載圖片');
      }catch{
        status('無法建立結果圖片，請稍後再試');
      }
    }
  };
})();