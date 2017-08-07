/* jshint node: true */
/*global
alert, confirm, console, prompt, define, require, io
*/
"use strict";
const PokerEntities = {

  Card: function(suit, value){
    this.FACE_DOWN = true;
    this.SUIT = suit;
    this.VALUE = value;
  },

  CardDeck: function(){
    this.cards = [];
    this.SUITS = [0,1,2,3]; // hearts diamonds clubs spades
  },

  Player: function(name, uuid){
    this.atTable = null;
    this.cardsInHand = [];
    this.icon = null;
    this.is_playing = false;
    this.name = name || "anonymous";
    this.placed_bet = false;
    this.totalBet = 0;
    this.uuid = uuid;
    this.wealth = null;
  },

  Table: function(ante, cardDeck, uuid){
    this.ante = ante;
    this.betTimerTime = 8000; //miliseconds
    this.cardDeck = cardDeck;
    this.communityCards = [];
    this.evalutator = null;
    this.game_started = false;
    this.game_done = false;
    this.lastRaiseAmount = 0;
    this.name = null;
    this.numOfComCardsOnTable = 0;
    this.numOfPlayers = 0;
    this.initNumOfPlayers = -1; // Not waiting on any players to begin
    this.players = {}; // all player objects at table
    this.pot = 0;
    this.uuid = uuid;
    this.waitOnBetFrom = null;
  }

};

/*=====Player Prototypes======*/
PokerEntities.Player.prototype.payBets = function(amount){
  if(this.wealth-amount < 0){
    let amountPaid = this.wealth;
    this.wealth = 0;
    return amountPaid;
  }else{
    this.wealth -= amount;
    return amount;
  }
};

PokerEntities.Player.prototype.setIcon = function(icon){ this.icon = icon; };
PokerEntities.Player.prototype.setName = function(name){ this.name = name; };
PokerEntities.Player.prototype.setUUID = function(uuid){ this.uuid = uuid; };
PokerEntities.Player.prototype.setWealth = function(amount){ this.wealth = amount; };
PokerEntities.Player.prototype.receivesPayout = function(amount){ this.wealth+=amount; };

/*=======Table Prototypes========*/

PokerEntities.Table.prototype.addPlayer = function(player){
  this.players[player.uuid] = player;
  console.log("numOfPlayers = " + this.numOfPlayers);
  this.numOfPlayers++;
  console.log("numOfPlayers = " + this.numOfPlayers);
};

PokerEntities.Table.prototype.allPlayersBet_TF = function(io){
  var cardPlayer = null;
  for(var player in this.players){
    cardPlayer = this.players[player];
    if(cardPlayer.is_playing && !cardPlayer.placed_bet){
      let is_raise = false;
      console.log(io + " here");
      if(this.lastRaiseAmount > 0){
        is_raise = true;
      }
      io.to(this.uuid).emit("START_BET_TIMER", {player_uuid: cardPlayer.uuid, betTimerTime: this.betTimerTime, is_raise: is_raise} );
      this.waitOnBetFrom = cardPlayer.uuid;
      return false;
    }
  }
  return true;
};

PokerEntities.Table.prototype.beginGameRound = function(io){
  this.game_started = true;
  let drawnCardList = [];

  this.dealPlayers(drawnCardList);
  this.storeCommunityCards(drawnCardList);

  this.collectAntes(io);
  this.sendPlayersCards(io);
  this.checkGameState(io);
};

