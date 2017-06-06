define(["CryptoJS"], function(CryptoJS){
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
      this.registerTableOnline = function(table){
        socket.emit("REGISTER_TABLE");
      }

      this.joinTable = function(table_uuid){ //table to join, player to join
        var allPlayerIcons = document.getElementsByClassName("poker-icon-sel-radio-button");
        pgm.playerClient.name = document.getElementById("poker-splash-input-player-name").value.trim();
        console.log(pgm.playerClient.name.length);
        for(var icon=0; icon<allPlayerIcons.length; icon++){
          if(allPlayerIcons[icon].checked && pgm.playerClient.name.length !==0){
            pgm.playerClient.icon = String(icon);

            socket.emit("JOIN_TABLE", pgm.playerClient, table_uuid);
            return 0;
          }
        }
        alert("Please Enter a Name and Select an Icon!");
      }

      //Event Listeners
      socket.on("SPLASH_SCREEN_TABLE_LIST_ITEM", function(table_uuid){
        var callback = function(){self.joinTable(table_uuid); console.log(table_uuid);}
        pgm.updateGUI( {"e":"UPDATE_SPLASH_SCREEN_TABLE_LIST", "table_uuid":table_uuid, "callback":callback} );
      });

      socket.on("TABLE_READY", function(table_uuid){
      });

      socket.on("JOINED_TABLE", function(table_info_pack){
        console.log(table_info_pack);
        pgm.updateGUI( {"e":"REMOVE_SPLASH_SCREEN"} );
        pgm.updateGUI( {e:"UPDATE_TABLE_UUID", table_uuid:table_info_pack.uuid} );
        for(player in table_info_pack.players){
          pgm.updateGUI( {e:"ADD_PLAYER", player:table_info_pack.players[player]} );
        }
      });

      socket.on("PLAYER_JOINED", function(player){
        pgm.updateGUI( {e:"ADD_PLAYER", player:player} );
      });

      socket.on("PLAYER_LEFT", function(player){
        pgm.updateGUI( {e:"REMOVE_PLAYER", player:player} );
      });

      socket.on("ALERT_PLAYER_BET", function(){
        pgm.updateGUI( {e:"ALERT_PLAYER_BET"} );
        //console.log("placed_bet");
      });

      socket.on("CARD_HAND", function(game_state_pkg){
        console.log(game_state_pkg);
        pgm.updateGUI( {e:"UPDATE_CARD_HAND", game_state_pkg: game_state_pkg} ); //currentHandPlayers, clientHand
      });

      socket.on("UPDATE_CLIENT_UUID", function(uuid){
        pgm.updateGUI( {e:"UPDATE_CLIENT_UUID", uuid:uuid} );
      });

    }

  }
});

/*
//var key = CryptoJS.enc.Base64.parse("supadupasecretkey");
var key = "supadupasecretkey";
var iv = CryptoJS.enc.Base64.parse("puresalt");
var message = "hello hoss";
var encrypted = CryptoJS.AES.encrypt(message, key);
console.log(encrypted.toString());
console.log(CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8));
*/
