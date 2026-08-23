(() => {
  const exact={
    'P01-03':'朋友限動一發，他先冷掉了',
    'P01-06':'抓到了：快失去才突然有空',
    'P02-05':'半小時到了，他居然真的回來',
    'P02-09':'忘記紀念日，但沒有開始找藉口',
    'P03-01':'第二次見面，人生藍圖已經開到同居',
    'P03-03':'妳踩煞車，他開始問是不是不夠愛',
    'P04-02':'定位共享提案正式送出',
    'P04-05':'漏接一通，未接來電 ×5',
    'P05-10':'甜話 0 句，妳講過的細節記得一堆',
    'P06-01':'02:13 // 「睡了嗎？」',
    'P06-03':'前任開始使用「如果當時」句型',
    'P07-03':'PLOT TWIST：這次他沒有逃',
    'P08-08':'妳說不要，他真的停了',
    'P09-01':'限動第 14 則已發布，妳的訊息還在等',
    'P10-04':'機場水錢：也要五五分',
    'P11-03':'關係狀態準備從「再看看」升級',
    'P12-03':'第二次遲到，熟悉的「路上很塞」登場',
    'P12-06':'PLOT TWIST：他真的先訂位了',
    R01:'RARE DROP // 阿澤終於講人話',
    R02:'RARE DROP // 安全感不是查手機',
    R03:'RARE DROP // Leo 有踩煞車',
    R04:'RARE DROP // 情勒條款正式現形',
    R05:'RARE DROP // 行程表上真的有妳',
    R06:'RARE DROP // 前任第一次不求回覆',
    R07:'RARE DROP // 想逃，但人還在',
    R08:'RARE DROP // 愛不等於取消界線',
    R09:'RARE DROP // Ryan 把手機放下了',
    R10:'RARE DROP // Excel 暫時關閉',
    R11:'RARE DROP // 多線模式自行關閉',
    R12:'RARE DROP // Nick 先做再說'
  };

  function hookFor(item){
    if(item && item.hook) return item.hook;
    if(item && exact[item.id]) return exact[item.id];
    return item && item.type ? item.type : '';
  }

  window.RED_FLAG_FLAVOR={hookFor};
})();
