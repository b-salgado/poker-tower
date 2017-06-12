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
