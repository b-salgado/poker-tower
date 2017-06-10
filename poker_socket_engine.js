var ioPoker = io.of("/poker");
var uuidObj = require("uuid");

var pokerTableList = {};
var cardDeck = createFrenchDeck();
var pokerPlayerList = {};

//setTableState(newTable());

ioPoker.on("connection", function(socket){
	console.log(socket.id + " has connected...");
	ioPoker.to(socket.id).emit("UPDATE_CLIENT_UUID", socket.id);

	for(table in pokerTableList){
		console.log("sent "+ table);
		ioPoker.to(socket.id).emit("SPLASH_SCREEN_TABLE_LIST_ITEM", table);
	}

	socket.on("REGISTER_TABLE", function(){
		var table = newTable(10);
		table.uuid = uuidObj.v4();

		pokerTableList[table.uuid] = table;

		//console.log(pokerTableList);
		ioPoker.emit("SPLASH_SCREEN_TABLE_LIST_ITEM", table.uuid);
	});

	socket.on("JOIN_TABLE", function(playerInfoPack, table_uuid){
			var socket = this;
			joinTable(playerInfoPack, table_uuid, socket);
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
			var betValue = table.lastRaiseAmount;
			table.players[socket.id].is_playing = false;
			checkGameState(table.uuid);
		}
	});


	socket.on("disconnect", function(){
		var table_uuid = pokerPlayerList[socket.id];
		//console.log("pokerlsi "+ pokerPlayerList[socket.id], socket.id);
		if(table_uuid){ //If the player is part of a table
			//console.log(pokerTableList[table_uuid].players[socket.id]);
			socket.to(table_uuid).emit("PLAYER_LEFT", pokerTableList[table_uuid].players[socket.id])

			delete pokerTableList[table_uuid].players[socket.id];

			if(Object.keys(pokerTableList[table_uuid].players).length === 1){
				resetTable(table_uuid);
			}
			if(Object.keys(pokerTableList[table_uuid].players).length === 0){
				delete pokerTableList[table_uuid];
			}

		}
	});

});

function takeAntes(table){
	for(player in table.players){
		var cardPlayer = table.players[player];
		if(cardPlayer.is_playing === true){
			var ante = setPlayerWealth(cardPlayer, -table.ante);
			table.pot += ante;
			sendUpdatePlayerWealth(table, cardPlayer);
		}
	}
	sendUpdateTablePot(table);
}

function sendUpdatePlayerWealth(table, player){
	ioPoker.to(table.uuid).emit("UPDATE_PLAYER_WEALTH", { player:getPlayersAtTable(table.uuid, player.uuid) } );
}

function sendUpdateTablePot(table){
	ioPoker.to(table.uuid).emit("UPDATE_TABLE_POT", table.pot);
}

