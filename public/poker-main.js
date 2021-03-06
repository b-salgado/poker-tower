"use strict";
require(["poker_mod_conf.js"], function(){
  require(["GUI","Input","PlayingCardsSocketEngine","PokerGameManager"], function(GUI, Input, PlayingCardsSocketEngine, PokerGameManager){
    window.onLoad = pokerMain();

    function pokerMain(){
      PlayingCardsSocketEngine.init();
      PokerGameManager.THPSocket = new PlayingCardsSocketEngine.TEXAS_HOLDEM_POKER(PlayingCardsSocketEngine.socket, PokerGameManager);
      PokerGameManager.testMode();
      

      Input.init();
      GUI.init();

    }


  });
});
