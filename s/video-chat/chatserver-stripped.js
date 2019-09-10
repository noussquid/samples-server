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

wsServer.on('request', function(request) {
    // Accept the request and get a connection
    var connection = request.accept("json", request.origin);
    console.log("Connection accepted from " + connection.remoteAddress);
});

// User Management Section
// - verify entered user name is unique
// - manage a user list
//      -- add user to  list
//      -- remove user from list
//      -- send user list to all 
// - send message to user

