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
        if(pokerInputVal){
          console.log(pgm.THPSocket);
          pgm.THPSocket.socket.emit("PLAYER_BET", {table_uuid: pgm.table_uuid, betValue: pokerInputVal} );
        }
        else{
          alert("Enter a numerical value!");
        }
        //if
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
