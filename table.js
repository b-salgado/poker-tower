define(function(){
  return{

    players: [], //make private
    ENABLE_NETWORKING: false,
    addPlayers: function(playersArray){
      this.players = this.players.concat(playersArray);
    }

    enableNetworking: function(){
      this.ENABLE_NETWORKING = true;
      
    }

  }
})
