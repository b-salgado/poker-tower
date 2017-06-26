"use strict"
define(["PokerGameManager"], function(pgm){
  return{
    init: function(){
      this.addEvtListeners();
      this.errorBubbleLogic();
      this.activateSplashScreenInteractivity();
    },

    activateSplashScreenInteractivity:function(){
      this.activateChangePlayerProfileButton();
      this.activateCreateTable();
    },

    activateChangePlayerProfileButton: function(){
      document.getElementById("pkss-change-profile-settings-button").addEventListener("click", function(e){
        let profileSettingsContainer = document.getElementById("pkss-change-profile-settings-ctnr");
        profileSettingsContainer.classList.toggle("pkss-change-profile-settings-ctnr-closed");
    })},

    activateCreateTable: function(){
      var self = this;
      document.getElementById("pkss-create-table-button").addEventListener("click", function(e){
        let nameInputElement = document.getElementById("pkss-new-table-name");
        let tableInfoPack = {};
        let name = null;
        let ante = null;
        let initPlayers = null;
        if(self.stringInRange(nameInputElement.value.trim(), 6, 12)){
          let errorBubble = document.getElementsByClassName("error-bubble")[0];
          let nameInputBoundingRect = nameInputElement.getBoundingClientRect();
          errorBubble.style.top = nameInputBoundingRect.top + nameInputBoundingRect.height + "px";
          errorBubble.style.left = nameInputBoundingRect.left + "px";
          errorBubble.innerText = "Please Enter (1-12) Characters";
          errorBubble.style.display = "flex";
        }
        else{
        }
        tableInfoPack.name = document.getElementById("pkss-new-table-name");
        //pgm.THPSocket.registerTableOnline();
      });
    },

    stringInRange: function(string, min, max){
      if(string.length >= min && string.length <= max){
        return true;
      }
      return false;
    },

    errorBubbleLogic: function(){ //To be filled with more animations error notices etc...
      const tableRegisterForm = document.getElementsByClassName("pkss-register-table-form");
      const tableInputs = tableRegisterForm.getElementsByTagName("input");
      for(var input=0; input<tableInputs.length; input++){
        document.getElementsByClassName("pk-splash-screen")[0].addEventListener("click", function(){
          console.log("test");
          const errorBubbles = document.getElementsByClassName("error-bubble");
          for(var errorBubble=0; errorBubble<errorBubbles.length; errorBubble++){
            console.log(errorBubbles[errorBubble]);
            errorBubbles[errorBubble].style.display = "none";
          }
        });
      }
    },

    addEvtListeners:function(){

      document.getElementById("poker-raise").addEventListener("click", function(e){
        var pokerInputVal = document.getElementById("poker-inputbox").value.trim();
        pokerInputVal = Number(pokerInputVal); //Return NaN if char in string
        if( !(pokerInputVal) ){
          alert("Enter a numerical value!");
        }
        else if(pokerInputVal<0){
          alert("Enter a numerical value greater than 0!");
        }
        else if(pokerInputVal){
          console.log(pgm.THPSocket);
          pgm.THPSocket.socket.emit("PLAYER_RAISE", {table_uuid: pgm.table_uuid, betValue: pokerInputVal} );
          pgm.updateGUI( {e:"RESET_INPUTBOX"} );
        }

        //if
      });

      document.getElementById("poker-call").addEventListener("click", function(e){
          pgm.THPSocket.socket.emit("PLAYER_CALL", {table_uuid: pgm.table_uuid} );
      });

      document.getElementById("poker-fold").addEventListener("click", function(e){
          pgm.THPSocket.socket.emit("PLAYER_FOLD", {table_uuid: pgm.table_uuid} );
      });

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

  }
});
