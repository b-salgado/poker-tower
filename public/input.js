/* jshint browser: true */
/*global
alert, confirm, console, prompt, define
*/
"use strict";
define(["PokerGameManager"], function(pgm){
  return{
    POLL_EVENT_QUEUE: 800,
    init: function(){
      this.cinCurrentPlayerInfo();
      this.addEvtListeners();
      this.activateSplashScreenInteractivity();
      this.startEventQueuePolling();
    },

    startEventQueuePolling: function(){
      const self = this;
      setInterval(function(){
        while(pgm.inputEventQueue.length > 0){
          console.log(pgm.inputEventQueue);
          const doFunc = pgm.inputEventQueue.pop();
          self[doFunc.func](doFunc.args[0]);
          console.log(pgm.inputEventQueue);
        }
      }, self.POLL_EVENT_QUEUE);
    },

    addListenerToNewTableElement: function(table_uuid){
      const self = this;
      const newTableElement = document.getElementById(table_uuid);
      newTableElement.addEventListener("click", function(){
        const table_uuid = this.id;
        self.cinCurrentPlayerInfo();
        pgm.THPSocket.socket.emit("JOIN_TABLE", pgm.playerClient, table_uuid);
      });
    },

    activateSplashScreenInteractivity:function(){
      this.activateChangePlayerProfileButton();
      this.activateCreateTable();
    },

    activateChangePlayerProfileButton: function(){
      document.getElementById("pkss-change-profile-settings-button").addEventListener("click", function(e){
        const profileSettingsContainer = document.getElementById("pkss-change-profile-settings-ctnr");
        profileSettingsContainer.classList.toggle("pkss-change-profile-settings-ctnr-closed");
    });},

    cinCurrentPlayerInfo: function(){ //table to join, player to join
      const errorBubble = document.getElementsByClassName("pk-error-bubble")[0];
      const currentPlayerIcon = document.getElementById("pkss-current-profile-icon");
      pgm.playerClient.name = document.getElementById("pkss-current-profile-name").innerText.trim();
      pgm.playerClient.icon = currentPlayerIcon.src.slice(currentPlayerIcon.src.lastIndexOf("/")+1);
      console.log(pgm.playerClient);
    },

    activateCreateTable: function(){
      const self = this;
      document.getElementById("pkss-create-table-button").addEventListener("click", function(e){
        const nameInputElement = document.getElementById("pkss-new-table-name");
        const anteInputElement = document.getElementById("pkss-new-table-ante"); //Return NaN if char in string
        const initPlayersInputElement = document.getElementById("pkss-new-table-init-players");
        const errorBubble = document.getElementsByClassName("pk-error-bubble")[0];
        const nameInputBoundingRect = nameInputElement.getBoundingClientRect();
        const anteInputBoundingRect = anteInputElement.getBoundingClientRect();
        const ante = Number(anteInputElement.value.trim());
        let tablePkg = {};
        let checkList = [];
        if(!self.stringInRange(nameInputElement.value.trim(), 1, 12)){
          pgm.updateGUI({
            e: "DISPLAY_ERROR_BUBBLE",
            pos: [nameInputBoundingRect.left, nameInputBoundingRect.top + nameInputBoundingRect.height],
            message: "Name: Enter (1-12) Characters"
          });
          checkList.push(false);
        }
        else{
          checkList.push(true);
          tablePkg.name = document.getElementById("pkss-new-table-name").value;
        }
        if(!ante){
          pgm.updateGUI({
            e: "DISPLAY_ERROR_BUBBLE",
            pos: [anteInputBoundingRect.left, anteInputBoundingRect.top + anteInputBoundingRect.height],
            message: "Ante: Must be a Number"
          });
          checkList.push(false);
        }
        else if(ante < 1){
          pgm.updateGUI({
            e: "DISPLAY_ERROR_BUBBLE",
            pos: [anteInputBoundingRect.left, anteInputBoundingRect.top + anteInputBoundingRect.height],
            message: "Ante: Must be greater than 0"
          });
          checkList.push(false);
        }
        else if(ante){
          checkList.push(true);
          tablePkg.ante = ante;
        }
        if(initPlayersInputElement.value === ""){
          checkList.push(true);
        }

        if(self.checkCheckList(checkList)){
          console.log(tablePkg);
          pgm.THPSocket.registerTableOnline(tablePkg);
        }

      });
    },

    checkCheckList: function(checklist){
      for(var i = 0; i < checklist.length; i++){
        if(checklist[i] !== true){
          return false;
        }
      }
      return true;
    },

    stringInRange: function(string, min, max){
      if(string.length >= min && string.length <= max){
        return true;
      }
      return false;
    },

    inputPlayerFold: function(){
      pgm.THPSocket.socket.emit("PLAYER_FOLD", {table_uuid: pgm.table_uuid} );
    },

    inputPlayerCall: function(){
      pgm.THPSocket.socket.emit("PLAYER_CALL", {table_uuid: pgm.table_uuid} );
    },

    inputPlayerRaise: function(){
      const pokerInputVal = document.getElementById("pk-inputbox").value.trim();
      if(!Number(pokerInputVal)){
        alert("Enter a numerical value!");
      }
      else if(pokerInputVal < 0){
        alert("Enter a numerical value greater than 0!");
      }
      else if(pokerInputVal){
        console.log(pgm.THPSocket);
        pgm.THPSocket.socket.emit("PLAYER_RAISE", {table_uuid: pgm.table_uuid, betValue: pokerInputVal} );
        pgm.updateGUI( {e:"RESET_INPUTBOX"} );
      }
    },

    addEvtListeners:function(){
      const self = this;
      document.getElementById("pk-raise").addEventListener("click", self.inputPlayerRaise);

      document.getElementById("pk-call").addEventListener("click", self.inputPlayerCall);

      document.getElementById("pk-fold").addEventListener("click", self.inputPlayerFold);

      window.addEventListener("keydown", function(e){
        console.log(e.which);
        if(e.which === 78 || e.keyCode === 78){//n
        }
        else if(e.which === 83 || e.keyCode === 83){//s
        }
        else if(e.which === 77 || e.keyCode === 77){//m
        }
        else if(e.which === 74 || e.keyCode === 74){//j join
        }

      });
    }

  };
});
