"use strict"
const PokerEntities = {

  Card: function(suit, value){
    this.FACE_DOWN = true;
    this.SUIT = suit;
    this.VALUE = value;
  },

  CardDeck: function(){
    this.cards = [];
    this.SUITS = [0,1,2,3] // hearts diamonds clubs spades
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

  Table: function(ante, uuid){
    this.ante = ante;
    this.communityCards = [];
  	this.game_started = false;
  	this.lastRaiseAmount = 0;
  	this.numOfComCardsOnTable = 0;
  	this.players = {}, // total people at table
  	this.pot = 0;
  	this.uuid = uuid;
  	this.waitOnBetFrom = null;
  }

}

/*=====Player Prototypes======*/
console.log(PokerEntities);
PokerEntities.Player.prototype.payBets = function(amount){
  if(this.wealth-amount < 0){
    let amountPaid = this.wealth;
    return amountPaid;
  }else{
    this.wealth = 0;
    this.wealth -= amount;
    return amount;
  }
}
PokerEntities.Player.prototype.setIcon = function(icon){this.icon = icon};
PokerEntities.Player.prototype.setName = function(name){this.name = name};
PokerEntities.Player.prototype.setUUID = function(uuid){this.uuid = uuid};
PokerEntities.Player.prototype.setWealth = function(amount){this.wealth = amount};
PokerEntities.Player.prototype.receivesPayout = function(amount){this.weath+=amount};

/*=======Table Prototypes========*/
PokerEntities.Table.prototype.reset = function(io){
	this.communityCards = [];
	this.game_started = false;
	this.numOfComCardsOnTable = 0;
	this.lastRaiseAmount = 0;
	this.pot = 0;
	for(var player in this.players){
		this.players[player].is_playing = false;
		this.players[player].cardsInHand = [];
	}
	io.to(this.uuid).emit("RESET_RENDERED_GAME_OBJECTS");
}

PokerEntities.Table.prototype.addPlayer = function(player){
  console.log(player);
  this.players[player.uuid] = player;
}

PokerEntities.Table.prototype.collectAntes = function(io){
	for(player in this.players){
		const cardPlayer = this.players[player];
		if(cardPlayer.is_playing === true){
			const ante = cardPlayer.payBets(this.ante);
			this.pot += ante;
			io.to(this.uuid).emit("UPDATE_PLAYER_WEALTH", { player:player } );
		}
	}
	io.to(table.uuid).emit("UPDATE_TABLE_POT", this.pot);
}

PokerEntities.Table.prototype.dealFlop = function(io){
  for(var i=0; i<3; i++){
    io.in(this.uuid).emit("COMMUNITY_CARD", this.communityCards[this.numOfComCardsOnTable]);
    this.numOfComCardsOnTable++;
  }
}

PokerEntities.Table.prototype.dealRiver = function(io){
  io.in(table_uuid).emit("COMMUNITY_CARD", this.communityCards[this.numOfComCardsOnTable]);
  this.numOfComCardsOnTable++;
}

PokerEntities.Table.prototype.dealTurn = function(io){
  io.in(table_uuid).emit("COMMUNITY_CARD", this.communityCards[this.numOfComCardsOnTable]);
  this.numOfComCardsOnTable++;
}

PokerEntities.Table.prototype.getPlayersAtTable = function(player_uuid){ //No handInfo
	var requestedPlayers = {};
  console.log(this);
	if(player_uuid){
		let cardPlayer = Object.assign({}, this.players[player]);
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
}

PokerEntities.Table.prototype.join = function(io, player, socket){
  let self = this;

  socket.join(this.uuid);
  this.addPlayer(player);

  console.log(socket.id + " joined table " + this.uuid);

  socket.to(this.uuid).emit("PLAYER_JOINED", player);

  io.to(socket.id).emit("JOINED_TABLE", { players:self.getPlayersAtTable(), uuid: self.uuid });
  console.log(self.getPlayersAtTable, self.uuid);
}

PokerEntities.Table.prototype.haveAllPlayersBet = function(io){
  let cardPlayer = null;
	for(var player in this.players){
		cardPlayer = this.players[player];
		if(cardPlayer.is_playing && !cardPlayer.placed_bet){
			io.to(cardPlayer.uuid).emit("ALERT_PLAYER_BET");
			this.waitOnBetFrom = cardPlayer.uuid;
			return false;
		}
	}
	return true;
}

/*=========Card Prototypes========*/
PokerEntities.CardDeck.prototype.create = function(){
  for(var suit=0; suit<this.SUITS.length; suit++){
    for(var cardValue=0; cardValue<13; cardValue++){//A=2 K=13
      this.cards.push( new PokerEntities.Card(this.SUITS[suit], cardValue+2) );
    }
  }
}

module.exports = PokerEntities;
