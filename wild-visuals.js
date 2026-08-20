(() => {
  const canvas=document.getElementById('portrait');
  const quote=document.getElementById('quote');
  const count=document.getElementById('count');
  if(!canvas||!quote)return;

  const data=window.RED_FLAG_DATA||[];
  const quoteMap=new Map(data.filter(x=>x?.persona).map(x=>[String(x.quote||'').trim(),x.persona]));
  const sceneByPersona={
    P01:'night',P02:'home',P03:'date',P04:'social',P05:'cafe',P06:'night',P07:'street',P08:'home',P09:'social',P10:'office',P11:'cafe',P12:'street',
    P13:'office',P14:'family',P15:'mystic',P16:'tech',P17:'shared',P18:'office',P19:'timeline',P20:'family'
  };

  function currentPersona(){return quoteMap.get(String(quote.textContent||'').trim())||'';}
  function px(ctx,x,y,w,h,fill){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);}

  function paintScene(ctx,id){
    const scene=sceneByPersona[id]||'date';
    const dark='#0b0d10', deep='#10161b', cyan='#62c7c9', gold='#d2b06d', red='#e05a67', white='#d7d7d7', muted='#38434a';
    px(ctx,30,30,54,70,deep);px(ctx,144,30,52,70,deep);

    if(scene==='night'||scene==='street'){
      px(ctx,35,39,8,22,cyan);px(ctx,47,48,5,13,gold);px(ctx,58,34,11,32,muted);px(ctx,151,42,8,24,red);px(ctx,166,34,13,31,muted);px(ctx,184,50,7,15,cyan);
      px(ctx,31,88,54,7,'#151b20');px(ctx,144,88,52,7,'#151b20');
    }else if(scene==='cafe'||scene==='date'){
      px(ctx,36,39,43,4,gold);px(ctx,41,48,32,20,'#182026');px(ctx,48,52,18,4,cyan);px(ctx,151,43,36,25,'#171d22');px(ctx,158,49,21,4,gold);px(ctx,34,84,50,11,'#2a2018');px(ctx,144,84,49,11,'#2a2018');
    }else if(scene==='home'||scene==='family'||scene==='shared'){
      px(ctx,37,40,39,26,'#1b2422');px(ctx,43,46,27,14,'#2c3830');px(ctx,151,39,36,30,'#1d2428');px(ctx,157,46,24,18,'#31383a');px(ctx,35,84,48,10,'#342b24');px(ctx,145,84,47,10,'#342b24');
      if(scene==='family'){px(ctx,41,51,5,5,gold);px(ctx,49,51,5,5,red);px(ctx,57,51,5,5,cyan);} 
      if(scene==='shared'){px(ctx,154,73,8,8,gold);px(ctx,166,73,8,8,cyan);px(ctx,178,73,8,8,red);} 
    }else if(scene==='office'||scene==='timeline'){
      for(let y=39;y<84;y+=12){px(ctx,36,y,42,3,muted);px(ctx,149,y,39,3,muted);}px(ctx,42,45,8,6,cyan);px(ctx,54,45,18,6,white);px(ctx,153,57,25,6,gold);px(ctx,181,57,5,6,red);
      if(scene==='timeline'){px(ctx,149,77,38,3,cyan);px(ctx,160,71,3,15,gold);px(ctx,176,72,3,13,red);} 
    }else if(scene==='social'){
      px(ctx,36,38,40,52,'#131a20');px(ctx,42,44,28,7,cyan);px(ctx,42,55,22,4,white);px(ctx,42,64,27,4,gold);px(ctx,150,38,39,52,'#131a20');px(ctx,156,44,26,6,red);px(ctx,156,55,19,4,white);px(ctx,156,65,25,4,cyan);
    }else if(scene==='mystic'){
      [[43,43],[63,54],[52,73],[163,42],[181,59],[154,76]].forEach(([x,y],i)=>px(ctx,x,y,4,4,i%2?cyan:gold));ctx.strokeStyle='#4d6870';ctx.lineWidth=1;ctx.beginPath();ctx.arc(57,58,18,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(169,59,18,0,Math.PI*2);ctx.stroke();
    }else if(scene==='tech'){
      px(ctx,36,39,42,47,'#081317');px(ctx,149,39,40,47,'#081317');for(let y=45;y<80;y+=8){px(ctx,41,y,10,3,cyan);px(ctx,54,y,18,3,white);px(ctx,154,y,15,3,gold);px(ctx,172,y,11,3,cyan);}
    }
  }

  function outfitAccent(ctx,id){
    const gold='#d2b06d',cyan='#62c7c9',red='#e05a67',white='#d7d7d7',dark='#0b0d10';
    const accent={P01:cyan,P02:white,P03:red,P04:red,P05:gold,P06:red,P07:cyan,P08:white,P09:cyan,P10:gold,P11:white,P12:red,P13:gold,P14:red,P15:gold,P16:cyan,P17:gold,P18:white,P19:cyan,P20:gold}[id]||cyan;
    px(ctx,78,108,8,18,accent);px(ctx,138,108,8,18,accent);

    if(id==='P01'){px(ctx,153,104,16,22,cyan);px(ctx,156,108,10,14,dark);px(ctx,159,112,4,3,white);}
    if(id==='P02'){px(ctx,48,106,25,15,white);px(ctx,52,110,17,3,dark);px(ctx,52,116,12,3,cyan);}
    if(id==='P03'){px(ctx,150,102,28,21,red);px(ctx,160,102,4,21,gold);px(ctx,150,110,28,4,gold);}
    if(id==='P04'){px(ctx,155,99,18,28,red);px(ctx,159,103,10,18,dark);px(ctx,160,106,8,3,white);}
    if(id==='P05'){px(ctx,46,103,30,25,gold);px(ctx,52,98,16,8,white);}
    if(id==='P06'){px(ctx,49,106,24,18,red);px(ctx,54,101,14,6,red);px(ctx,57,111,8,3,dark);}
    if(id==='P07'){px(ctx,48,111,24,12,cyan);px(ctx,52,106,16,7,cyan);}
    if(id==='P08'){px(ctx,47,104,29,22,white);px(ctx,61,104,3,22,dark);px(ctx,53,110,6,3,cyan);}
    if(id==='P09'){px(ctx,154,103,18,24,cyan);px(ctx,158,107,10,15,dark);px(ctx,160,109,6,3,red);}
    if(id==='P10'){px(ctx,47,105,27,23,white);px(ctx,51,110,19,3,dark);px(ctx,51,116,14,3,gold);}
    if(id==='P11'){px(ctx,46,108,23,17,white);px(ctx,68,112,6,9,white);px(ctx,51,111,12,3,dark);}
    if(id==='P12'){px(ctx,48,111,14,14,gold);px(ctx,61,116,18,4,gold);px(ctx,70,112,4,8,red);}
    if(id==='P13'){
      px(ctx,153,96,28,31,gold);px(ctx,157,101,20,23,dark);for(let y=105;y<=117;y+=6){px(ctx,160,y,4,3,cyan);px(ctx,166,y,8,3,white);}px(ctx,160,93,13,5,white);
    }
    if(id==='P14'){
      [[156,101],[171,104],[164,91]].forEach(([x,y],i)=>{px(ctx,x,y,9,9,i===1?gold:red);px(ctx,x-2,y+9,13,8,dark);});px(ctx,157,119,24,4,gold);
    }
    if(id==='P15'){
      [[160,43],[177,53],[155,61],[184,72],[168,78]].forEach(([x,y])=>px(ctx,x,y,5,5,gold));ctx.strokeStyle=cyan;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(162,45);ctx.lineTo(179,55);ctx.lineTo(157,63);ctx.lineTo(186,74);ctx.lineTo(170,80);ctx.stroke();
    }
    if(id==='P16'){
      px(ctx,147,99,38,27,cyan);px(ctx,151,103,30,19,dark);px(ctx,155,107,8,3,white);px(ctx,165,107,10,3,gold);px(ctx,155,114,18,3,cyan);px(ctx,175,114,3,3,white);
    }
    if(id==='P17'){
      px(ctx,151,104,22,17,gold);px(ctx,154,98,6,7,gold);px(ctx,165,98,6,7,gold);px(ctx,157,109,4,4,dark);px(ctx,168,109,4,4,dark);px(ctx,176,108,5,5,cyan);px(ctx,183,108,5,5,cyan);px(ctx,180,110,5,2,cyan);
    }
    if(id==='P18'){
      px(ctx,110,96,6,28,red);px(ctx,107,96,12,7,red);px(ctx,151,99,32,29,white);px(ctx,155,103,24,21,dark);px(ctx,159,107,15,3,gold);px(ctx,159,113,12,3,cyan);px(ctx,159,119,17,3,white);
    }
    if(id==='P19'){
      px(ctx,148,102,32,6,red);px(ctx,163,113,31,6,cyan);px(ctx,174,106,4,13,gold);px(ctx,178,108,7,3,gold);px(ctx,178,114,7,3,gold);
    }
    if(id==='P20'){
      px(ctx,149,103,30,22,gold);px(ctx,153,96,22,8,red);px(ctx,159,110,10,15,dark);px(ctx,181,98,24,15,cyan);px(ctx,186,113,5,5,cyan);px(ctx,185,102,16,3,dark);px(ctx,185,107,12,3,dark);
    }
  }

  function decorate(){
    const id=currentPersona();
    if(!id)return;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    paintScene(ctx,id);
    outfitAccent(ctx,id);
  }

  let queued=false;
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;requestAnimationFrame(decorate);});}
  const observer=new MutationObserver(queue);
  observer.observe(quote,{childList:true,characterData:true,subtree:true});
  if(count)observer.observe(count,{childList:true,characterData:true,subtree:true});
  queue();
})();