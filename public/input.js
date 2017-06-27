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
        const nameInputElement = document.getElementById("pkss-new-table-name");
        const anteInputElement = document.getElementById("pkss-new-table-ante"); //Return NaN if char in string
        const initPlayersInputElement = document.getElementById("pkss-new-table-init-players");
        const errorBubble = document.getElementsByClassName("error-bubble")[0];
        let tableInfoPack = {};
        let checkList = [];
        if(!self.stringInRange(nameInputElement.value.trim(), 1, 12)){
          let nameInputBoundingRect = nameInputElement.getBoundingClientRect();
          errorBubble.style.top = nameInputBoundingRect.top + nameInputBoundingRect.height + "px";
          errorBubble.style.left = nameInputBoundingRect.left + "px";
          errorBubble.innerText = "Please Enter (1-12) Characters";
          errorBubble.style.display = "flex";
          checkList.push(false);
        }
        else{
          checkList.push(true);
          tableInfoPack.name = document.getElementById("pkss-new-table-name");
        }
        let ante = Number(anteInputElement.value.trim());
        if( !(ante) ){
          let anteInputBoundingRect = anteInputElement.getBoundingClientRect();
          errorBubble.style.top = anteInputBoundingRect.top + anteInputBoundingRect.height + "px";
          errorBubble.style.left = anteInputBoundingRect.left + "px";
          errorBubble.innerText = "Ante Must be a Number";
          errorBubble.style.display = "flex";
          checkList.push(false);
        }
        else if(ante<=0){
          let anteInputBoundingRect = anteInputElement.getBoundingClientRect();
          errorBubble.style.top = anteInputBoundingRect.top + anteInputBoundingRect.height + "px";
          errorBubble.style.left = anteInputBoundingRect.left + "px";
          errorBubble.innerText = "Ante Must be GREATER than 0";
          errorBubble.style.display = "flex";
          checkList.push(false);
        }
        else if(ante){
          checkList.push(true);
          tableInfoPack.ante = ante;
        }
        if(initPlayersInputElement.value === ""){
          checkList.push(true);
        }

        if(self.checkCheckList(checkList)){
          pgm.THPSocket.registerTableOnline(tableInfoPack);
        }

      });
    },

    checkCheckList: function(checklist){
      for(var i=0; i<checklist.length; i++){
        if( !(checklist[i] === true) ){
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

    errorBubbleLogic: function(){ //To be filled with more animations error notices etc...
      const tableRegisterForm = document.getElementsByClassName("pkss-register-table-form")[0];
      const tableInputs = tableRegisterForm.getElementsByTagName("input");
      for(var input=0; input<tableInputs.length; input++){
        tableInputs[input].addEventListener("click", function(){
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
