var _ = require('lodash');
var util = require('./util.js');

module.exports = function(io) {

  function Room(name) {
    this.name = name;
    this.name_lc = name.toLowerCase();
    this.sockets = [];
  };

  Room.prototype.join = function ( user ) {
    if( ~this.sockets.indexOf( user ) ) {
      user.emit('room already joined', this.name);
      return;
    }

    this.sockets.push( user );

    // add room to socket
    if(!user.roomList) {
      user.roomList = [];
    }
    user.roomList.push( this );

    // join room
    user.join( this.name_lc );
    user.emit('room joined', this.name);
    // send joined message
    this.sendMessage('SYSTEM', user.name + ' joined the Room.');
    // send the updated userlist
    this.sendUserlist();
  }

  Room.prototype.leave = function ( user ) {
    var i = this.sockets.indexOf(user);
    if (~i) {
      this.sockets.splice(i, 1);
    }

    // remove room from socket
    var r = user.roomList.indexOf( this );
    if (~r) {
      user.roomList.splice(r, 1);
    }

    user.leave( this.name_lc );
    this.sendMessage('SYSTEM', user.name + ' left the Room.');
    this.sendUserlist();
  }

  Room.prototype.sendUserlist = function () {
    // reduce list to their username
    var users = _.map(this.sockets, function(socket) {
      return socket.name;
    });

    io.to( this.name_lc ).emit('userlist', this.name_lc, users);
  }

  Room.prototype.sendMessage = function (user, message) {
    io.to( this.name_lc ).emit('message', this.name_lc, user, Date.now(), util.sanitize(message));
  }

  return Room;

};