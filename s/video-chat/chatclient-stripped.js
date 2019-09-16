// client side for WebRTC/WebSocket

"use strict";

var myHostname = window.location.hostname;
var myUsername = null;
var friendUsername = null;

var canvas; // fabricjs canvas instance 
var allUsersGroup; // a fabricjs grouping of all users 

// WebSocket chat/signaling channel variables
var connection = null;
var clientID = 0;

let stateCheck = setInterval(() => {
    if (document.readyState === 'complete') {
        clearInterval(stateCheck); 
        //canvas = new fabric.Canvas('world-canvas');
        //canvas.renderAll();
    }
}, 100); 
// Given a message containing a list of usernames, this function
// populates the user list box with those names, making each item
// clickable to allow starting a video call. 
function handleUserlistMsg(msg, ctx) {
    console.log(allUsersGroup);


    allUsersGroup.forEachObject(function(obj) { 
        allUsersGroup.removeWithUpdate(obj); 
        canvas.remove(obj);
    });

    // Add member names from the received list
    for (let i = 0; i < msg.users.length; i++) {
	let userName = new fabric.Text(msg.users[i], {
            left: allUsersGroup.get('left') + allUsersGroup.getBoundingRect().width + 10, 
            fontSize: 24,
        });

	console.dir(userName);

        allUsersGroup.addWithUpdate(userName);
    }

    fabric.util.requestAnimFrame(function render() {
        canvas.renderAll();
        fabric.util.requestAnimFrame(render);
    });

}

// Connect to WebSocket server
function connect() {
    console.log("connect: connecting to websocket server");
    var serverURL;

    serverURL = "wss://" + myHostname + "/draw/";
    connection = new WebSocket(serverURL, "json");

    canvas = new fabric.Canvas('world-canvas');
    allUsersGroup = new fabric.Group([], {
        left: 50,
        top: 50
    });

    canvas.add(allUsersGroup);

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

        var self = this;

        switch (msg.type) {
            case "id":
                clientID = msg.id;
                setUsername();
                break;
            case "username":
                text = "User " + msg.name + " signed in at " + timeStr;
                console.log(text);
            case "rejectusername":
                text = "Your username has been set to " + myUsername;
                text += " because the name you chose is in use.";
                console.log(text);
                myUsername = msg.name;
                break;
            case "userlist":
                handleUserlistMsg(msg, self);
                break;
            default:
                console.log("Unknown message received: ");
                console.log(msg);
        }

        if (text.length) {
            var fabricText = new fabric.Text(text, {
                fontSize: 30,
                originX: 'center',
                originY: 'center'
            });

            canvas.add(fabricText);
            canvas.renderAll();
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
