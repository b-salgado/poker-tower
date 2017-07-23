/* jshint node: true */
"use strict";

var express = require("express");
var app = express();
var http = require("http").Server(app);/* Enabling Server(app) is neccessary for socket.io attachment */

global.io = require("socket.io")(http);

var handleBars = require("express-handlebars").create({defaultLayout:"main"});

var pokerSocketEngine = require("./poker_socket_engine.js");

var pokerIcons = [];

for(var i=0; i<9; i++){
  pokerIcons.push(i+".jpg");
}

app.set("port", process.env.PORT || 4000);

app.engine("handlebars", handleBars.engine);
app.set("view engine", "handlebars");

//Middlewear
app.use(express.static(__dirname + "/public"));
app.use(function(req, res, next){
  if(!res.locals.partials){
    res.locals.partials = {};
  }
  res.locals.partials.pokerIcons = pokerIcons;
  next();
});

app.get("/", function(req, res){
  res.render("poker");
});

http.listen(4000, function(){
  console.log("Listening on port:" + 4000);
});
