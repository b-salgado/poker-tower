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
		var table = newTable();
		table.uuid = uuidObj.v4();

		pokerTableList[table.uuid] = table;

		console.log(pokerTableList);
		ioPoker.emit("SPLASH_SCREEN_TABLE_LIST_ITEM", table.uuid);
	});

	socket.on("JOIN_TABLE", function(playerInfoPack, table_uuid){
			var socket = this;
			joinTable(playerInfoPack, table_uuid, socket);
	});


	socket.on("disconnect", function(){
		var table_uuid = pokerPlayerList[socket.id];
		//console.log("pokerlsi "+ pokerPlayerList[socket.id], socket.id);
		if(table_uuid){ //If the player is part of a table
			console.log(pokerTableList[table_uuid].players[socket.id]);
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

function checkGameState(){
	if(haveAllPlayersBet()){

	}
}

function haveAllPlayersBet(){
	var cardPlayer = null;
	for(player in pokerTableList.players){
		cardPlayer = pokerTableList.players[player];
		if(player.is_playing && !player.placed_bet){
			ioPoker.to(player.uuid).emit("PLACE_BET");
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

	for(table in pokerTableList){
		if(table === table_uuid){
			pokerPlayerList[socket.id] = table_uuid;
			pokerTableList[table].players[socket.id] = player;
			socket.join(table_uuid);
			console.log("Joined " + table);
			console.log(pokerTableList);
			socket.to(table_uuid).emit("PLAYER_JOINED", player);

			var playersAtTable = allPlayersAtTable(table_uuid);
			ioPoker.to(socket.id).emit("JOINED_TABLE", {players: playersAtTable, uuid: table} );

			if(pokerTableList[table_uuid].game_started === false){
				if(Object.keys(pokerTableList[table_uuid].players).length > 1){
					setTableState(pokerTableList[table_uuid]);
					sendPlayersCards(table_uuid);
				}
			}
			else if(pokerTableList[table_uuid].game_started === true){
				if(Object.keys(pokerTableList[table_uuid].players).length > 1){
					ioPoker.to(socket.id).emit("CARD_HAND", {clientHand: [], currentHandPlayers: allPlayersAtTable(table_uuid)} );
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

	for(player in table.players){
		table.players[player].is_playing = false;
		table.players[player].cardsInHand = [];
	}

	console.log( pokerTableList[table_uuid] );
}

function newTable(){
	return{
		communityCards: [],
		game_started: false,
		numOfComCardsOnTable: 0,
		players: {}, // total people at table
		uuid: null,
	}
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

	console.log(drawnCardList);
}

function NewPlayer(name, uuid){
	var player = {
		atTable: null,
		cardsInHand: [],
		currency: null,
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

function allPlayersAtTable(table_uuid){ //No handInfo
	var table = pokerTableList[table_uuid];
	var allPlayersAtTable = {};
	for(player in pokerTableList[table_uuid].players){
		var cardPlayer = Object.assign({}, table.players[player]);
		cardPlayer.cardsInHand = [];
		allPlayersAtTable[player] = cardPlayer;
	}
	return allPlayersAtTable;
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
