const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');


const http = require('http');

const router = require('./router');

const app = express();
//app.use(cors());
app.use(router);


const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socketio(server);

const { addUser, removeUser, getUser, getUserInRoom } = require('./users');

io.on('connection',(socket)=>{
    
    socket.on('join',({name, room},callback)=>{     // event executed which was created in chat.js 
        const {error,user} = addUser({ id: socket.id, name, room});

        if(error) return callback(error);

        socket.join(user.room); 

        socket.emit('message',{             // event created 
            user : 'admin',   
            text : `Welcome to the room ${user.room.toUpperCase()}`
        });

        

        socket.broadcast.to(user.room).emit('message',{     // sending messages to everyone except that user
            user : 'admin', 
            text : `${user.name[0].toUpperCase()+user.name.slice(1)}, has joined`
        });

        io.to(user.room).emit('activeUsers',{
            room : user.room,
            users : getUserInRoom(user.room)
        });
    
         

        callback();
    });

    /*socket.on('activeUsers',({name,room},callback)=>{
        const user = getUser(socket.id);
        //console.log(name);
        io.to(room).emit('roomUsers',{id:1, name : name});
        callback();
    });*/

    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id);
        
        io.to(user.room).emit('message',{user:user.name, text : message});

        callback();  
    });

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id);
        console.log(user)
    if(user) {
      io.to(user.room).emit('message', { user: 'admin', text: `${user.name[0].toUpperCase()+user.name.slice(1)} has left.` });
      io.to(user.room).emit('activeUsers', { room: user.room, users: getUserInRoom(user.room)});
    }
    });
});


app.use(router);
server.listen(PORT, () =>console.log(`Server has started on ${PORT}`));