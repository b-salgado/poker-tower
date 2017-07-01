"use strict"
define(function(){
  return{
    canvas: null,
    cardsSprite: null,
    communityCards: [],
    CARD_XY: [125, 181],
    CARD_SCALE: [70,100],
    background: null,
    canvas2DContext: null,

    playersAtTable: {},
    client_uuid: null,

    renderObjects:[],

    nullCard:{
      FACE_DOWN: true,
      SUIT: 4,
      VALUE: 2,
      pos_xy: [null,null]
    },

    init: function(){
      var outerObjEnv = this;
      this.canvas = document.getElementById("poker-canvas");
      this.canvas2DContext = this.canvas.getContext("2d");
      this.background = this.imageLoader("./assets/red_poker.jpg");

      this.initErrorBubbleLogic();
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

        console.log(newPlayer.html.getBoundingClientRect(), newPlayer.html);
        newPlayer.html.getElementsByClassName("pk-player-name")[0].innerText = playerInfoPack.name;

        this.playersAtTable[newPlayer.playerInfo.uuid] = newPlayer;
      }
    },

    addClientPlayer:function(playerInfoPack){
      this.clientPlayer = {
                            playerInfo: playerInfoPack,
                            html: null
                          };
      this.clientPlayer.html = document.getElementsByClassName("pk-player-client")[0]; //find client
      this.clientPlayer.html.id = playerInfoPack.uuid; //set id
      this.clientPlayer.html.getElementsByClassName("pk-player-name")[0].innerText = playerInfoPack.name; //set name
      this.clientPlayer.html.getElementsByClassName("pk-player-icon")[0].src = "./assets/player_icons/"+playerInfoPack.icon;
      this.clientPlayer.html.getElementsByClassName("pk-player-wealth")[0].innerText = playerInfoPack.wealth+" ₪";
    },

    addCommunityCard:function(card){
      var spaceBetweenCards = 10;
      var offset = 150;
      console.log(card);
      card.scale_xy = [70, 100];
      card.pos_xy = [this.communityCards.length * (card.scale_xy[0] + spaceBetweenCards) + offset, window.innerHeight/2 - card.scale_xy[1]];
      this.communityCards.push(card);
      this.renderObjects.push(card);
    },

    alertPlayerBet: function(){
      var clientPlayerCharInput = document.getElementById("pk-inputbox");
      clientPlayerCharInput.style.backgroundColor = "yellow";
      clientPlayerCharInput.style.color = "red";
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
      /*for(var input=0; input<tableInputs.length; input++){
        tableInputs[input].addEventListener("click", function(){
          const errorBubbles = document.getElementsByClassName("pk-error-bubble");
          for(var errorBubble=0; errorBubble<errorBubbles.length; errorBubble++){
            console.log(errorBubbles[errorBubble]);
          }
        });
      }*/
    },

    displayErrorBubble: function(pos, message){
      const errorBubble = document.getElementsByClassName("pk-error-bubble")[0];
      errorBubble.style.left = pos[0] + "px";
      errorBubble.style.top = pos[1] + "px";
      errorBubble.innerText = message;
      errorBubble.classList.add("pk-error-bubble-show");
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
      this.drawClientPlayerCards();
      this.renderGameObjects();
    },

    drawClientPlayerCards: function(){
      if(this.clientPlayer && this.clientPlayer.playerInfo.cardsInHand.length > 0){
        var cardsInHand = this.clientPlayer.playerInfo.cardsInHand;
        var cardPadding = 5;
        var cardScale_xy = this.CARD_SCALE;
        var clientPlayerHtmlRect = this.clientPlayer.html.getBoundingClientRect();
        var drawPosLeft = clientPlayerHtmlRect.left + clientPlayerHtmlRect.width / 2;
        var drawPosTop = clientPlayerHtmlRect.top - cardScale_xy[1] - cardPadding;

        //console.log(cardsInHand, this.clientPlayer.playerInfo.cardsInHand);

        this.canvas2DContext.drawImage(this.cardsSprite, (cardsInHand[0].VALUE-2)*this.CARD_XY[0], cardsInHand[0].SUIT*this.CARD_XY[1],
        this.CARD_XY[0], this.CARD_XY[1], drawPosLeft, drawPosTop, cardScale_xy[0], cardScale_xy[1]);
        this.canvas2DContext.drawImage(this.cardsSprite, (cardsInHand[1].VALUE-2)*this.CARD_XY[0], cardsInHand[1].SUIT*this.CARD_XY[1],
        this.CARD_XY[0], this.CARD_XY[1], drawPosLeft + cardScale_xy[0] + cardPadding, drawPosTop, cardScale_xy[0], cardScale_xy[1]);
      }
    },

    renderGameObjects:function(){
      var renderObject = null;
      for(var renObjIndex=0; renObjIndex<this.renderObjects.length; renObjIndex++){
        renderObject = this.renderObjects[renObjIndex];
        //console.log(renderObject);
        this.canvas2DContext.drawImage(this.cardsSprite, (renderObject.VALUE-2)*this.CARD_XY[0], renderObject.SUIT*this.CARD_XY[1],
        this.CARD_XY[0], this.CARD_XY[1], renderObject.pos_xy[0], renderObject.pos_xy[1], renderObject.scale_xy[0], renderObject.scale_xy[1]);
      }
    },

    resetRenderedGameObjects:function(){
      this.renderObjects = [];
    },

    drawPlayersCards: function(){
      for(var player in this.playersAtTable){
        if( !(player === this.client_uuid) ){
          var cardsInHand = [];
          var cardPadding = 5;
          var playerHtmlRect = null;
          var drawPosLeft = null;
          var drawPosTop = null;
          var cardScale_xy = [null, null];
          //console.log(this.playersAtTable[player].playerInfo.is_playing);
          if(this.playersAtTable[player].playerInfo.is_playing){
            cardsInHand = this.playersAtTable[player].playerInfo.cardsInHand;
            //playerHtmlRect = this.playersAtTable[player].html.getBoundingClientRect();
            playerHtmlRect = document.getElementById(this.playersAtTable[player].playerInfo.uuid).getBoundingClientRect();
            drawPosLeft = playerHtmlRect.left + playerHtmlRect.width/3;
            drawPosTop = playerHtmlRect.bottom + cardPadding; // +3px
            cardScale_xy[0] = playerHtmlRect.width / 3.5;
            cardScale_xy[1] = cardScale_xy[0] * 1.5;
            //console.log(this.playersAtTable[player].html, drawPosLeft, drawPosTop);
            this.canvas2DContext.drawImage(this.cardsSprite, (cardsInHand[0].VALUE-2)*this.CARD_XY[0], cardsInHand[0].SUIT*this.CARD_XY[1],
            this.CARD_XY[0], this.CARD_XY[1], drawPosLeft, drawPosTop, cardScale_xy[0], cardScale_xy[1]);
            this.canvas2DContext.drawImage(this.cardsSprite, (cardsInHand[1].VALUE-2)*this.CARD_XY[1], cardsInHand[1].SUIT*this.CARD_XY[1],
            this.CARD_XY[0], this.CARD_XY[1], drawPosLeft + cardScale_xy[0] + cardPadding, drawPosTop, cardScale_xy[0], cardScale_xy[1]);
          }
        }
      }
    },

    updateCardHand: function(game_state_pkg){
      var currentHandPlayers = game_state_pkg.currentHandPlayers;
      for(var player in currentHandPlayers){
        if( !(currentHandPlayers[player].uuid === this.client_uuid) ){ //its its not the final round where you need to show cards
          this.playersAtTable[player].playerInfo.is_playing = true;
          this.playersAtTable[player].playerInfo.cardsInHand = [];
          this.playersAtTable[player].playerInfo.cardsInHand[0] = this.nullCard;
          this.playersAtTable[player].playerInfo.cardsInHand[1] = this.nullCard;
          console.log(this.playersAtTable);
        }
        else if(currentHandPlayers[player].uuid === this.client_uuid){
          this.clientPlayer.playerInfo.cardsInHand = game_state_pkg.clientHand;
        }
      }
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
