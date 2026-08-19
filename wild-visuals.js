(() => {
  const canvas=document.getElementById('portrait');
  const quote=document.getElementById('quote');
  const count=document.getElementById('count');
  if(!canvas||!quote)return;

  const map=new Map((window.RED_FLAG_DATA||[]).filter(x=>/^P1[3-8]-/.test(x.id)).map(x=>[String(x.quote||'').trim(),x.persona]));

  function currentPersona(){return map.get(String(quote.textContent||'').trim())||'';}
  function px(ctx,x,y,w,h,fill){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);}

  function decorate(){
    const id=currentPersona();
    if(!id)return;
    const ctx=canvas.getContext('2d');
    const gold='#d2b06d',cyan='#62c7c9',red='#e05a67',white='#d7d7d7',dark='#0b0d10';
    ctx.imageSmoothingEnabled=false;

    if(id==='P13'){
      // KPI / spreadsheet clipboard
      px(ctx,153,96,28,31,gold);px(ctx,157,101,20,23,dark);
      for(let y=105;y<=117;y+=6){px(ctx,160,y,4,3,cyan);px(ctx,166,y,8,3,white);}
      px(ctx,160,93,13,5,white);
    }
    if(id==='P14'){
      // family group: three tiny heads
      [[156,101],[171,104],[164,91]].forEach(([x,y],i)=>{px(ctx,x,y,9,9,i===1?gold:red);px(ctx,x-2,y+9,13,8,dark);});
      px(ctx,157,119,24,4,gold);
    }
    if(id==='P15'){
      // astrology constellation
      [[160,43],[177,53],[155,61],[184,72],[168,78]].forEach(([x,y])=>px(ctx,x,y,5,5,gold));
      ctx.strokeStyle=cyan;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(162,45);ctx.lineTo(179,55);ctx.lineTo(157,63);ctx.lineTo(186,74);ctx.lineTo(170,80);ctx.stroke();
    }
    if(id==='P16'){
      // tiny terminal / AI screen
      px(ctx,147,99,38,27,cyan);px(ctx,151,103,30,19,dark);
      px(ctx,155,107,8,3,white);px(ctx,165,107,10,3,gold);px(ctx,155,114,18,3,cyan);px(ctx,175,114,3,3,white);
    }
    if(id==='P17'){
      // dog + linked chain icon
      px(ctx,151,104,22,17,gold);px(ctx,154,98,6,7,gold);px(ctx,165,98,6,7,gold);px(ctx,157,109,4,4,dark);px(ctx,168,109,4,4,dark);
      px(ctx,176,108,5,5,cyan);px(ctx,183,108,5,5,cyan);px(ctx,180,110,5,2,cyan);
    }
    if(id==='P18'){
      // tie + interview clipboard
      px(ctx,110,96,6,28,red);px(ctx,107,96,12,7,red);
      px(ctx,151,99,32,29,white);px(ctx,155,103,24,21,dark);
      px(ctx,159,107,15,3,gold);px(ctx,159,113,12,3,cyan);px(ctx,159,119,17,3,white);
    }
  }

  let queued=false;
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;requestAnimationFrame(decorate);});}
  const observer=new MutationObserver(queue);
  observer.observe(quote,{childList:true,characterData:true,subtree:true});
  if(count)observer.observe(count,{childList:true,characterData:true,subtree:true});
  queue();
})();
