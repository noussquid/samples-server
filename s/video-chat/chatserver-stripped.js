//#!/usr/bin/env node
//
// WebSocket chat server 
// Implemented using Node.js
//
// Copied from http://bit.ly/webrtc-from-chat  
// A simplified step by step version so I can understand the pieces
//
// user ID management
// message reflection
// routing of private messages
// signaling for WebRTC

"user strict";

// Used for managing the user list
var connectionArray = [];
var nextID = Date.now();
var appendToMakeUnique = 1;

// Scan the list of connections and return the one for the specified
// clientID.  
// Each login gets an ID that does not change during the session
// so it can be tracked across username changes
function getConnectionForID(id) {
    var connect = null; 
    var i; 

    for (i = 0; i < connectionArray.length; i++) {
        if (connectionArray[i].clientID === id) {
            connect = connectionArray[i];
            break;
        }
    }

    return connect; 
}

function isUsernameUnique(name) {
    var isUnique = true;
    var i; 

    for (i = 0; i < connectionArray.length; i++) {
        if (connectionArray[i].username === name) {
            isUnique = false; 
            break;
        }
    }
    return isUnique;
}

// Builds a message object of type "userlist" which contains the names of 
// all connected users. Used to ramp up newly logged-in users and 
// to handle name change notifications
function makeUserListMessage() {
    var userListMsg = {
        type: "userlist", 
        users: []
    }; 

    var i; 

    // Add the users to the list
    for (i = 0; i < connectionArray.length; i++) {
        userListMsg.users.push(connectionArray[i].username);
    }

    return userListMsg;
}

// Sends a "userlist" message to all chat members.
function sendUserListToAll() {
    var userListMsg =  makeUserListMessage();
    var userListMsgStr = JSON.stringify(userListMsg);
    var i; 

    for (i = 0; i < connectionArray.length; i++) {
        connectionArray[i].sendUTF(userListMsgStr);
    }
}

// Web Socket Server Section 
var https = require('https');
var fs = require('fs');
var WebSocketServer = require('websocket').server;

var serverIp = "localhost";

// HTTPS Server Section 
// - service WebSocket connections
// - secure use certificates

// load the key and certificate to secure HTTPS
var httpsOptions = {
    key: fs.readFileSync("../../privkey.pem"), 
    cert: fs.readFileSync("../../fullchain.pem")
};

// Our HTTPS server does nothing but service WebSocket
// connections, so every request just returns 404. Real Web
// requests are handled by the main server on the box. 
var httpsServer = https.createServer(httpsOptions, function(request, response) {
    console.log("Received secure requests for " + request.url);
    response.writeHead(404);
    response.end();
});

// Spin up the HTTPS server on the port used on the client side
httpsServer.listen(6503, serverIp, function() {
    console.log("Server is listening on port 6503");
});

// Convert HTTPS Server into WebSocket
var wsServer = new WebSocketServer({
    httpServer: httpsServer, 
    autoAcceptConnections: false
});

if (!wsServer) {
    console.log("ERROR: Unable to create WebSocket Server!");
}


// Set up a "connect" message handler on our WebSocket server
// This is called whenever a user connects to the server's port
// using the websocket protocol.
// Which in chatclient.js happens when inside the connect() function 
// connection = new WebSocket(serverURL, "json");
wsServer.on('request', function(request) {
    console.log("Received request " + request);

    // Accept the request and get a connection
    var connection = request.accept("json", request.origin);
    console.log("Connection accepted from " + connection.remoteAddress);
    
    // Add the connection to our list of connections
    connectionArray.push(connection);
    connection.clientID = nextID;
    nextID++;

    // send the new client its token
    // the client will reply back with a username
    var msg = {
        type: "id", 
        id: connection.clientID
    };
    connection.sendUTF(JSON.stringify(msg));
    

    // Set up a handler for the "message" event received over WebSocket.
    // This is a message sent from the client. 
    // It may be text to share with other users
    // a private message (text or signaling) for one user
    // or a command to the server 
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("received utf8 message: " + message.utf8Data);

            // process incoming data
            var sendToClients = true;
            msg = JSON.parse(message.utf8Data);
            var connect = getConnectionForID(msg.id);
            
            console.dir(connect);

            switch (msg.type) {
                case "chat":
                    console.log("a chat message received ");
                    break;
                case "username":
                    // we only allow unique names
                    var nameChanged = false;
                    var origName = msg.name;

                    // append a number to the name if 
                    // duplicate
                    while (!isUsernameUnique(msg.name)) {
                        msg.name = origName + appendToMakeUnique;
                        appendToMakeUnique++;
                        nameChanged = true;
                    }

                    // If the name had to be changed, we send a "rejectusername" 
                    // message back to the user so they know their name has been
                    // altered by the server.

                    if (nameChanged) {
                        var changeMsg = {
                            id: msg.id, 
                            type: "rejectusername", 
                            name: msg.name
                        };
                        connect.sendUTF(JSON.stringify(changeMsg));
                    }

                    // Set this connection's final username and send out the 
                    // updated user list to all users. 
                    connect.username = msg.name;
                    sendUserListToAll();
                    sendToClients = false;
                    break;
            }
        }
    });
  
		// Handle the WebSocket "close" event; this means a user has logged off
		// or has been disconnected.
  	connection.on('close', function(reason, description) {
			// First, remove the connection from the list of connections.
    	connectionArray = connectionArray.filter(function(el, idx, ar) {
				return el.connected;
    	});

    	// Now send the updated user list. Again, please don't do this in a
    	// real application. Your users won't like you very much.
    	sendUserListToAll();

    	// Build and output log output for close information.
    	var logMessage = "Connection closed: " + connection.remoteAddress + " (" + reason; 
   		if (description !== null && description.length !== 0) {
     		logMessage += ": " + description;
    	}
    	
			logMessage += ")";
    	console.log(logMessage);
  	});

});

// User Management Section
// - verify entered user name is unique
// - manage a user list
//      -- add user to  list
//      -- remove user from list
//      -- send user list to all 
// - send message to user


