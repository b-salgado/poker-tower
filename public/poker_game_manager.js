/* jshint browser: true */
/*global
alert, confirm, console, prompt, define,io
*/
"use strict";
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
    timerCallback: null,
    numberOfTables: 0,

    testMode: function(){
      this.playerClient = {
        "cardhand": null,
        "wealth": 90,
        "icon": "0",
        "name": "hoss"
      };
    },

    startBetTimer: function(timerPkg){
      console.log(timerPkg.player_uuid, this.client_uuid);
      const self = this;
      if(timerPkg.player_uuid === this.client_uuid){
        console.log(timerPkg);
        if(timerPkg.is_raise === true){
          this.timerCallback = setTimeout(function(){
            (function(self){
              self.inputEventQueue.push( {func:"inputPlayerFold", args:[] } );
            })(self);
          }, timerPkg.betTimerTime);
        }
        else{
          this.timerCallback = setTimeout(function(){
            (function(self){
              console.log("called");
              self.inputEventQueue.push( {func:"inputPlayerCall", args:[] } );
            })(self);
          }, timerPkg.betTimerTime);
        }
      }
    },

    updateGUI: function(event_package){
      switch(event_package.e){
        case "ADD_COMMUNITY_CARD":
          GUI.addCommunityCard(event_package.card);
          break;
        case "ADD_PLAYER": //Reduce all player adding and removing to one playerUpdate() function
          GUI.addPlayer(event_package.player);
          //GUI.scaleFonts();
          //GUI.scaleIcons();
          break;
        case "ALERT_PLAYER_BET":
          GUI.alertPlayerBetTimer();
          break;
        case "UPDATE_CLIENT_UUID":
          this.client_uuid = event_package.uuid;
          GUI.client_uuid = event_package.uuid;
          break;
        case "DISPLAY_ERROR_BUBBLE":
          GUI.alertErrorBubble(event_package.pos, event_package.message);
          break;
        case "REMOVE_PLAYER":
          GUI.removePlayer(event_package.player);
          break;
        case "REMOVE_SPLASH_SCREEN":
          GUI.removeSplashScreen();
          break;
        case "RESET_INPUTBOX":
          GUI.resetInputbox();
          break;
        case "RESET_RENDERED_GAME_OBJECTS":
          GUI.resetRenderedGameObjects();
          break;
        case "SHOW_DOWN":
          GUI.showDown(event_package.currentHandPlayers);
          break;
        case "START_BET_TIMER":
            GUI.startBetTimer(event_package.timerPkg);
            GUI.stopBetTimerForNotTurn(event_package.timerPkg);
          break;
        case "TABLE_ANNOUNCEMENT":
          GUI.alertMessage(null, event_package.message);
          break;
        case "UPDATE_CARD_HAND":
          GUI.updateCardHand(event_package.gameStatePkg);
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
          GUI.updateSplashScreenTableList(event_package.tablePkg);
          this.inputEventQueue.push( {func:"addListenerToNewTableElement", args:[event_package.tablePkg.uuid]} );
          this.numberOfTables++;
          break;
      }
    },

  };
});
