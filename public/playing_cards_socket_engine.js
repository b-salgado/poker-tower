/* jshint browser: true */
/*global
alert, confirm, console, prompt, define,io
*/
"use strict";
define(function(){
  return{
    socket: null,

    init: function(){
      this.socket = io("/poker");
    },

    DEFAULT: function(){

    },

    TEXAS_HOLDEM_POKER: function(socket, PGM){
      //Private
      var pgm = PGM;
      var self = this;

      //public
      this.socket = socket;

      //Event Senders
      this.registerTableOnline = function(tablePkg){
        socket.emit("REGISTER_TABLE", tablePkg);
      };

      this.joinTable = function(table_uuid){ //table to join, player to join
        var allIconRadioButtons = document.getElementsByClassName("poker-icon-sel-radio-button");
        pgm.playerClient.name = document.getElementById("poker-splash-input-player-name").value.trim();
        console.log(pgm.playerClient.name.length);
        for(var icon=0; icon<allIconRadioButtons.length; icon++){
          if(allIconRadioButtons[icon].checked && pgm.playerClient.name.length !==0){
            let iconNameIndex = allIconRadioButtons[icon].previousElementSibling.src.lastIndexOf("/");
            pgm.playerClient.icon = allIconRadioButtons[icon].previousElementSibling.src.slice(iconNameIndex);

            socket.emit("JOIN_TABLE", pgm.playerClient, table_uuid);
            return 0;
          }
        }
        alert("Please Enter a Name and Select an Icon!");
      };

      //Event Listeners
      /*socket.on("SPLASH_SCREEN_TABLE_LIST_ITEM", function(table_uuid){
        var callback = function(){self.joinTable(table_uuid); console.log(table_uuid);}
        pgm.updateGUI( {"e":"UPDATE_SPLASH_SCREEN_TABLE_LIST", "table_uuid":table_uuid, "callback":callback} );
      });*/

      socket.on("ALERT_PLAYER_BET", function(){
        pgm.updateGUI( {e:"ALERT_PLAYER_BET"} );
        //console.log("placed_bet");
      });

      socket.on("CARD_HAND", function(gameStatePkg){
        console.log(gameStatePkg);
        pgm.updateGUI( {e:"UPDATE_CARD_HAND", gameStatePkg: gameStatePkg} ); //currentHandPlayers, clientHand
      });

      socket.on("COMMUNITY_CARD", function(card){
        pgm.updateGUI( {e:"ADD_COMMUNITY_CARD", card:card} );
      });

      socket.on("GAME_WIN", function(){
        pgm.gameWin();
      });

      socket.on("JOINED_TABLE", function(tablePkg){
        console.log(tablePkg);
        pgm.updateGUI( {"e":"REMOVE_SPLASH_SCREEN"} );
        pgm.updateGUI( {e:"UPDATE_TABLE_UUID", table_uuid:tablePkg.uuid} );
        for(var player in tablePkg.players){
          pgm.updateGUI( {e:"ADD_PLAYER", player:tablePkg.players[player]} );
        }
      });

      socket.on("PLAYER_JOINED", function(player){
        pgm.updateGUI( {e:"ADD_PLAYER", player:player} );
      });

      socket.on("PLAYER_LEFT", function(player){
        pgm.updateGUI( {e:"REMOVE_PLAYER", player:player} );
      });

      socket.on("RESET_RENDERED_GAME_OBJECTS", function(){
        pgm.updateGUI( {e:"RESET_RENDERED_GAME_OBJECTS"} );
      });

      socket.on("SHOW_DOWN", function(currentHandPlayers){
        //console.log(currentHandPlayers);
        pgm.updateGUI( {e:"SHOW_DOWN", currentHandPlayers:currentHandPlayers} );
      });

      socket.on("START_BET_TIMER", function(timerPkg){ //{player_uuid: playertobet, betTime: timetoplacebet}
        //console.log(currentHandPlayers);
        pgm.startBetTimer(timerPkg);
        pgm.updateGUI( {e:"START_BET_TIMER", timerPkg:timerPkg} );
      });

      socket.on("SPLASH_SCREEN_TABLE_LIST_ITEM", function(tablePkg){
        pgm.updateGUI( {e:"UPDATE_SPLASH_SCREEN_TABLE_LIST", tablePkg:tablePkg} );
      });

      socket.on("TABLE_ANNOUNCEMENT", function(message){
        //console.log(currentHandPlayers);
        pgm.updateGUI( {e:"TABLE_ANNOUNCEMENT", message:message} );
      });

      socket.on("UPDATE_CLIENT_UUID", function(uuid){
        pgm.updateGUI( {e:"UPDATE_CLIENT_UUID", uuid:uuid} );
      });

      socket.on("UPDATE_PLAYER_WEALTH", function(playerPkg){
        //console.log(player_pkg);
        pgm.updateGUI( {e:"UPDATE_PLAYER_WEALTH", player:playerPkg.player} );
      });

      socket.on("UPDATE_TABLE_POT", function(pot){
        pgm.updateGUI( {e:"UPDATE_TABLE_POT", pot:pot} );
      });

    }

  };
});
