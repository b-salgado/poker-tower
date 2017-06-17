"use strict"
define(["PokerGameManager"], function(pgm){
  return{
    init: function(){
      this.addEvtListeners();
    },

    addEvtListeners(){
      document.getElementById("poker-splash-screen-create-table-button").addEventListener("click", function(e){
        pgm.THPSocket.registerTableOnline();
      });

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
