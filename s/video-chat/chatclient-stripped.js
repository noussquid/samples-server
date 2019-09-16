// client side for WebRTC/WebSocket

"use strict";

var myHostname = window.location.hostname;
var myUsername = null;
var friendUsername = null;

var canvas; // fabricjs canvas instance 
var allUsersGroup; // a fabricjs grouping of all users 
var users = [];

// WebSocket chat/signaling channel variables
var connection = null;
var clientID = 0;
var greetingText;

let stateCheck = setInterval(() => {
    if (document.readyState === 'complete') {
        clearInterval(stateCheck);
        canvas = new fabric.Canvas('world-canvas');

        allUsersGroup = new fabric.Group([], {
            left: 50,
            top: 50,
            subTargetCheck: true,
            hasControls: false
        });

        greetingText = new fabric.Textbox('tap to enter a username', {
            left: document.documentElement.clientWidth / 2 - 100,
            top: 100,
            width: 150,
            editable: true,
            hasControls: false,
            textAlign: 'center'
        });

        greetingText.on('mousedown', function(evt) {
            console.log('mouseDown greetingText');
            evt.target.text = '';
            evt.target.enterEditing();
        });


        greetingText.on('modified', function(evt) {
            console.log('greetingText modified');
            connect();
        });


        canvas.on('mouse:up', function(options) {
            if (options.target) {
                console.log('an object was clicked! ', options.target.type);
            }
        });

        canvas.on('object:selected', function(options) {
            console.log('object:selected', options);
        });

        canvas.add(greetingText);
        canvas.add(allUsersGroup);
    }
}, 100);

function animate(e, dir) {
    if (e.target) {
        fabric.util.animate({
            startValue: e.subTargets[0].get('scaleX'),
            endValue: e.subTargets[0].get('scaleX') + (dir ? -0.2 : 0.2),
            duration: 10,
            onChange: function(value) {
                console.log(value);
                e.subTargets[0].scale(value);
                canvas.renderAll();
            },
            onComplete: function() {
                console.log('onComplete');
                e.target.setCoords();
                e.subTargets[0].scale(1);
            }
        });
    }
}
// Given a message containing a list of usernames, this function
// populates the user list box with those names, making each item
// clickable to allow starting a video call. 
function handleUserlistMsg(msg, ctx) {

    // removes all users before updating list
    // destroying the group would drop all group objects
    // back on canvas so we remove them all one by one
    allUsersGroup.forEachObject(function(obj) {
        allUsersGroup.removeWithUpdate(obj);
        canvas.remove(obj);
    });

    // Add member names from the received list
    for (let i = 0; i < msg.users.length; i++) {
        let userName = new fabric.Text(msg.users[i], {
            left: allUsersGroup.get('left') + allUsersGroup.getBoundingRect().width + 10,
            fontSize: 24
        });

        userName.on('mouseup', function(evt) {
            console.log('userName mouseup', evt);
        });

        userName.on('mousedown', function(evt) {
            console.log('userName mousedown', evt);
            animate(evt, 1);
        });

        userName.on('mouseover', function(evt) {});

        userName.on('mouseout', function(evt) {
        });

        userName.on('selected', function(evt) {
            console.log('userName selected', evt);
        });

        allUsersGroup.addWithUpdate(userName);
    }

    fabric.util.requestAnimFrame(function render() {
        canvas.requestRenderAll();
        fabric.util.requestAnimFrame(render);
    });

}

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
    //myUsername = document.getElementById("name").value;
    myUsername = greetingText.text;
    greetingText.visible = false;

    sendToServer({
        name: myUsername,
        date: Date.now(),
        id: clientID,
        type: "username"
    });
}
