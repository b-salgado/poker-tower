define(["PlayingCardsEngine","GUI"], function(CardGame, GUI){
  return{
    cardDeck: null,
    client_uuid: null,
    playerClient: null,
    socketEvents: null,
    table: null,
    THPSocket: null,
    numberOfTables: 0,

    testMode: function(){
      this.playerClient = { "cardhand": null,
                            "currency": null,
                            "icon": "0",
                            "name": "hoss"  };

    },

    updateGUI: function(event_package){
      switch(event_package.e){
        case "ADD_PLAYER": //Reduce all player adding and removing to one playerUpdate() function
          GUI.addPlayer(event_package.player);
          GUI.scaleFonts();
          GUI.scaleIcons();
          break;
        case "UPDATE_CLIENT_UUID":
          //this.client_uuid = event_package.uuid;
          GUI.client_uuid  = event_package.uuid;
          break;
        case "REMOVE_PLAYER":
          GUI.removePlayer(event_package.player);
          break;
        case "REMOVE_SPLASH_SCREEN":
          GUI.removeSplashScreen();
          break;
        case "UPDATE_CARD_HAND":
          GUI.updateCardHand(event_package.game_state_pkg);
          break;
        case "UPDATE_TABLE_UUID":
          GUI.updateRoomUUID(event_package.table_uuid);
          break;
        case "UPDATE_SPLASH_SCREEN_TABLE_LIST":
          GUI.updateSplashScreenTableList(event_package);
          document.getElementById(event_package.table_uuid).addEventListener("click", event_package.callback);
          this.numberOfTables++;
          break;
      }
    },

  }
});
