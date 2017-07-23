/* jshint node: true */
/*jshint -W018 */
/*global
alert, confirm, console, prompt, define, require, io
*/
"use strict";

const TexHoldEvaluate = {

  findTableWinner: function(table){
    let playerEvalList = {};
    let rankings = [];
    const FLUSH_IS_POSSIBLE = this.flushPossibility(table.communityCards);
    const STRAIGHT_IS_POSSIBLE = this.straightPossibility(table.communityCards);

    const t0 = Date.now();

    this.createPlayerObjects(playerEvalList, table);


    for(var player in playerEvalList){
      let cardPlayer = playerEvalList[player];
      let seven = table.players[player].cardsInHand.concat(table.communityCards);
      this.loadSevenOf14(cardPlayer, seven);

      console.log(cardPlayer.sevenOf14.length);
      cardPlayer.winCardArray[1] = this.check4OfKind(cardPlayer.sevenOf14);
      cardPlayer.winCardArray[5] = this.check3OfKind(cardPlayer.sevenOf14);
      cardPlayer.winCardArray[7] = this.checkPair(cardPlayer.sevenOf14);//return highest single pair

      if(cardPlayer.winCardArray[5] && cardPlayer.winCardArray[7]){
        cardPlayer.winCardArray[2] = cardPlayer.winCardArray[5] + cardPlayer.winCardArray[7];// int 3 of kind and int pai
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

      cardPlayer.winCardArray[8] = this.checkHighCard(cardPlayer.sevenOf14);

      if(FLUSH_IS_POSSIBLE){
        cardPlayer.winCardArray[3] = this.checkFlush(seven);
      }
      else{
        cardPlayer.winCardArray[3] = false;
      }
      if(STRAIGHT_IS_POSSIBLE){
        cardPlayer.winCardArray[4] = this.checkStraight(cardPlayer.sevenOf14);
      }
      else{
        cardPlayer.winCardArray[4] = false;
      }

      if(cardPlayer.winCardArray[3] && cardPlayer.winCardArray[4]){
        cardPlayer.winCardArray[0] = this.checkStraightFlush(seven);
      }
      else{
        console.log(STRAIGHT_IS_POSSIBLE, FLUSH_IS_POSSIBLE);
        cardPlayer.winCardArray[0] = false;
      }

      //console.log(cardPlayer);
    }

    console.log(Date.now() - t0);

    const winnersAndRank = this.comparePlayerHands(playerEvalList);
    return winnersAndRank; //contains winners and rank of win


  },

  checkKickers: function(sevenOf14, numOfKickers){
    let totalKickerValue = 0;
    for(var i = 14; i > 1; i--){
      if(sevenOf14[i] === 1){
        numOfKickers--;
        totalKickerValue += i;
        if(numOfKickers === 0){
          return totalKickerValue;
        }
      }
    }
  },

  comparePlayerHands: function(playerEvalList){//returns winning id or an array of winning ids the case of a tie
    let scoreCard = [];
    for(var winRank = 0; winRank < 9; winRank++){
      var playersInRank = [];
      for(var player in playerEvalList){
        var cardPlayer = playerEvalList[player];
        if(cardPlayer.winCardArray[winRank]){
          playersInRank.push(cardPlayer);
        }
      }
      if(playersInRank.length === 1){
        const winnersAndRank = {winners: [playersInRank[0].uuid], winRank: winRank}; //winnerAndRank
        return winnersAndRank;
      }
      else if(playersInRank.length > 1){
        const winnersAndRank = {winners: this.determineIfTie(playersInRank, winRank), winRank: winRank};
        return winnersAndRank;
      }
    }
  },

  determineIfTie: function(playersInRank, winRank){//returns winning id or an array of winning ids the case of a tie
    let winners = [];
    let winnersUUID = [];
    let i = 0;

    if(winRank === 7){//binary checks
      for(i = 0; i < playersInRank.length; i++){
        playersInRank[i].winCardArray[winRank] += this.checkKickers(playersInRank[i].sevenOf14, 3);
      }
    }
    else if(winRank === 6){//binary checks
      for(i = 0; i < playersInRank.length; i++){
        playersInRank[i].winCardArray[winRank] += this.checkKickers(playersInRank[i].sevenOf14, 1);
      }
    }

    winners[0] = playersInRank[0];

    for(i = 1; i < playersInRank.length; i++){
      if(winners[0].winCardArray[winRank] < playersInRank[i].winCardArray[winRank]){
        winners[0] = playersInRank[i];
      }
      else if(winners[0].winCardArray[winRank] === playersInRank[i].winCardArray[winRank]){
        winners.push(playersInRank[i]);
      }
    }

    for(i = 0; i < winners.length; i++){
      winnersUUID.push(winners[i].uuid);
    }

    //console.log(winners);
    return winnersUUID;
  },

  checkStraightFlush: function(seven){
    let flushList = [ {a:0,h:0},  {a:0,h:0}, {a:0,h:0}, {a:0,h:0}, ];//a = amount h= highest card value
    let flushSuit = null;
    let sevenOf14 = [];
    let searchFor5Truths = 0;
    let i = 0;

    for(i = 0; i <7 ; i++){
      flushList[seven[i].SUIT].a++;
    }
    for(var suit=0; suit<flushList.length; suit++){
      if(flushList[seven[i].SUIT].a > 5){
        flushSuit = seven[i].SUIT;
      }
    }

    for(i = 0; i < 7; i++){
      if(seven[i].SUIT === flushSuit){
        sevenOf14[seven[i].VALUE] = true;
        if(seven[i].VALUE === 14){
          sevenOf14[1] = true;
        }
      }
    }
    return this.checkStraight(sevenOf14);
  },

  checkFlush: function(seven){
    let flushList = [ {a:0, h:0},  {a:0, h:0}, {a:0, h:0}, {a:0, h:0}, ];//a = amount h= highest card value
    for(var i = 0; i < 7; i++){
      flushList[seven[i].SUIT].a++;
      if(flushList[seven[i].SUIT].h < seven[i].VALUE){
        //console.log(seven[i].VALUE);
        flushList[seven[i].SUIT].h = seven[i].VALUE;
      }
    }
    for(var suit=0; suit<flushList.length; suit++){
      if(flushList[suit].a > 4){
        return flushList[suit].h;
      }
    }
    return false;
  },

  checkStraight: function(sevenOf14){
    let searchFor5Truths = 0;
    let cardValIndex = 0;

    for(cardValIndex = 14; cardValIndex > 9; cardValIndex--){
      if(sevenOf14[cardValIndex] == true){
        //console.log("herer "  +searchFor5Truths);
        searchFor5Truths++;
        if(searchFor5Truths === 5){
          //console.log("sending "+cardValIndex+4);
          return cardValIndex + 4;
        }
      }
    }

    for(cardValIndex = 9; cardValIndex > 0; cardValIndex--){
      if(sevenOf14[cardValIndex] == true){ searchFor5Truths++; }
      if(sevenOf14[cardValIndex+5] == true){ searchFor5Truths--; }
      if(searchFor5Truths === 5 ){ return cardValIndex + 4; }
    }
    return false;
  },

  checkHighCard: function(sevenOf14){
    let cardsChecked = 0;
    let totalCardValue = 0;
    for(var i=14; i>1; i--){//Don't count low ace
      if(sevenOf14[i] == true){
        //console.log(totalCardValue);
        cardsChecked++;
        totalCardValue += i;
        if(cardsChecked === 5){
          return totalCardValue;
        }
      }
    }
  },

  check2Pair: function(sevenOf14){
    let twoPair = [];
    for(var cardValIndex=14; cardValIndex>0; cardValIndex--){
      if(sevenOf14[cardValIndex] === 2 && twoPair.length < 2){
        twoPair.push(cardValIndex);
      }
      if(twoPair.length === 2){
        return twoPair[0] + twoPair[1];
      }
    }
    return false;
  },

  checkPair: function(sevenOf14){
    let pairValue = false;
    for(var cardValIndex = 0; cardValIndex < 15; cardValIndex++){
      if(sevenOf14[cardValIndex] === 2){
        pairValue = cardValIndex;
      }
    }
    return pairValue;
  },

  check3OfKind: function(sevenOf14){
    for(var cardValIndex = 0; cardValIndex < 15; cardValIndex++){
      if(sevenOf14[cardValIndex] === 3){
        return cardValIndex;
      }
    }
    return false;
  },

  check4OfKind: function(sevenOf14){
    for(var cardValIndex = 0; cardValIndex < 15; cardValIndex++){
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
        uuid: player,
        winCardArray: []
      };
      playerEvalList[player] = cardPlayer;
    }
  },

  flushPossibility: function(communityCards){
    let cardSuits = [0,0,0,0];
    for(var card = 0; card < communityCards.length; card++){
      cardSuits[communityCards[card].SUIT]++;
      if(cardSuits[communityCards[card].SUIT] > 2){
        return true;
      }
    }
    return false;
  },

  loadSevenOf14: function(player, seven){
    for(var card = 0; card < seven.length; card++){
      if( !(player.sevenOf14[seven[card].VALUE] > 0) ){
        player.sevenOf14[seven[card].VALUE] = 1;
      }
      else{
        player.sevenOf14[seven[card].VALUE] ++;
      }
      if(seven[card].VALUE === 14){ player.sevenOf14[1] = true; }
    }
  },

  straightPossibility: function(communityCards){
    let fiveOf14 = [];
    let cardValIndex = 0;

    for(var card = 0; card < communityCards.length; card++){
      fiveOf14[communityCards[card].VALUE] = true;
      if(communityCards[card].VALUE === 14){
        fiveOf14[1] = true;
      }
    }

    let searchFor3Truths = 0;

    for(cardValIndex = 0; cardValIndex < 5; cardValIndex++){
      if(fiveOf14[cardValIndex] === true){
        searchFor3Truths++;
        if(searchFor3Truths === 3){
          return true;
        }
      }
    }

    for(cardValIndex = 5; cardValIndex < 15; cardValIndex++){
      if(fiveOf14[cardValIndex] === true){ searchFor3Truths++; }
      if(fiveOf14[cardValIndex-5] === true){ searchFor3Truths--; }
      if(searchFor3Truths === 3){ return true; }
    }

    return false;
  }

};

module.exports = TexHoldEvaluate;
