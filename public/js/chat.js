var currentRoom = {};
var rooms = {};
var colors = ['#374752','#295f99','#ff7f00','#ffff00','#7f007f','#00a833','#ff0000','#994b00','#4C0F2A','#590b3f','#148366','#ff3f00','#7fd319','#bf003f','#224811','#196019','#542f8c','#ffbf00','#89c172','#ac251f'];
var isTyping = false;
var lastTypingTime;

var socket = io();

socket.on('connect', function() {
  socket.emit('set username', prompt('What\'s your name?'));
});

socket.on('username set', function(username) {
  socket.name = username;
});

socket.on('error message', function(time, message) {
  alert(message);
});

socket.on('message', function(room, user, time, msg) {
  appendMessage({
    room: room,
    type: 'room',
    user: user,
    time: formatTime(time),
    msg: msg,
    color: getColorForName(user)
  });
});

socket.on('room joined', function(room) {
  var roomObj = {
    name: room,
    id: room.toLowerCase(),
    type: 'room'
  };

  rooms[roomObj.id] = roomObj;
  appendRoom(roomObj);
});

socket.on('userlist', function(room, users) {
  var userlist = getUserlist(room, 'room');
  // clear userlist
  userlist.empty();

  var userTmpl = tmpl("user_tmpl"), html = "";
  var length = users.length;
  for ( var i = 0; i < length; i++ ) {
    html += userTmpl( { name: users[i], room: room.toLowerCase(), id: users[i].toLowerCase() } );
  }
  userlist.append(html);
});

socket.on('typing', function(room, user) {
  getUserTypingInRoom(room, 'room', user).show();
});

socket.on('stop typing', function(room, user) {
  getUserTypingInRoom(room, 'room', user).hide();
});

socket.on('room already joined', function(room) {
  slideOpenUserlist(getRoomInNav(room, 'room'));
});

socket.on('whisper from', function(user, time, msg) {
  var messages = getMessages('pc_'+user.toLowerCase(), 'conversation');

  if(messages.length === 0) {
    openConversation(user);
  }

  appendMessage({
    room: 'pc_'+user.toLowerCase(),
    type: 'conversation',
    user: user,
    time: formatTime(time),
    msg: msg,
    color: getColorForName(user)
  });
});

socket.on('whisper to', function(user, time, msg) {
  var messages = getMessages('pc_'+user.toLowerCase(), 'conversation');

  if(messages.length === 0) {
    openConversation(user);
  }

  appendMessage({
    room: 'pc_'+user.toLowerCase(),
    type: 'conversation',
    user: socket.name,
    time: formatTime(time),
    msg: msg,
    color: getColorForName(socket.name)
  });
});

$('form').submit(function(){
  var text = $('#m').val();
  var matches = text.match(/^\/([a-zA-Z0-9]+) ([a-zA-Z0-9]+)(?: (.+))?$/);

  if(matches !== null) {
    switch(matches[1]) {
      case 'msg'     :
      case 'whisper' :
      case 'w'       :  whisper(matches[2], matches[3]);
                        break;
      case 'name'    :  setName(matches[2]); // for now we just ignore the rest
                        break;
      default        :  alert('Unknown command');
                        break;
    }
  } else {
    if(currentRoom.type === 'room') {
      socket.emit('message', currentRoom.id, text);
      socket.emit('stop typing', currentRoom.id);
      isTyping = false;
    } else if(currentRoom.type === 'conversation') {
      whisper(currentRoom.name, text);
    }
  }

  $('#m').val('');
  return false;
});

function whisper(name, msg) {
  socket.emit('whisper', name, msg);
}

function setName(name) {
  socket.emit('set username', name);
}

/*  _    _   ______   _        _____    ______   _____  
 * | |  | | |  ____| | |      |  __ \  |  ____| |  __ \ 
 * | |__| | | |__    | |      | |__) | | |__    | |__) |
 * |  __  | |  __|   | |      |  ___/  |  __|   |  _  / 
 * | |  | | | |____  | |____  | |      | |____  | | \ \ 
 * |_|  |_| |______| |______| |_|      |______| |_|  \_\
 */

function formatTime(ms) {
  return new Date(ms).toTimeString().replace(/.*(\d{2}:\d{2}):\d{2}.*/, "$1");
}

