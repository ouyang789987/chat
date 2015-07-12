var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Room = require('./room.js')(io);
var util = require('./util.js');

app.use(express.static('public'));

var rooms = {};
var sockets = {};

io.on('connection', function(socket){
  // set a default username
  socket.name = 'guest' + Math.floor( Math.random() * (10000 - 1000) + 1000 );
  sockets[socket.name] = socket;

  socket.on('set username', function(username) {
    if(!username || !util.checkName(username)) {
      socket.emit('error message', Date.now(), 'A username may not be empty may only container the characters a-z, A-Z, 0-9 and underscore.');
      return;
    }

    if(sockets[username.toLowerCase()]) {
      socket.emit('error message', Date.now(), 'Username ' + username + ' is already taken.');
      return;
    }

    var oldName = socket.name;

    // remove old name from store
    delete sockets[socket.name.toLowerCase()];
    // change name
    socket.name = username;
    // save new name in store
    sockets[username.toLowerCase()] = socket;

    socket.emit('username set', username);
    
    // guard room list
    socket.roomList = socket.roomList || [];
    // emit updated userlists
    for (var i = socket.roomList.length - 1; i >= 0; i--) {
      var r = socket.roomList[i];
      r.sendUserlist();
      r.sendMessage('SYSTEM', oldName + ' changed their name to ' + username);
    };
  });

  socket.on('join room', function(room) {
    if(!room || !util.checkName(room)) {
      socket.emit('error message', Date.now(), 'A room name may not be empty and may only container the characters a-z, A-Z, 0-9 and underscore.');
      return;
    }

    var room_lc = room.toLowerCase();

    if(!rooms[room_lc]) {
      rooms[room_lc] = new Room(room);
    }

    rooms[room_lc].join( socket );
  });

  socket.on('leave room', function(room) {
    if(!room || !util.checkName(room)) {
      socket.emit('error message', Date.now(), 'A room name may not be empty and may only container the characters a-z, A-Z, 0-9 and underscore.');
      return;
    }

    room = room.toLowerCase();

    room = rooms[room];
    if(room) {
      room.leave( socket );
    }
  });

  socket.on('disconnect', function() {
    // in some instances this variable might not be set
    if(!socket.roomList) {
      return;
    }

    // leave all rooms
    for (var i = socket.roomList.length - 1; i >= 0; i--) {
      socket.roomList[i].leave( socket );
    };

    // remove socket from store
    delete sockets[socket.name.toLowerCase()];
  });

  socket.on('message', function(room, message) {
    room = rooms[room.toLowerCase()];
    if(room) {
      room.sendMessage(socket.name, util.sanitize(message));
    }
  });

  socket.on('whisper', function(name, message) {
    var target = getSocketByName(name);
    if( target === null ) {
      return;
    }

    var cleanMessage = util.sanitize(message);

    target.emit('whisper from', socket.name, Date.now(), cleanMessage);
    socket.emit('whisper to', target.name, Date.now(), cleanMessage);
  });

  socket.on('typing', function (room) {
    room = getRoomByName(room);
    if(room !== null && ~room.sockets.indexOf(socket)) {
      io.to(room.name_lc).emit('typing', room.name_lc, socket.name);
    }
  });

  socket.on('stop typing', function (room) {
    room = getRoomByName(room);
    if(room !== null && ~room.sockets.indexOf(socket)) {
      io.to(room.name_lc).emit('stop typing', room.name_lc, socket.name);
    }
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function getSocketByName(name) {
  return sockets[name.toLowerCase()] || null;
}

function getRoomByName(name) {
  return rooms[name.toLowerCase()] || null;
}