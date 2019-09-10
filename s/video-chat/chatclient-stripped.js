// client side for WebRTC/WebSocket

"use strict";

var myHostname = window.location.hostname;
var myUsername = null;
var friendUsername = null;

// WebSocket chat/signaling channel variables
var connection = null;
var clientID = 0;

// Connect to WebSocket server
function connect() {
    console.log("connect: connecting to websocket server");
    var serverURL;

    serverURL = "wss://" + myHostname + "/draw/";
    connection = new WebSocket(serverURL, "json");

    connection.onopen = function(evt) {
        console.log("connection is open");
    }

    connection.onerror = function(evt) {
        console.log("made a big bad error: " + evt);
    }

    connection.onmessage = function(evt) {
        console.log("message received");
        var text = "";
        var msg = JSON.parse(evt.data);
    }
}

// Send a JavaScript object by converting it to 
// JSON and sending it as a message 
// on the WebSocket connection
function sendToServer(msg) {
    var msgJSON = JSON.stringify(msg);

    console.log("Sending '" + msg.type + "' message: " + msgJSON);
    connection.send(msgJSON);
}

