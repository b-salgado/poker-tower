"use strict"

const TexHoldEvaluate = {

  findTableWinner: function(table){
    let playerEvalList = {};
    this.createPlayerObjects(playerEvalList, table);
    console.log(table.communityCards);
    const FLUSH_IS_POSSIBLE = this.flushPossibility(table.communityCards);
    const STRAIGHT_IS_POSSIBLE = this.straightPossibility(table.communityCards);
    console.log(FLUSH_IS_POSSIBLE, STRAIGHT_IS_POSSIBLE);

    for(var player in playerEvalList){
      let cardPlayer = playerEvalList[player];
      let seven = table.players[player].cardsInHand.concat(table.communityCards);
      this.loadSevenOf14(cardPlayer, seven);

      cardPlayer.winCardArray[1] = this.check4OfKind(cardPlayer.sevenOf14);
      cardPlayer.winCardArray[5] = this.check3OfKind(cardPlayer.sevenOf14);
      cardPlayer.winCardArray[7] = this.checkPair(cardPlayer.sevenOf14);//return highest single pair

      if(cardPlayer.winCardArray[5] && cardPlayer.winCardArray[7]){
        cardPlayer.winCardArray[2] = [cardPlayer.winCardArray[5], cardPlayer.winCardArray[7]];// int 3 of kind and int pair
      }
      else{
        cardPlayer.winCardArray[2] = false;// int 3 of kind and int pair
      }

      if(cardPlayer.winCardArray[7]){
        cardPlayer.winCardArray[6] = this.check2Pair(cardPlayer.sevenOf14);
      }
      else{
        cardPlayer.winCardArray[6] = false;
      }

      console.log(cardPlayer);
    }

  },

  check2Pair: function(sevenOf14){
    let twoPair = [];
    for(var cardValIndex=14; cardValIndex>0; cardValIndex--){
      if(sevenOf14[cardValIndex] === 2 && twoPair.length < 2){
        twoPair.push(cardValIndex);
      }
      if(twoPair.length === 2){
        return twoPair;
      }
    }
    return false;
  },

  checkPair: function(sevenOf14){
    let pairValue = false;
    for(var cardValIndex=0; cardValIndex<15; cardValIndex++){
      if(sevenOf14[cardValIndex] === 2){
        pairValue = cardValIndex;
      }
    }
    return pairValue;
  },

  check3OfKind: function(sevenOf14){
    for(var cardValIndex=0; cardValIndex<15; cardValIndex++){
      if(sevenOf14[cardValIndex] === 3){
        return cardValIndex;
      }
    }
    return false;
  },

  check4OfKind: function(sevenOf14){
    for(var cardValIndex=0; cardValIndex<15; cardValIndex++){
      if(sevenOf14[cardValIndex] === 4){
        return cardValIndex;
      }
    }
    return false;
  },

  createPlayerObjects: function(playerEvalList, table){
    for(var player in table.players){
      let cardPlayer = {
        sevenOf14: [],
        winCardArray: []
      }
      playerEvalList[player] = cardPlayer;
    }
  },

  flushPossibility: function(communityCards){
    let cardSuits = [0,0,0,0];
    for(var card=0; card<communityCards.length; card++){
      cardSuits[communityCards[card].SUIT]++;
      if(cardSuits[communityCards[card].SUIT] > 2){
        return true;
      }
    }
    return false;
  },

  loadSevenOf14: function(player, seven){
    console.log(seven);
    for(var card=0; card<seven.length; card++){
      if( !(player.sevenOf14[seven[card].VALUE] > 0) ){
        player.sevenOf14[seven[card].VALUE] = 1;
      }
      else{
        player.sevenOf14[seven[card].VALUE] ++;
      }
      if(seven[card].VALUE === 14){ player.sevenOf14[1] = true }
    }
  },

  straightPossibility: function(communityCards){
    let fiveOf14 = [];
    for(var card=0; card<communityCards.length; card++){
      fiveOf14[communityCards[card].VALUE] = true;
      if(communityCards[card].VALUE === 14){ fiveOf14[1] = true }
    }

    let searchFor3Truths = 0;

    for(var i=0; i<5; i++){
      if(fiveOf14[i] === true){
        searchFor3Truths++;
        if(searchFor3Truths > 2){
          return true;
        }
      }
    }

    for(var i=5; i<15; i++){
      if(fiveOf14[i] === true){ searchFor3Truths++ }
      if(fiveOf14[i-5] === true){ searchFor3Truths -- }
      if(searchFor3Truths > 2){ return true }
    }

    return false;
  }

}

module.exports = TexHoldEvaluate;
