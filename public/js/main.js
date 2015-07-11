$(function() {
  registerCloseEvent();
  $( '#controls-joinroom' ).click(function() {
    joinRoom();
  });

  $('[data-toggle="popover"]').popover({
    html: true,
    content: getEmoji()
  });
});

var colors = ['#374752','#295f99','#ff7f00','#ffff00','#7f007f','#00a833','#ff0000','#994b00','#4C0F2A','#590b3f','#148366','#ff3f00','#7fd319','#bf003f','#224811','#196019','#542f8c','#ffbf00','#89c172','#ac251f'];

var socket = io();
$('form').submit(function(){
  var text = $('#m').val();
  var matches = text.match(/^(?:\/w )([^ ]*) (.*)/);

  if(matches !== null) {
    socket.emit('whisper', matches[1], matches[2]);
  } else {

    matches = text.match(/^\/([a-zA-Z-0-9]+) ([a-zA-Z0-9]+) ([^ ]+)$/);

    if(matches !== null) {
      if(matches[1].toLowerCase() === 'set' && matches[2].toLowerCase() === 'name') {
        socket.emit('set username', matches[3]);
      }
    } else {
      var dest = $("ul.nav-tabs li.active > a").attr('href').toLowerCase();
      if(dest.indexOf('#room') === 0) {
        dest = dest.slice(6, dest.length);
        socket.emit('message', dest, text);
      }
      else if(dest.indexOf('#conv') === 0) {
        dest = dest.slice(6, dest.length);
        socket.emit('whisper', dest, text);
      }
    }
  }

  $('#m').val('');
  return false;
});

socket.on('connect', function() {
  socket.emit('set username', prompt('What\'s your name?'));
});

socket.on('room joined', function(room) {
  createTab(room, true, true);
});

socket.on('message', function(room, user, time, msg) {
  var messages = $('#messages-' + room);
  messages.append('<li><span class="timestamp">' + formatTime(time) + '</span><span class="username" style="color: '+getColorForName(user)+';">'+user+':</span> '+msg+'</li>');
  messages.parent().scrollTop(messages.parent().prop("scrollHeight"));
});

socket.on('username set', function(username) {
  socket.name = username;
});

socket.on('userlist', function(room, users) {
  var userlist = $('#userlist-' + room);
  // clear userlist
  userlist.empty();

  // add users to userlist
  for (var i = users.length - 1; i >= 0; i--) {
    if(users[i] === socket.name) {
      userlist.append('<li>' + users[i] + '</li>');
    } else {
      userlist.append('<li onClick="createTab(\''+users[i]+'\', false, true);" class="openPrivateConversation">'+users[i]+'</li>');
    }
  };
});

socket.on('whisper from', function(user, time, msg) {
  var messages = $('#conv-messages-' + user.toLowerCase());

  if(!messages || messages.length === 0) {
    createTab( user, false, false);
    messages = $('#conv-messages-' + user.toLowerCase());
  }

  messages.append('<li><span class="timestamp">' + formatTime(time) + '</span><span class="username" style="color: '+getColorForName(user)+';">'+user+':</span> '+msg+'</li>');
  messages.parent().scrollTop(messages.parent().prop("scrollHeight"));
});

socket.on('whisper to', function(user, time, msg) {
  var messages = $('#conv-messages-' + user.toLowerCase());

  if(!messages || messages.length === 0) {
    createTab( user, false, true);
    messages = $('#conv-messages-' + user.toLowerCase());
  }

  messages.append('<li><span class="timestamp">' + formatTime(time) + '</span><span class="username" style="color: '+getColorForName(socket.name)+';">'+socket.name+':</span> '+msg+'</li>');
  messages.parent().scrollTop(messages.parent().prop("scrollHeight"));
});

socket.on('error message', function(time, message) {
  alert(message);
});

socket.on('room already joined', function(room) {
  $('.nav-tabs a[href="#room-' + room.toLowerCase() + '"]').tab('show');
});

function joinRoom() {
  socket.emit('join room', prompt('Which room do you want to join?'));
}

function registerCloseEvent() {
  $(".closeTab").click(function () {

    //there are multiple elements which has .closeTab icon so close the tab whose close icon is clicked
    var tabContentId = $(this).parent().attr("href");
    $(this).parent().parent().remove(); //remove li of tab
    $('ul.nav-tabs li:nth-last-child(2) a').tab('show'); // Select first tab
    $(tabContentId).remove(); //remove respective tab content

    socket.emit('leave room', tabContentId.slice(6, tabContentId.length));

  });
}

function createTab( name, isRoom, focus ) {
  focus = focus || false;
  var name_lc = name.toLowerCase();
  var idSnippet = (isRoom ? 'room-' : 'conv-') + name_lc;
  var messagesSnippet = (isRoom ? '' : 'conv-') + 'messages-' + name_lc;
  var cols = (isRoom ? 10 : 12);
  var userlistSnippet = '<div class="col-md-2"><ul id="userlist-' + name_lc + '" class="userlist"></ul></div>';
  var convIcon = isRoom ? '' : '<span class="glyphicon glyphicon-user" aria-hidden="true"></span>';

  // create tab content
  $('div.tab-content').append('<div role="tabpanel" class="tab-pane" id="' + idSnippet + '"><div class="col-md-'+cols+' fill"><ul id="' + messagesSnippet + '" class="messages"></ul></div>' + userlistSnippet + '</div>');
  // create tab nav
  $('#controls-joinroom').parent().before('<li role="presentation"><a href="#' + idSnippet + '" aria-controls="' + idSnippet + '" role="tab" data-toggle="tab"><button class="close closeTab" type="button" >×</button>' + convIcon + '&nbsp;' + name + '</a></li>');
  // register the close event
  registerCloseEvent();

  if(focus) {
    // activate tab
    $('.nav-tabs a[href="#' + idSnippet + '"]').tab('show');
  }
}

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