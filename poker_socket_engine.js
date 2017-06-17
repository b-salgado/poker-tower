"use strict"
var ioPoker = io.of("/poker");
var uuidObj = require("uuid");

var event = require("./poker_event_handlers");
var PokerEntities = require("./poker_entities");

var cardDeck = new PokerEntities.CardDeck();
cardDeck.create();

var pokerTableList = {};
var pokerPlayerList = {};

ioPoker.on("connection", function(socket){
  console.log(socket.id + " has connected...");
  ioPoker.to(socket.id).emit("UPDATE_CLIENT_UUID", socket.id);


  for(var table in pokerTableList){
    console.log("sent "+ table);
    ioPoker.to(socket.id).emit("SPLASH_SCREEN_TABLE_LIST_ITEM", table);
  }

  socket.on("REGISTER_TABLE", function(){
      let table = new PokerEntities.Table(10, cardDeck, uuidObj.v4());
      pokerTableList[table.uuid] = table;
      console.log(table);
      ioPoker.emit("SPLASH_SCREEN_TABLE_LIST_ITEM", table.uuid);
  });

  socket.on("JOIN_TABLE", function(playerInfoPack, table_uuid){
    let socket = this;
    let table = pokerTableList[table_uuid];

    let player = new PokerEntities.Player();
    player.setUUID(socket.id);
    player.setName(playerInfoPack.name);
    player.setIcon(playerInfoPack.icon);
    player.setWealth(playerInfoPack.wealth);

    pokerPlayerList[player.uuid] = table;

    table.join(ioPoker, player, socket);

    if(table.numOfPlayers > 1 && !table.game_started){
      table.beginGameRound(ioPoker);
    }
    else if(table.initNumOfPlayers === table.amount && !table.game_started){
      table.beginGameRound(ioPoker);
      table.initNumOfPlayers = -1; //No longer waiting on init
    }
  });

  socket.on("PLAYER_RAISE", function(bet_package){
    var table = pokerTableList[bet_package.table_uuid];
    var betValue = bet_package.betValue;
    if(table.waitOnBetFrom === socket.id && betValue>table.lastRaiseAmount){
      var player = table.players[socket.id];
      console.log(player.uuid+" has risen for $"+betValue);
      if(betValue<0){
        console.log(player.uuid+" is being cheeky. I guess he wants to go all in!"); //A negative value would mean client edited the code
        table.pot += player.wealth;
        table.lastRaiseAmount = player.wealth;
        setPlayerWealth(player, -player.wealth);
      }
      else if( betValue < player.wealth){
        table.pot += betValue;
        table.lastRaiseAmount = betValue;
        setPlayerWealth(player, -betValue);
      }
      else{ //Characters would also mean the client edited the code
        table.pot += player.wealth;
        table.lastRaiseAmount = player.wealth;
        setPlayerWealth(player, -player.wealth);
      }
      setAllPlayersProperty(table, "placed_bet", false);
      player.placed_bet = true;
      sendUpdatePlayerWealth(table, player);
      sendUpdateTablePot(table);
      checkGameState(table.uuid);
    }
  });

  socket.on("PLAYER_CALL", function(bet_package){
    var table = pokerTableList[bet_package.table_uuid];
    if(table.waitOnBetFrom === socket.id){
      var betValue = table.lastRaiseAmount;
      var player = table.players[socket.id];
      console.log("Player has called for $"+betValue);
      if(betValue<0){
        console.log(player.uuid+" is being cheeky. I guess he wants to go all in!"); //A negative value would mean client edited the code
        table.pot += player.wealth;
        table.lastRaiseAmount = player.wealth;
        setPlayerWealth(player, -player.wealth);
      }
      else if( betValue < player.wealth){
        table.pot += betValue;
        table.lastRaiseAmount = betValue;
        setPlayerWealth(player, -betValue);
      }
      else{ //Characters would also mean the client edited the code
        table.pot += player.wealth;
        table.lastRaiseAmount = player.wealth;
        setPlayerWealth(player, -player.wealth);
      }
      player.placed_bet = true;
      sendUpdatePlayerWealth(table, player);
      sendUpdateTablePot(table);
      checkGameState(table.uuid);
    }
  });

  socket.on("PLAYER_FOLD", function(bet_package){
    var table = pokerTableList[bet_package.table_uuid];
    if(table.waitOnBetFrom === socket.id){
      //var betValue = table.lastRaiseAmount;
      table.players[socket.id].is_playing = false;
      checkGameState(table.uuid);
    }
  });

  socket.on("disconnect", function(){
    var table = pokerPlayerList[socket.id];
    if(table){ //If the player is part of a table
      delete pokerPlayerList[socket.id];
      let DESTORY_TABLE = table.leave(ioPoker, socket);
      if(DESTORY_TABLE){ delete pokerTableList[table.uuid] }

    }
  });

});

function checkGameState(table_uuid){
  if(TF_allPlayersBet(table_uuid)){
    var table = pokerTableList[table_uuid];
    table.lastRaiseAmount = 0;
    console.log("All players have bet. . .");
    if(table.numOfComCardsOnTable === 0){
      dealFlop(table_uuid);
      setAllPlayersProperty(table, "placed_bet", false, true);
      checkGameState(table_uuid);
    }
    else if(table.numOfComCardsOnTable === 3){
      dealTurn(table_uuid);
      setAllPlayersProperty(table, "placed_bet", false, true);
      checkGameState(table_uuid);
    }
    else if(table.numOfComCardsOnTable === 4){
      dealRiver(table_uuid);
      setAllPlayersProperty(table, "placed_bet", false, true);
      checkGameState(table_uuid);
    }
    else if(table.numOfComCardsOnTable === 5){
      setAllPlayersProperty(table, "placed_bet", false, true);
      //evaluateWinningHand(table);
      //payoutWinner(table_uuid, player_uuid);
    }
  }
}

function payoutWinner(table_uuid, player_uuid){
  var table = pokerTableList[table_uuid];
  var player = table.players[player_uuid];
  player.wealth += table.pot;
  table.pot = 0;
}

function setAllPlayersProperty(table, property, value, playing_only){
  if(playing_only){
    for(player in table.players){
      if(table.players[player].is_playing === true){
        table.players[player][property] = value;
      }
    }
  }
  else{
    for(player in table.players){
      table.players[player][property] = value;
    }
  }
}

function sendPlayersCards(table_uuid){
  var table = pokerTableList[table_uuid];
  var currentHandPlayers = allPlayingHand(table_uuid);
  for(player in table.players){
    ioPoker.to(player).emit("CARD_HAND", { currentHandPlayers: currentHandPlayers, clientHand: table.players[player].cardsInHand } );
  }
}

function allPlayingHand(table_uuid){// No handInfo
  var table = pokerTableList[table_uuid];
  console.log(table, pokerTableList);
  var allPlayingHand= {};
  for(player in table.players){
    if(table.players[player].is_playing){
      var cardPlayer = Object.assign({}, table.players[player]);
      cardPlayer.cardsInHand = [];
      allPlayingHand[player] = cardPlayer;
    }
  }
  return allPlayingHand;
}
