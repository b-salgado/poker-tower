 define(["PlayingCardsSocketEngine"], function(PlayingCardsSocketEngine){
  return{

    Card: function(suit, value){
      this.SUIT = suit;
      this.VALUE = value;
      this.FACE_DOWN = true;
    },

    Table: function(GAME_TYPE){
      this.players = {}; //make private
      this.host = null;
      this.networking = null;
      this.UUID = null;
      this.NETWORKING_ENABLED = false;
      this.GAME_TYPE = GAME_TYPE || "DEFAULT";

      this.addPlayers = function(playersArray){
        //this.players = this.players.concat(playersArray);
        for(var player=0; player<playersArray.length; player++){
          this.players[playersArray[player].UUID] = playersArray[player];
        }
      }
    },

    Player: function(name, uuid){
      this.name = name || "unknown";
      this.IS_HOST = null;
      this.hand = null;
      this.UUID = PlayingCardsSocketEngine.assignPlayerUUID(PlayingCardsSocketEngine.socket, this); //temporary ID replaced by UUID

      /* constructor experiment
      (function(outer){
      console.log("test", outer.hand);
      outer.hand = "ham"}
    )(this) */
    },

    CardDeck: function(){
      this.cards = [];

      this.shuffle = function(timesToShuffle){
        var timesToShuffle = timesToShuffle || 1;
        for(var timesShuffled=0; timesShuffled<timesToShuffle; timesShuffled++){
          if(this.cards.length > 0){
            var newlyOrderedDeck = [];
            var cutLocation = Math.floor(Math.random() * (30-22+1)) + 22;
            var partDeck0 = this.cards.slice(0,cutLocation);
            var partDeck1 = this.cards.slice(cutLocation);
            var shuffleCounter = 1;
            while(!(shuffleCounter>partDeck0.length || shuffleCounter>partDeck1.length)){
              if(Math.random()<0.5){
                newlyOrderedDeck.push(partDeck0[partDeck0.length-(shuffleCounter)]);
                newlyOrderedDeck.push(partDeck1[partDeck1.length-(shuffleCounter)]);
              }
              else{
                newlyOrderedDeck.push(partDeck1[partDeck1.length-(shuffleCounter)]);
                newlyOrderedDeck.push(partDeck0[partDeck0.length-(shuffleCounter)]);
              }
              shuffleCounter++;
            }
            if(shuffleCounter>partDeck0.length){
              while(!(shuffleCounter>partDeck1.length)){
                newlyOrderedDeck.push(partDeck1[partDeck1.length-shuffleCounter]);
                shuffleCounter++;
              }
            }
            else{
              while(!(shuffleCounter>partDeck0.length)){
                newlyOrderedDeck.push(partDeck0[partDeck0.length-shuffleCounter]);
                shuffleCounter++;
              }
            }
            this.cards = newlyOrderedDeck;
          }
          else{
            console.log("Error: Cannot Shuffle Card Deck of Length: "+this.cards.length);
          }
        }
        console.log("Cards Shuffled "+timesToShuffle+" Time(s)");
      }

      this.mix = function(timesToMix){
        var timesToMix = timesToMix || 1;
        if(this.cards.length > 0){
          for(var timesMixed=0; timesMixed<timesToMix; timesMixed++){
            var newlyOrderedDeck = [];
            var cutLocation = Math.floor(Math.random()*(50-2)) + 2;
            newlyOrderedDeck = this.cards.slice(cutLocation);
            this.cards = newlyOrderedDeck.concat(this.cards.slice(0, cutLocation));
          }
          console.log("Cards Mixed "+timesToMix+" Time(s)");
        }
        else{
          console.log("Error: Cannot Mix Card Deck of Length: "+this.cards.length);
        }
      }

    },

    checkCards: function(cardDeck, deckType){
      var c=0,d=0,h=0,s=0;
      var cardValues = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0];
      for(var card=0; card<cardDeck.cards.length; card++){
        if(cardDeck.cards[card].SUIT === "C"){c++}
        else if(cardDeck.cards[card].SUIT === "D"){d++}
        else if(cardDeck.cards[card].SUIT === "H"){h++}
        else if(cardDeck.cards[card].SUIT === "S"){s++}
        cardValues[cardDeck.cards[card].VALUE]++;
      }
      console.log(c,d,h,s,cardValues);
    },

    createFrenchDeck: function(cardDeck, options){
      var SUITS = ["C","D","H","S"] // clubs diamonds hearts spades
      var deckOfCards = cardDeck;
      for(var suit=0; suit<SUITS.length; suit++){
        for(var cardValue=1; cardValue<14; cardValue++){//A=1 K=13
          deckOfCards.cards.push( new this.Card(SUITS[suit], cardValue) );
        }
      }
      if(!options === "NO_JOKER"){
        //throw some jokers in deckOfCards
      }
      return deckOfCards;
    },




  }
});