function getColorForName(name) {
  var number = 0;
  for (var i = 0; i < name.length && i < 10; i++) {
    number += name.charCodeAt(i);
  };

  var index = number % colors.length;

  return colors[index];
}

function appendMessage(obj) {
  getMessages(obj.room, obj.type).find('ul').append( tmpl("message_tmpl", obj) );
  var mainContent = $('.main-content');
  mainContent.scrollTop(mainContent.prop("scrollHeight"));
}

function getRoomInNav(room, type) {
  return $('li[data-role="nav"][data-id="'+room+'"][data-type="'+type+'"]');
}

function getUserlist(room, type) {
  return getRoomInNav(room, type).find('ul[data-role="userlist"]');
}

function getUserTypingInRoom(room, type, user) {
  return getRoomInNav(room, type).find('i[data-id="'+user+'"][data-type="user"][data-role="typing"]');
}

function getMessages(room, type) {
  return $('.main-content > div[data-id="'+room+'"][data-type="'+type+'"][data-role="messages"]');
}

/*   _____   _____   _____    ______   ____               _____  
 *  / ____| |_   _| |  __ \  |  ____| |  _ \      /\     |  __ \ 
 * | (___     | |   | |  | | | |__    | |_) |    /  \    | |__) |
 *  \___ \    | |   | |  | | |  __|   |  _ <    / /\ \   |  _  / 
 *  ____) |  _| |_  | |__| | | |____  | |_) |  / ____ \  | | \ \ 
 * |_____/  |_____| |_____/  |______| |____/  /_/    \_\ |_|  \_\
 */

$( '#controls-joinroom' ).click(function() {
  joinRoom();
});

$( '#controls-joinconv').click(function() {
  var user = prompt('Which user do you want to message?');
  openConversation(user);
});

function joinRoom() {
  socket.emit('join room', prompt('Which room do you want to join?'));
}

function openConversation(user) {
  var id = 'pc_' + user.toLowerCase();

  // if the room already exists, just open the room
  if(rooms[id]) {
    slideOpenUserlist(getRoomInNav(id, 'conversation'));
  } else {
    var room = {
        id: id,
        name: user,
        type: 'conversation'
      };

    rooms[room.id] = room;
    appendRoom(room);
  }
}

function appendRoom(obj) {
  if(obj.type === 'room') {
    $(tmpl("room_tmpl", obj)).click(eventUserlist).insertBefore('#nav-break-room');
  } else {
    $('nav > .nav').append( $(tmpl("conv_tmpl", obj)).click(eventUserlist) );
  }
  
  $('.main-content').append(tmpl("messages_tmpl", obj));
  getMessages(obj.id, obj.type).siblings().hide();
  
  slideOpenUserlist( getRoomInNav(obj.id, obj.type) );

  getRoomInNav(obj.id, obj.type).find('.exit-room').click(roomCloseEvent);
}

function roomCloseEvent() {
  var roomNode = $(this).closest('li');
  var roomData = roomNode.data();

  // remove the room elements from the DOM
  roomNode.remove();
  getMessages(roomData.id, roomData.type).remove();

  // send a notification to the server
  socket.emit('leave room', roomData.id);

  // remove the room from the temporary storage
  if(currentRoom.id === roomData.id) {
    currentRoom = {};
  }
  delete rooms[roomData.id];

  // prevent the click event to bubble up to the list element
  event.stopPropagation();
}

function eventUserlist() {
  slideOpenUserlist(this);
}

function slideOpenUserlist(selector) {
  var siblings;
  var element = $(selector);

  var roomname = element.data('id');

  currentRoom = rooms[roomname];

  // update the header
  $('.main-header').text(currentRoom.name);

  getMessages(element.data('id'), element.data('type')).show();
  getMessages(element.data('id'), element.data('type')).siblings().hide();

  // find all siblings && and toogle their state
  siblings = element.siblings(".active");
  if(siblings) {
    siblings.toggleClass("active").find("> ul:visible").slideUp(250);
  }

  // slide elements up or down
  if(element.hasClass("active")) {
    element.children().next().slideUp(250);
  } else {
    element.children().next().slideDown(250);
  }

  // toggle their class afterwards
  element.toggleClass("active");

  if(element.next().is("ul")) {
    event.preventDefault();
  }
}

// Keyboard events
$(window).keydown(function (event) {
  // Auto-focus the current input when a key is typed
  if (!(event.ctrlKey || event.metaKey || event.altKey)) {
    $('#m').focus();
  }
});

