"use strict"
define(function(){
  return{
    canvas: null,
    cardsSprite: null,
    communityCards: [],
    CARD_XY: [125, 181],
    CARD_SCALE_XY: [70,70*1.55],
    background: null,
    canvas2DContext: null,

    playersAtTable: {},
    client_uuid: null,

    renderObjects:[],

    nullCard:{
      face_down: true,
      suit: 4,
      value: 2,
      pos_xy: [null,null]
    },

    init: function(){
      var outerObjEnv = this;
      this.canvas = document.getElementById("poker-canvas");
      this.canvas2DContext = this.canvas.getContext("2d");
      this.background = this.imageLoader("./assets/red_poker.jpg");

      this.initErrorBubbleLogic();
      this.initAlertPlayerBetLogic();
      this.cardsSprite = this.imageLoader("./assets/french_deck_0.png");
      this.canvas2DContext.fillStyle = "rgba(100,100,0,1.0)";

      document.getElementsByTagName("body")[0].style.backgroundColor = "#000000";

      /*===Inital GUI Scaling and Adjust on resize==*/
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.scaleIcons();
      this.scaleFonts();
      window.onresize = function(){
        outerObjEnv.canvas.width = window.innerWidth;
        outerObjEnv.canvas.height = window.innerHeight;
        //outerObjEnv.scaleIcons();
        //outerObjEnv.scaleFonts();
      }
      /*============================================*/
      this.render();
    },

    addPlayer:function(playerInfoPack){
      if(playerInfoPack.uuid === this.client_uuid){
        this.addClientPlayer(playerInfoPack);
      }
      else{
        var pokerPlayersContainerTop = document.getElementById("pk-players-container-top");

        var newPlayer = {
          playerInfo: playerInfoPack,
          html: null
        };

        newPlayer.html = this.PokerPlayerTemplate(playerInfoPack);
        pokerPlayersContainerTop.innerHTML += newPlayer.html;
        newPlayer.html = document.getElementById(playerInfoPack.uuid);

        //console.log(newPlayer.html.getBoundingClientRect(), newPlayer.html);
        newPlayer.html.getElementsByClassName("pk-player-name")[0].innerText = playerInfoPack.name;

        this.playersAtTable[newPlayer.playerInfo.uuid] = newPlayer;
      }
    },

    addClientPlayer:function(playerInfoPack){
      this.clientPlayer = {
        playerInfo: playerInfoPack,
        html: null
      };
      this.playersAtTable[this.clientPlayer.playerInfo.uuid] = this.clientPlayer;
      this.clientPlayer.html = document.getElementsByClassName("pk-player-client")[0]; //find client
      this.clientPlayer.html.id = playerInfoPack.uuid; //set id
      this.clientPlayer.html.getElementsByClassName("pk-player-name")[0].innerText = playerInfoPack.name; //set name
      this.clientPlayer.html.getElementsByClassName("pk-player-icon")[0].src = "./assets/player_icons/"+playerInfoPack.icon;
      this.clientPlayer.html.getElementsByClassName("pk-player-wealth")[0].innerText = playerInfoPack.wealth+" ₪";
    },

    addCommunityCard:function(sentCard){
      const margin = 10;
      const xOffset = window.innerWidth / 2;
      const x = (this.CARD_SCALE_XY[0] + margin) * this.communityCards.length + xOffset;
      console.log( this.CARD_SCALE_XY[0]*this.communityCards.length + xOffset + margin );
      const y = window.innerHeight/2 - this.CARD_SCALE_XY[1];

      let card = new this.Card(false, [x, y], this.CARD_SCALE_XY, sentCard.SUIT, sentCard.VALUE);

      this.communityCards.push(card);
    },

    alertErrorBubble: function(pos, message){
      const errorBubble = document.getElementsByClassName("pk-error-bubble")[0];
      errorBubble.style.left = pos[0] + "px";
      errorBubble.style.top = pos[1] + "px";
      errorBubble.innerText = message;
      errorBubble.classList.add("pk-error-bubble-show");
    },

    alertPlayerBetTimer: function(player){//Eventually program a visual timer
      const betTimer = document.getElementById("pk-bet-timer");
      const playerHtmlRect = document.getElementById(this.client_uuid).getBoundingClientRect();
      betTimer.innerText = "Your turn";
      betTimer.style.fontSize = "0.9em";
      betTimer.style.opacity = "1.0";
      betTimer.style.backgroundColor = "yellow";
      betTimer.style.left = playerHtmlRect.left + "px";
      betTimer.style.display = "flex";
      betTimer.style.top = playerHtmlRect.top - betTimer.getBoundingClientRect().height *2  + "px";
    },

    alertMessage: function(pos, message){
      const betTimer = document.getElementsByClassName("pk-error-bubble")[0];
      const playerHtmlRect = document.getElementById(this.client_uuid).getBoundingClientRect();
      betTimer.innerText = message;
      betTimer.style.fontSize = "0.9em";
      betTimer.style.opacity = "1.0";
      betTimer.style.backgroundColor = "yellow";
      betTimer.style.left = "10px";
      betTimer.style.display = "flex";
      betTimer.style.top = playerHtmlRect.top - betTimer.getBoundingClientRect().height *4  + "px";
    },

    drawPlayersCards: function(){
      var cardPlayer = null;
      var renderObject = null;
      var cardsInHand = null;
      for(var player in this.playersAtTable){
        cardPlayer = this.playersAtTable[player];
        cardsInHand = cardPlayer.playerInfo.cardsInHand;
        for(var card=0; card < cardsInHand.length; card++){
          renderObject = cardsInHand[card];
          //console.log(renderObject);
          this.canvas2DContext.drawImage(this.cardsSprite, (renderObject.value-2)*this.CARD_XY[0], renderObject.suit*this.CARD_XY[1],
          this.CARD_XY[0], this.CARD_XY[1], renderObject.pos_xy[0], renderObject.pos_xy[1], renderObject.scale_xy[0], renderObject.scale_xy[1]);
        }
      }
    },

    imageLoader: function(src){
      var image = new Image();
      image.src = src;
      return image;
    },

    initErrorBubbleLogic: function(){ //To be filled with more animations error notices etc...
      const tableRegisterForm = document.getElementsByClassName("pkss-register-table-form")[0];
      const errorBubbles = document.getElementsByClassName("pk-error-bubble");
      const tableInputs = tableRegisterForm.getElementsByTagName("input");
      for(var errorBubble=0; errorBubble<errorBubbles.length; errorBubble++){
        errorBubbles[errorBubble].addEventListener("animationend", function(){
          console.log(this);
          this.classList.remove("pk-error-bubble-show");
        });
      }
    },

    initAlertPlayerBetLogic: function(){ //To be filled with more animations error notices etc...
      const betTimer = document.getElementById("pk-bet-timer");
      const inputBox = document.getElementById("pk-inputbox");
      const inputButtons = document.getElementsByClassName("pk-action");
      for(var inputButton=0; inputButton<inputButtons.length; inputButton++){
        inputButtons[inputButton].addEventListener("click", function(){
          betTimer.style.display = "none";
        });
      }
      inputBox.addEventListener("click", function(){
        betTimer.style.display = "none";
      });
    },

    removeSplashScreen: function(){
      document.getElementById("pk-splash-screen").style.display = "none";
    },

    removePlayer: function(playerInfoPack){
      delete this.playersAtTable[playerInfoPack.uuid];
      var player = document.getElementById(playerInfoPack.uuid);
      player.parentNode.removeChild(player);
      console.log(player, playerInfoPack);
    },

    render: function(){
      var self = this;
      this.canvas2DContext.imageSmoothingEnabled = false;
      var draw = function(){
        self.canvas2DContext.drawImage(self.background, 0, 0, window.innerWidth, window.innerHeight);
        //self.canvas2DContext.drawImage(self.cardsSprite, 126*1, 0, 126, 181, 80, 180, 80, 100);
        //self.canvas2DContext.fillStyle = "rgb(119,136,153)"
        //self.canvas2DContext.fillRect(0,0,window.innerWidth,window.innerHeight);
        self.drawAllCards();
        window.requestAnimationFrame(draw);
      }
      draw();
    },

    drawAllCards: function(){
      this.drawPlayersCards();
      this.drawCommunityCards();
    },

    drawCommunityCards:function(){
      let card = null;
      for(var card_index = 0; card_index < this.communityCards.length; card_index++){
        card = this.communityCards[card_index];
        this.canvas2DContext.drawImage(this.cardsSprite, (card.value-2)*this.CARD_XY[0], card.suit*this.CARD_XY[1],
        this.CARD_XY[0], this.CARD_XY[1], card.pos_xy[0], card.pos_xy[1], card.scale_xy[0], card.scale_xy[1]);
      }
    },

    resetRenderedGameObjects:function(){
      this.renderObjects = [];
      this.communityCards = [];
    },

    resetInputbox:function(){
      var clientPlayerCharInput = document.getElementById("pk-inputbox");
      clientPlayerCharInput.style.backgroundColor = "black";
      clientPlayerCharInput.style.color = "green";
      clientPlayerCharInput.value = "";
    },

    scaleIcons:function(){
      var iconsToBeScaled = document.getElementsByClassName("pk-player-icon");
      for(var icon=0; icon<iconsToBeScaled.length; icon++){
        var iconStyle = window.getComputedStyle(iconsToBeScaled[icon]);
        if(Number(iconStyle.width.slice(0,-2)) > Number(iconStyle.height.slice(0,-2))){
          iconsToBeScaled[icon].style.width = iconStyle.height;
        }
        else{
          iconsToBeScaled[icon].style.height = iconStyle.width;
        }
      }
    },

    scaleFonts: function(){
      var labelsToBeScaled = document.getElementsByClassName("scalable-text");
      for(var label=0; label<labelsToBeScaled.length; label++){
        var count = 0;
        var labelStyle = window.getComputedStyle(labelsToBeScaled[label]);
        var labelNumFontSize = Number(labelStyle.fontSize.slice(0,-2));
        var labelParentStyle = window.getComputedStyle(labelsToBeScaled[label].parentElement)
        while(Number(labelStyle.width.slice(0,-2)) < Number(labelParentStyle.width.slice(0,-2)) && Number(labelStyle.height.slice(0,-2)) < Number(labelParentStyle.height.slice(0,-2)) && count<100){
          labelNumFontSize += 0.5;
          labelsToBeScaled[label].style.fontSize = labelNumFontSize+"px";
          labelStyle = window.getComputedStyle(labelsToBeScaled[label]);
          count++;
        }
        while(Number(labelStyle.width.slice(0,-2)) > Number(labelParentStyle.width.slice(0,-2)) || Number(labelStyle.height.slice(0,-2)) > Number(labelParentStyle.height.slice(0,-2)) && count<100){
          labelNumFontSize += -0.5;
          labelsToBeScaled[label].style.fontSize = labelNumFontSize+"px";
          labelStyle = window.getComputedStyle(labelsToBeScaled[label]);
          count++;
        }

      }
    },

    showDown: function(currentHandPlayers){
      let cardHand = null;
      let cardPlayer = null;
      for(var player in currentHandPlayers){
        cardHand = currentHandPlayers[player].cardsInHand;
        cardPlayer = this.playersAtTable[player];

        cardPlayer.playerInfo.cardsInHand[0].value = cardHand[0].VALUE;
        cardPlayer.playerInfo.cardsInHand[0].suit = cardHand[0].SUIT;

        cardPlayer.playerInfo.cardsInHand[1].value = cardHand[1].VALUE;
        cardPlayer.playerInfo.cardsInHand[1].suit = cardHand[1].SUIT;
      }
    },

    updateCardHand: function(game_state_pkg){
      const currentHandPlayers = game_state_pkg.currentHandPlayers;
      let playerHtmlRect = null;
      let cardPlayer = null;
      for(var player in currentHandPlayers){
        cardPlayer = this.playersAtTable[player];
        if( !(cardPlayer.playerInfo.uuid === this.client_uuid) ){ //its its not the final round where you need to show cards
          cardPlayer.playerInfo.is_playing = true;
          cardPlayer.playerInfo.cardsInHand = [];
          cardPlayer.playerInfo.cardsInHand[0] = new this.Card(true, [0,0], this.CARD_SCALE_XY);
          cardPlayer.playerInfo.cardsInHand[1] = new this.Card(true, [0,0], this.CARD_SCALE_XY);
          this.updatePositionOfPlayerCards(player);
        }
        else if(currentHandPlayers[player].uuid === this.client_uuid){
          const clientHand = game_state_pkg.clientHand;
          const playerHtmlRect = document.getElementById(player).getBoundingClientRect();
          const margin = 8;
          const x = playerHtmlRect.left + playerHtmlRect.width/2;
          const y = playerHtmlRect.top - this.CARD_SCALE_XY[1] - 30;
          this.clientPlayer.playerInfo.cardsInHand[1] = new this.Card(false, [x + this.CARD_SCALE_XY[0] + margin, y], this.CARD_SCALE_XY, clientHand[1].SUIT, clientHand[1].VALUE);
          this.clientPlayer.playerInfo.cardsInHand[0] = new this.Card(false, [x,y], this.CARD_SCALE_XY, clientHand[0].SUIT, clientHand[0].VALUE);
        }
      }
    },

    updatePositionOfPlayerCards: function(player_uuid){
      const margin = 8;
      const playerHtmlRect = document.getElementById(player_uuid).getBoundingClientRect();
      const y = playerHtmlRect.top + playerHtmlRect.height;
      const playerCards = this.playersAtTable[player_uuid].playerInfo.cardsInHand;

      playerCards[0].pos_xy = [playerHtmlRect.left, y + margin];
      playerCards[1].pos_xy = [playerHtmlRect.left + playerCards[1].scale_xy[0] + margin, y + margin];
    },

    updateSplashScreenTableList:function(tableInfoPack){
      var table = this.SplashScreenTableTemplate(tableInfoPack);
      var tableList = document.getElementById("pkss-current-tables-cntr");
      tableList.innerHTML += table;
    },

    updateRoomUUID:function(new_room_uuid){
      var displayedRoomUUID = document.getElementById("pk-room-uuid");
      displayedRoomUUID.innerText = new_room_uuid;
      //this.scaleFonts();
    },

    updatePlayerWealth:function(player){
      var playerGraphic = document.getElementById(player.uuid);
      //console.log(player, playerGraphic);
      playerGraphic.getElementsByClassName("pk-player-wealth")[0].innerText = player.wealth+" ₪";
    },

    updateTablePot:function(pot){
      console.log(pot);
      document.getElementById("pk-room-pot").innerText = pot+" ₪";
    },

    Card: function(face_down, pos_xy, scale, suit, value){
      this.face_down = face_down;
      this.pos_xy = pos_xy;
      this.scale_xy = scale;
      this.suit = suit === undefined ? 4 : suit;
      this.value = value || 2;
    },

    PokerPlayerTemplate: function(playerInfoPack){
      return `<div class="pk-player" id=`+playerInfoPack.uuid+`>
        <img class="pk-player-icon" src="./assets/player_icons/`+playerInfoPack.icon+`"></img>
        <span class="pk-player-stat-container">
          <div class="pk-player-name-container">
            <label class="scalable-text pk-player-name"></label>
          </div>
          <div class="pk-player-wealth-container">
            <label class="scalable-text pk-player-wealth">`+playerInfoPack.wealth+` ₪</label>
          </div>
        </span>
      </div>`
    },

    SplashScreenTableTemplate: function(tableInfoPack){
      return `
      <div class="pkss-table-list-element no-sel-drag" id=`+tableInfoPack.uuid+`>
        <label>`+tableInfoPack.name+`</label><label>$`+tableInfoPack.ante+`</label><label>`+0/0+`</label>
      </div>`
    }


  }
})
