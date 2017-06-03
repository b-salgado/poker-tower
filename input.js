define(["PokerGameManager"], function(pgm){
  return{
    init: function(){
      this.addEvtListeners();
    },

    addEvtListeners(){
      document.getElementById("poker-splash-screen-create-table-button").addEventListener("click", function(e){
        pgm.THPSocket.registerTableOnline();
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
