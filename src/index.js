const path = require('path');
const http = require('http');
const express = require('express')
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage,generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server);


const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname,'../public');

app.use(express.static(publicDirectoryPath));


io.on('connection',(socket)=>{
    console.log('new websocket connection')

    socket.on('join',({username,room}, callback)=>{
       const {error,user} = addUser({
            id: socket.id,
            username,
            room
        })

        if(error){
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message',generateMessage('server','welcome!'));
        socket.broadcast.to(user.room).emit('message',generateMessage('server',`${user.username} has joined the chat`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback();
    })




    socket.on('sendMessage',(msg,callback)=>{
        const user = getUser(socket.id);
        const filter = new Filter()

        if(filter.isProfane(msg)){
            return callback('profanity is not allowed')
        }
        io.to(user.room).emit('message',generateMessage(user.username,msg));
        callback('delivered');
    })

    

    socket.on('disconnect',() => {
        const user = removeUser(socket.id);

        if(user){
            io.to(user.room).emit('message',generateMessage('server',`${user.username} left the room!`));
            io.to(user.room).emit('roomData',{
                room:user.room,
                users: getUsersInRoom(user.room)
            })
        }    
    })

    socket.on('sendLocation',(cords,callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${cords.lat},${cords.long}`));
        callback();
    })

})

server.listen(port,()=>{console.log('server listening on port ',port)})
