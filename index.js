require('dotenv').config();

// Twilio init
var twilio = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static('public'));
// When a socket connects, set up the specific listeners we will use.
io.on('connection', function(socket){
  // When a client tries to join a room, only allow them if they are first or
  // second in the room. Otherwise it is full.
  socket.on('join', function(room){
    console.log('A client joined')
    var clients = io.sockets.adapter.rooms[room];
    var numClients = typeof clients !== 'undefined' ? clients.length : 0;
    console.log(numClients)
    if(numClients == 0){
      socket.join(room);
    }else if(numClients == 1){
      socket.join(room);
      // When the client is second to join the room, both clients are ready.
      console.log(room)
      console.log(socket.id)
      
      console.log('Broadcasting ready message')
      socket.emit('ready', room);
      socket.broadcast.emit('ready', room);
    }else{
      socket.emit('full', room);
    }
  });

  // When receiving the token message, use the Twilio REST API to request an
  // token to get ephemeral credentials to use the TURN server.
  socket.on('token', function(){
    console.log('Received token request')
    twilio.tokens.create(function(err, response){
      if(err){
        console.log(err);
      }else{
        // Return the token to the browser.
        console.log('Token generated. Returning it to the client')
        socket.emit('token', response);
      }
    });
  });

  // Relay candidate messages
  socket.on('candidate', function(candidate){
    console.log('Received candidate. Broadcasting...')
    socket.broadcast.emit('candidate', candidate);
  });

  // Relay offers
  socket.on('offer', function(offer){
    console.log('Received offer. Broadcasting...')
    socket.broadcast.emit('offer', offer);
  });

  // Relay answers
  socket.on('answer', function(answer){
    console.log('Received answer. Broadcasting...')
    socket.broadcast.emit('answer', answer);
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