PokerEntities.Table.prototype.checkGameState = function(io){
  //console.log(this);
  if(this.game_done){
    this.reset(io);
    this.game_done = false;
    this.beginGameRound(io);
  }

  else if(this.game_started && this.numOfPlayers < 2){
    this.setAllPlayersProperty("placed_bet", false, true);
    console.log("numOfPlayers " + this.numOfPlayers);
  //  io.in(this.uuid).emit("GAME_WIN", winnersAndRan);
    this.showDown(io);
    for(var player in this.players){
      if(this.players[player].is_playing === true){
        let winnersAndRank = {winners: [player]};
        this.payoutWinners(io, winnersAndRank); //bug will send to all players. also check if players is all players at table or all playing
      }
    }
    this.pot = 0;
    this.sendUpdateTablePot(io);
  }

  else if(this.allPlayersBet_TF(io)){
    this.lastRaiseAmount = 0;
    console.log("All players have bet. . .");
    if(this.numOfComCardsOnTable === 0){
      this.dealFlop(io);
      this.setAllPlayersProperty("placed_bet", false, true);
      this.checkGameState(io);
    }
    else if(this.numOfComCardsOnTable === 3){
      this.dealTurn(io);
      this.setAllPlayersProperty("placed_bet", false, true);
      this.checkGameState(io);
    }
    else if(this.numOfComCardsOnTable === 4){
      this.dealRiver(io);
      this.setAllPlayersProperty("placed_bet", false, true);
      this.checkGameState(io);
    }
    else if(this.numOfComCardsOnTable === 5){
      this.setAllPlayersProperty("placed_bet", false, true);
      let winnersAndRank = this.evaluator.findTableWinner(this);
      console.log(winnersAndRank);
      io.in(this.uuid).emit("GAME_WIN", winnersAndRank);
      this.showDown(io);
      this.payoutWinners(io, winnersAndRank);
      this.pot = 0;
      this.sendUpdateTablePot(io);
      this.game_done = true;
    }
  }
};

PokerEntities.Table.prototype.showDown = function(io){
  const no_wash = true;
  let currentHandPlayers = this.allPlayingHand(no_wash);
  io.to(this.uuid).emit("SHOW_DOWN", currentHandPlayers );
};

PokerEntities.Table.prototype.payoutWinners = function(io, winnersAndRank){
  const payout = Math.floor(this.pot / winnersAndRank.winners.length);// House takes the change
  for(var i=0; i<winnersAndRank.winners.length; i++){
    var player = this.players[winnersAndRank.winners[i]];
    player.receivesPayout(payout);
    this.sendUpdatePlayerWealth(io, player);
  }
};

PokerEntities.Table.prototype.collectAntes = function(io){
  var cardPlayer = null;
  var ante = null;
  for(var player in this.players){
    cardPlayer = this.players[player];
    if(cardPlayer.is_playing === true){
      ante = cardPlayer.payBets(this.ante);
      this.pot += ante;
      io.to(this.uuid).emit("UPDATE_PLAYER_WEALTH", { player:this.washHand(cardPlayer) } );
    }
  }
  io.to(this.uuid).emit("UPDATE_TABLE_POT", this.pot);
};

PokerEntities.Table.prototype.dealFlop = function(io){
  for(var i = 0; i < 3; i++){
    io.in(this.uuid).emit("COMMUNITY_CARD", this.communityCards[this.numOfComCardsOnTable]);
    this.numOfComCardsOnTable++;
  }
};

PokerEntities.Table.prototype.dealPlayers = function(drawnCardList){
  let card = null;
  let cardPlayer = null;
  for(var player in this.players){//deal players
    cardPlayer = this.players[player];
    cardPlayer.is_playing = true;
    while(cardPlayer.cardsInHand.length < 2){
      card = Math.floor( Math.random() * 52 );
      while(drawnCardList[card] === true){
        card = Math.floor( Math.random() * 52 );
      }
      drawnCardList[card] = true;
      this.players[player].cardsInHand.push(this.cardDeck.cards[card]);
    }
  }
};

PokerEntities.Table.prototype.dealRiver = function(io){
  io.in(this.uuid).emit("COMMUNITY_CARD", this.communityCards[this.numOfComCardsOnTable]);
  this.numOfComCardsOnTable++;
};

PokerEntities.Table.prototype.dealTurn = function(io){
  io.in(this.uuid).emit("COMMUNITY_CARD", this.communityCards[this.numOfComCardsOnTable]);
  this.numOfComCardsOnTable++;
};

PokerEntities.Table.prototype.getPlayers = function(player_uuid){ //No handInfo
  var requestedPlayers = {};
  //console.log(this);
  if(player_uuid){
    let cardPlayer = Object.assign({}, this.players[player_uuid]);
    cardPlayer.cardsInHand = [];
    return cardPlayer;
  }
  else{
    for(var player in this.players){
      let cardPlayer = Object.assign({}, this.players[player]);
      cardPlayer.cardsInHand = [];
      requestedPlayers[player] = cardPlayer;
    }
    return requestedPlayers;
  }
};

