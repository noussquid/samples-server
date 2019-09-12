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
        console.dir(evt.data);

        var text = "";
        var msg = JSON.parse(evt.data);

        var time = new Date(msg.date);
        var timeStr = time.toLocaleTimeString();

        switch(msg.type) {
            case "id":
                clientID = msg.id;
                setUsername();
                break;
            case "rejectusername":
                console.log("new username: " + msg.name);
                myUsername = msg.name;
                break;
            default:
                console.log("Unknown message received: ");
                console.log(msg);
        }
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

function setUsername() {
    myUsername = document.getElementById("name").value;

    sendToServer({
        name: myUsername,
        date: Date.now(), 
        id: clientID,
        type: "username"
    });
}
