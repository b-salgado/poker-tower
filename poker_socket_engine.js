/* jshint node: true */
/*global
alert, confirm, console, prompt, define, require, io
*/

"use strict";

const ioPoker = io.of("/poker");
const uuidObj = require("uuid");

const event = require("./poker_event_handlers");
const TexHoldEvaluate = require("./poker_hand_evaluator.js");
const PokerEntities = require("./poker_entities");

const cardDeck = new PokerEntities.CardDeck();
cardDeck.create();

let pokerTableList = {};
let pokerPlayerList = {};

//==================Testing Area
/*
let table0 = new PokerEntities.Table(10, cardDeck, uuidObj.v4());
let player0 = {uuid: 9283, cardsInHand: [ {SUIT:0, VALUE:10 }, {SUIT:3, VALUE: 8} ]};
let player1 = {uuid: 92223, cardsInHand: [ {SUIT:3, VALUE:110 }, {SUIT:1, VALUE: 10} ]};
table0.communityCards = [ {SUIT:0, VALUE:2 }, {SUIT:1, VALUE: 11}, {SUIT:2, VALUE:12 }, {SUIT:3, VALUE:13 },{SUIT:2, VALUE:14 } ];
table0.players[player0.uuid] = player0;
table0.players[player1.uuid] = player1;
let winner = TexHoldEvaluate.findTableWinner(table0);
console.log("\nWinner is: ");
console.log(winner);
*/
//Testing Area^^^^^^^^^^^^^^^^^

ioPoker.on("connection", function(socket){
  console.log(socket.id + " has connected...");
  ioPoker.to(socket.id).emit("UPDATE_CLIENT_UUID", socket.id);


  for(var table_uuid in pokerTableList){
    const table = pokerTableList[table_uuid];
    sendUpdateTableList(table);
  }

  socket.on("REGISTER_TABLE", function(tablePkg){
    console.log(tablePkg);
    let table = new PokerEntities.Table(tablePkg.ante, cardDeck, uuidObj.v4());
    table.name = tablePkg.name;
    table.evaluator = TexHoldEvaluate;
    pokerTableList[table.uuid] = table;
    sendUpdateTableList(table);
  });

  socket.on("JOIN_TABLE", function(playerInfoPack, table_uuid){
    const socket = this;
    let table = pokerTableList[table_uuid];

    let player = new PokerEntities.Player();
    player.setUUID(socket.id);
    player.setName(playerInfoPack.name);
    player.setIcon(playerInfoPack.icon);
    player.setWealth(playerInfoPack.wealth);

    pokerPlayerList[player.uuid] = table;

    table.join(ioPoker, player, socket);

    if(table.numPlayersAtTable > 1 && !table.game_started){
      table.beginGameRound(ioPoker);
    }
    else if(table.initNumOfPlayers === table.amount && !table.game_started){
      table.beginGameRound(ioPoker);
      table.initNumOfPlayers = -1; //No longer waiting on init
    }
  });

  socket.on("PLAYER_CALL", function(bet_package){
    const table = pokerTableList[bet_package.table_uuid];
    if(table.waitOnBetFrom === socket.id){
      let betValue = table.lastRaiseAmount;
      const player = table.players[socket.id];
      if(betValue < player.wealth){
        table.pot += betValue;
        table.lastRaiseAmount = betValue;
        player.payBets(betValue);
      }
      else{ //Characters would also mean the client edited the code
        table.pot += player.wealth;
        table.lastRaiseAmount = player.wealth;
        player.setWealth(0);
      }
      player.placed_bet = true;
      sendUpdatePlayerWealth(table, player);
      sendUpdateTablePot(table);

      console.log(socket.id + " has called for $" + betValue);
      table.checkGameState(ioPoker);
    }
  });

  socket.on("PLAYER_FOLD", function(bet_package){
    var table = pokerTableList[bet_package.table_uuid];
    if(table.waitOnBetFrom === socket.id){
      //var betValue = table.lastRaiseAmount;
      table.players[socket.id].is_playing = false;
      table.numPlayersPlayingHand--;

      console.log(socket.id + " has folded. " + table.numPlayersPlayingHand + " now playing.");

      table.checkGameState(ioPoker);
    }
  });

  socket.on("PLAYER_RAISE", function(bet_package){
    const table = pokerTableList[bet_package.table_uuid];
    let betValue = bet_package.betValue + table.lastRaiseAmount;
    let amountPlayerPaid = 0;
    if(table.waitOnBetFrom === socket.id){
      let player = table.players[socket.id];
      if(betValue < player.wealth){
        table.pot += betValue;
        table.lastRaiseAmount = betValue;
        amountPlayerPaid = betValue;
        player.payBets(betValue);
      }
      else{ //Characters would also mean the client edited the code
        table.pot += player.wealth;
        table.lastRaiseAmount = player.wealth;
        amountPlayerPaid = player.wealth;
        player.payBets(player.wealth);
      }
      const message = player.name + " raised " + amountPlayerPaid;
      ioPoker.to(table.uuid).emit("TABLE_ANNOUNCEMENT", message);
      table.setAllPlayersProperty("placed_bet", false, true);
      player.placed_bet = true;
      table.sendUpdatePlayerWealth(ioPoker, player);
      table.sendUpdateTablePot(ioPoker);
      table.checkGameState(ioPoker);
    }
  });

  socket.on("START_GAME", function(){
    const table = pokerPlayerList[socket.id];
    if(table.game_done === true){
      table.beginGameRound(ioPoker);
    }
  });

  socket.on("disconnect", function(){
    var table = pokerPlayerList[socket.id];
    if(table){ //If the player is part of a table
      delete pokerPlayerList[socket.id];
      let DESTORY_TABLE = table.leave(ioPoker, socket);
      if(DESTORY_TABLE){ delete pokerTableList[table.uuid]; }
    }
  });

});


function sendUpdatePlayerWealth(table, player){
  ioPoker.to(table.uuid).emit("UPDATE_PLAYER_WEALTH", { player:player } );
}

function sendUpdateTableList(table){
  const tablePkg = {
    ante: table.ante,
    name: table.name,
    uuid: table.uuid,
  };
  ioPoker.emit("SPLASH_SCREEN_TABLE_LIST_ITEM", tablePkg);
}

function sendUpdateTablePot(table){
  ioPoker.to(table.uuid).emit("UPDATE_TABLE_POT", table.pot);
}

function payoutWinner(table_uuid, player_uuid){
  var table = pokerTableList[table_uuid];
  var player = table.players[player_uuid];
  player.wealth += table.pot;
  table.pot = 0;
}
