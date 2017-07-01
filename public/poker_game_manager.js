"use strict"
define(["GUI"], function(GUI){
  return{
    cardDeck: null,
    client_uuid: null,
    playerClient: null,
    inputEventQueue: [],
    socketEvents: null,
    table: null,
    table_uuid: null,
    THPSocket: null,
    numberOfTables: 0,

    testMode: function(){
      this.playerClient = { "cardhand": null,
                            "wealth": 90,
                            "icon": "0",
                            "name": "hoss"  };

    },

    updateGUI: function(event_package){
      switch(event_package.e){
        case "ADD_COMMUNITY_CARD":
          GUI.addCommunityCard(event_package.card);
          break;
        case "ADD_PLAYER": //Reduce all player adding and removing to one playerUpdate() function
          GUI.addPlayer(event_package.player);
          GUI.scaleFonts();
          GUI.scaleIcons();
          break;
        case "ALERT_PLAYER_BET":
          GUI.alertPlayerBet();
          break;
        case "UPDATE_CLIENT_UUID":
          //this.client_uuid = event_package.uuid;
          GUI.client_uuid = event_package.uuid;
          break;
        case "DISPLAY_ERROR_BUBBLE":
          GUI.displayErrorBubble(event_package.pos, event_package.message);
          break;
        case "REMOVE_PLAYER":
          GUI.removePlayer(event_package.player);
          break;
        case "REMOVE_SPLASH_SCREEN":
          GUI.removeSplashScreen();
          break;
        case "RESET_INPUTBOX":
          GUI.resetInputbox();
          break;allIconRadioButtons
        case "RESET_RENDERED_GAME_OBJECTS":
          GUI.resetRenderedGameObjects();
          break;
        case "UPDATE_CARD_HAND":
          GUI.updateCardHand(event_package.game_state_pkg);
          break;
        case "UPDATE_PLAYER_WEALTH":
          GUI.updatePlayerWealth(event_package.player);
          break;
        case "UPDATE_TABLE_POT":
          GUI.updateTablePot(event_package.pot);
          break;
        case "UPDATE_TABLE_UUID":
          this.table_uuid = event_package.table_uuid;
          GUI.updateRoomUUID(event_package.table_uuid);
          break;
        case "UPDATE_SPLASH_SCREEN_TABLE_LIST":
          GUI.updateSplashScreenTableList(event_package.tableInfoPack);
          this.inputEventQueue.push( {func:"addListenerToNewTableElement", args:[event_package.tableInfoPack.uuid]} );
          this.numberOfTables++;
          break;
      }
    },

  }
});