function checkGameState(table_uuid){
	if(haveAllPlayersBet(table_uuid)){
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

//function sendUpdatePlayerWealth(table_uuid){
//	ioPoker.to(table_uuid).emit("UPDATE_PLAYERS_WEALTH", { players: })
//}

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

function dealFlop(table_uuid){
	var table = pokerTableList[table_uuid];
	for(var i=0; i<3; i++){
		ioPoker.in(table_uuid).emit("COMMUNITY_CARD", table.communityCards[table.numOfComCardsOnTable]);
		table.numOfComCardsOnTable++;
	}
}

function dealRiver(table_uuid){
	var table = pokerTableList[table_uuid];
	ioPoker.in(table_uuid).emit("COMMUNITY_CARD", table.communityCards[table.numOfComCardsOnTable]);
	table.numOfComCardsOnTable++;
}

function dealTurn(table_uuid){
	var table = pokerTableList[table_uuid];
	ioPoker.in(table_uuid).emit("COMMUNITY_CARD", table.communityCards[table.numOfComCardsOnTable]);
	table.numOfComCardsOnTable++;
}

function haveAllPlayersBet(table_uuid){
	var cardPlayer = null;
	var table = pokerTableList[table_uuid];
	for(player in table.players){
		cardPlayer = table.players[player];
		if(cardPlayer.is_playing && !cardPlayer.placed_bet){
			ioPoker.to(cardPlayer.uuid).emit("ALERT_PLAYER_BET");
			table.waitOnBetFrom = cardPlayer.uuid;
			return false;
		}
	}
	return true;
}

function joinTable(playerInfoPack, table_uuid, socket){
	var player = NewPlayer();
	//console.log(socketid+" this");
	setPlayerName(player, playerInfoPack.name);
	setPlayerUuid(player, socket.id);
	setPlayerIcon(player, playerInfoPack.icon);
	setPlayerWealth(player, playerInfoPack.wealth);

	for(table in pokerTableList){
		if(table === table_uuid){
			pokerPlayerList[socket.id] = table_uuid;
			pokerTableList[table].players[socket.id] = player;
			socket.join(table_uuid);
			console.log("Joined " + table);
			console.log(pokerTableList);
			socket.to(table_uuid).emit("PLAYER_JOINED", player);

			var playersAtTable = getPlayersAtTable(table_uuid);
			ioPoker.to(socket.id).emit("JOINED_TABLE", {players: playersAtTable, uuid: table} );

			if(pokerTableList[table_uuid].game_started === false){
				if(Object.keys(pokerTableList[table_uuid].players).length > 1){
					setTableState(pokerTableList[table_uuid]);
					sendPlayersCards(table_uuid);
					checkGameState(table_uuid);
				}
			}
			else if(pokerTableList[table_uuid].game_started === true){
				if(Object.keys(pokerTableList[table_uuid].players).length > 1){
					ioPoker.to(socket.id).emit("CARD_HAND", {clientHand: [], currentHandPlayers: getPlayersAtTable(table_uuid)} );
				}
			}
		}
	}
}


function resetTable(table_uuid){
	var table = pokerTableList[table_uuid];
	table.communityCards = [];
	table.game_started = false;
	table.numOfComCardsOnTable = 0;
	table.lastRaiseAmount = 0;
	table.pot = 0;
	for(player in table.players){
		table.players[player].is_playing = false;
		table.players[player].cardsInHand = [];
	}
	ioPoker.to(table_uuid).emit("RESET_RENDERED_GAME_OBJECTS");
	//console.log( pokerTableList[table_uuid] );
}

function newTable(ante){
	var table = {
		ante: null,
		communityCards: [],
		game_started: false,
		lastRaiseAmount: 0,
		numOfComCardsOnTable: 0,
		players: {}, // total people at table
		pot: 0,
		uuid: null,
		waitOnBetFrom: null,
	}
	table.ante = ante;
	return table;
}

function sendPlayersCards(table_uuid){
	var table = pokerTableList[table_uuid];
	var currentHandPlayers = allPlayingHand(table_uuid);
	for(player in table.players){
		ioPoker.to(player).emit("CARD_HAND", { currentHandPlayers: currentHandPlayers, clientHand: table.players[player].cardsInHand } );
	}
}

function setTableState(table){
	table.game_started = true;

	var drawnCardList = [];
	var card = null;

	console.log(table);

	for(player in table.players){//deal players
		table.players[player].is_playing = true;
		while(table.players[player].cardsInHand.length < 2){
		card = Math.floor( Math.random() * 52 );
		while(drawnCardList[card] === true){
			card = Math.floor( Math.random() * 52 );
		}
		drawnCardList[card] = true;
		table.players[player].cardsInHand.push(cardDeck[card]);
		}
	}

	for(var cards=0; cards<5; cards++){
		card = Math.floor( Math.random() * 52 );
		while(drawnCardList[card] === true){
			card = Math.floor( Math.random() * 52 );
		}
		drawnCardList[card] = true;
		table.communityCards.push(cardDeck[card]);
	}

	takeAntes(table);
	//console.log(drawnCardList);
}

function NewPlayer(name, uuid){
	var player = {
		atTable: null,
		cardsInHand: [],
		wealth: null,
		icon: null,
		is_playing: false,
		name: null,
		placed_bet: false,
		totalBet: 0,
		uuid: null,
	}
	player.name = name || "anonymous";
	player.uuid = uuid;

	return player;
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

function getPlayersAtTable(table_uuid, player_uuid){ //No handInfo
	var table = pokerTableList[table_uuid];
	var requestedPlayers = {};
	if(player_uuid){
		var cardPlayer = Object.assign({}, table.players[player]);
		cardPlayer.cardsInHand = [];
		return cardPlayer;
	}
	else{
		for(player in pokerTableList[table_uuid].players){
			var cardPlayer = Object.assign({}, table.players[player]);
			cardPlayer.cardsInHand = [];
			requestedPlayers[player] = cardPlayer;
		}
		return requestedPlayers;
	}
}



function setPlayerName(player, name){
	player.name = name;
}

function setPlayerUuid(player, uuid){
	player.uuid = uuid;
}

function setPlayerIcon(player, icon){
	player.icon = icon + ".jpg";
}

function setPlayerWealth(player, change){ //Sets a player's wealth. returns the absolute value of player's wealth change. Cannot subtruct more than player's wealth.
	var amountRemovedFromPlayer = null;
	console.log(player.uuid+" this change "+change);
	if(change<0){
		if(player.wealth+change < 0){
			amountRemovedFromPlayer = player.wealth;
			player.wealth = 0;
			return amountRemovedFromPlayer;
		}
		else{
			player.wealth += change;
			return -change;
		}
	}
	else{
		player.wealth+=change;
		return change;
	}
}

function findTable(table_uuid){

}

function createFrenchDeck(options){
	var SUITS = [0,1,2,3] // hearts diamonds clubs spades
	var deckOfCards = [];
	for(var suit=0; suit<SUITS.length; suit++){
		for(var cardValue=0; cardValue<13; cardValue++){//A=2 K=13
			deckOfCards.push( new Card(SUITS[suit], cardValue+2) );
		}
	}
	if(!options === "NO_JOKER"){
		//throw some jokers in deckOfCards
	}
	return deckOfCards;
}

function Card(suit, value){
	this.SUIT = suit;
	this.VALUE = value;
	this.FACE_DOWN = true;
}