$('#m').on('input', function() {
  updateTyping();
});

// typing event
// Updates the typing event
function updateTyping () {
  var room = currentRoom.id;

  if (!isTyping) {
    isTyping = true;
    socket.emit('typing', room);
  }
  lastTypingTime = (new Date()).getTime();

  setTimeout(function () {
    var typingTimer = (new Date()).getTime();
    var timeDiff = typingTimer - lastTypingTime;
    if (timeDiff >= 3000 && isTyping) {
      socket.emit('stop typing', room);
      isTyping = false;
    }
  }, 3000);
}

/*  ______   __  __    ____         _   _____ 
 * |  ____| |  \/  |  / __ \       | | |_   _|
 * | |__    | \  / | | |  | |      | |   | |  
 * |  __|   | |\/| | | |  | |  _   | |   | |  
 * | |____  | |  | | | |__| | | |__| |  _| |_ 
 * |______| |_|  |_|  \____/   \____/  |_____|
 */

$(function () {
  $('#emojipopover > .popover-content').append(getEmoji);
});

$('#emoji').click(function() {
  var element = $('#emoji');
  var offset = element.offset();
  var popover = $('#emojipopover');

  popover.css('top', offset.top - popover.height() - 3);
  popover.css('left', offset.left - popover.width() / 2 + element.width() + 1);
  $('#emojipopover').toggle();
});

// see -> http://stackoverflow.com/a/10615607/2199226
function fixedFromCharCode (codePt) {
    if (codePt > 0xFFFF) {
        codePt -= 0x10000;
        return String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 + (codePt & 0x3FF));
    }
    else {
        return String.fromCharCode(codePt);
    }
}

function getEmoji() {
  var emoji = ['0x1f600','0x1f601','0x1f602','0x1f603','0x1f604','0x1f605','0x1f606','0x1f607','0x1f609','0x1f60a','0x1f60b','0x1f60c','0x1f60d','0x1f60f','0x1f612','0x1f613','0x1f614','0x1f616','0x1f618','0x1f61a','0x1f61c','0x1f61d','0x1f61e','0x1f620','0x1f621','0x1f622','0x1f623','0x1f624','0x1f625','0x1f628','0x1f629','0x1f62a','0x1f62b','0x1f62d','0x1f630','0x1f631','0x1f632','0x1f633','0x1f635','0x1f637','0x1f638','0x1f639','0x1f63a','0x1f63b','0x1f63c','0x1f63d','0x1f63e','0x1f63f','0x1f640','0x1f645','0x1f646','0x1f647','0x1f648','0x1f649','0x1f64a','0x1f64b','0x1f64c','0x1f64d','0x1f64e','0x1f64f'];

  var string = '';
  for (var i = 0; i < emoji.length; i++) {
    string += '<span onClick="insertEmoji(\''+emoji[i]+'\')" class="emoji">' + fixedFromCharCode(emoji[i]) + '</span> '
  };

  return string;
}

function insertEmoji(code) {
  insertText(fixedFromCharCode(code));
}
// see -> http://stackoverflow.com/questions/1064089/inserting-a-text-where-cursor-is-using-javascript-jquery
function insertText(text) {
  var input = document.getElementById('m');
  if (input == undefined) { return; }
  var scrollPos = input.scrollTop;
  var pos = 0;
  var browser = ((input.selectionStart || input.selectionStart == "0") ? 
    "ff" : (document.selection ? "ie" : false ) );
  if (browser == "ie") { 
    input.focus();
    var range = document.selection.createRange();
    range.moveStart ("character", -input.value.length);
    pos = range.text.length;
  }
  else if (browser == "ff") { pos = input.selectionStart };

  var front = (input.value).substring(0, pos);  
  var back = (input.value).substring(pos, input.value.length); 
  input.value = front+text+back;
  pos = pos + text.length;
  if (browser == "ie") { 
    input.focus();
    var range = document.selection.createRange();
    range.moveStart ("character", -input.value.length);
    range.moveStart ("character", pos);
    range.moveEnd ("character", 0);
    range.select();
  }
  else if (browser == "ff") {
    input.selectionStart = pos;
    input.selectionEnd = pos;
    input.focus();
  }
  input.scrollTop = scrollPos;
}