PokerEntities.Table.prototype.setAllPlayersProperty = function(property, value, playing_only){
  if(playing_only){
    for(var player in this.players){
      if(this.players[player].is_playing === true){
        this.players[player][property] = value;
      }
    }
  }
  else{
    for(var player in this.players){
      this.players[player][property] = value;
    }
  }
};

PokerEntities.Table.prototype.join = function(io, player, socket){
  const self = this;

  socket.join(this.uuid);
  this.addPlayer(player);

  console.log(socket.id + " joined table " + this.uuid);

  socket.to(this.uuid).emit("PLAYER_JOINED", player);

  io.to(socket.id).emit("JOINED_TABLE", { players:self.getPlayers(), uuid: self.uuid });
};

PokerEntities.Table.prototype.leave = function(io, socket){
  socket.to(this.uuid).emit("PLAYER_LEFT", this.players[socket.id]);
  delete this.players[socket.id];
  this.numOfPlayers--;
  if(this.numOfPlayers === 1){
    for(const player in this.players){
      console.log(this.ante + " here");
      this.players[player].receivesPayout(this.pot);
      this.pot = 0;
      this.sendUpdateTablePot(io);
      this.sendUpdatePlayerWealth(io, this.players[player]);
    }
    this.reset(io);
    return false;
  }
  if(this.numOfPlayers === 0){
    return true;
  }
};

PokerEntities.Table.prototype.reset = function(io){
  this.communityCards = [];
  this.game_started = false;
  this.numOfComCardsOnTable = 0;
  this.numOfPlayers = this.numOfPlayers;
  this.lastRaiseAmount = 0;
  this.pot = 0;
  for(var player in this.players){
    this.players[player].is_playing = false;
    this.players[player].cardsInHand = [];
  }
  io.to(this.uuid).emit("RESET_RENDERED_GAME_OBJECTS");
};

PokerEntities.Table.prototype.storeCommunityCards = function(drawnCardList){
  var card = null;
  for(var cards=0; cards<5; cards++){
    card = Math.floor( Math.random() * 52 );
    while(drawnCardList[card] === true){
      card = Math.floor( Math.random() * 52 );
    }
    drawnCardList[card] = true;
    this.communityCards.push(this.cardDeck.cards[card]);
  }
};

PokerEntities.Table.prototype.sendPlayersCards = function(io){
  let currentHandPlayers = this.allPlayingHand();
  for(var player in this.players){
    io.to(player).emit("CARD_HAND", { currentHandPlayers: currentHandPlayers, clientHand: this.players[player].cardsInHand } );
  }
};

PokerEntities.Table.prototype.sendUpdatePlayerWealth = function(io, player){
  io.to(this.uuid).emit("UPDATE_PLAYER_WEALTH", { player:this.washHand(player) } );
};

PokerEntities.Table.prototype.sendUpdateTablePot = function(io){
  io.to(this.uuid).emit("UPDATE_TABLE_POT", this.pot);
};

PokerEntities.Table.prototype.allPlayingHand = function(no_wash){// No handInfo
  var allPlayingHand = {};
  if(no_wash){
    for(var player in this.players){
      if(this.players[player].is_playing){
        allPlayingHand[player] = this.players[player];
      }
    }
  }
  else{
    for(var player in this.players){
      if(this.players[player].is_playing){
        allPlayingHand[player] = this.washHand(this.players[player]);
      }
    }
  }
  return allPlayingHand;
};

PokerEntities.Table.prototype.washHand = function(player){
  let cardPlayer = Object.assign({}, player);
  cardPlayer.cardsInHand = [];
  return cardPlayer;
};

/*=========Card Prototypes========*/
PokerEntities.CardDeck.prototype.create = function(){
  for(var suit=0; suit<this.SUITS.length; suit++){
    for(var cardValue=0; cardValue<13; cardValue++){//A=2 K=13
      this.cards.push( new PokerEntities.Card(this.SUITS[suit], cardValue+2) );
    }
  }
};

module.exports = PokerEntities;
