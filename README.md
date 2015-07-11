# chat
multi room chat based on socket.io 1.3.x

# Features
* Multi room support - each user may be in multiple rooms simultaneously
* Userlist
* Changing names
* Private conversations
* Emojis

# Notes
This chat is a side project to experiment with socket.io. Therefore, it is neither feature complete nor perfect. Especially the frontend code and styling is a bit messy at the moment as I have not decided what to do with it yet.

However, it already incorporates sanitization of user input that is often neglected in socket.io chat implementations and examples.

# Installation
    npm install
  
# Run
    npm .
    
# Chat commands
    /set name NAME    - sets the user name
    /w NAME MESSAGE   - sends a private message to the named user
