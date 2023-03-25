const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const app = express();

const PORT = process.env.PORT || 3050;

const server = http.createServer(app);

const io = socketio(server);

app.use(express.json());

let users = [];

app.get('/', (req, res) => {
    res.send("Server runnsing");
});
io.on("connection", socket => {

    console.log(socket.id + ' connected');
    socket.on('connectUser', userData => {
        const index = users.findIndex((e) => e.username === userData.username);
        if (index == -1) {
            users.push(userData);
            socket.userName = userData.userName;
            socket.join(userData.username);
            console.log(userData.username + " user registered on the name room 1");
            socket.emit('user-registered', userData);
            io.emit('users', users);
        } else {
            socket.emit("username-already-exist", userData);
        }
    });

    socket.on('call-user', data => {
        console.log("Call User --> from:" + data.from.username + "   to:" + data.to.username);
        io.to(data.to.username).emit('call-made', data);
    });

    socket.on('make-answer', data => {
        console.log("Make Answer --> from:" + data.from.username + "   to:" + data.to.username);
        io.to(data.to.username).emit('answer-made', data);
    });

    socket.on('ice-candidate', data => {
        console.log("Ice Candidate --> from:" + data.from.username + "   to:" + data.to.username);
        io.to(data.to.username).emit('ice-candidate', data);
    });

    socket.on('hangup', data => {
        console.log("Hangup --> from:" + data.from.username + "   to:" + data.to.username);
        io.to(data.to.username).emit('hangup', data);
        io.to(data.from.username).emit('hangup', data);
    });

    socket.on('busy', data => {
        console.log("Hangup --> from:" + data.from.username + "   to:" + data.to.username);
        io.to(data.to.username).emit('busy', data);
        io.to(data.from.username).emit('busy', data);
    });

    
    socket.on("update-user", updateData => {
        users.map((user)=>{
            console.log(user.username)
            if (user.username == updateData.userName) {
                user.active = updateData.status;
            }
        })
        io.emit("users", users.filter(user => user.active === true));
    });

    socket.on("user-in-call", updateData => {
        users.map((user)=>{
            console.log(user.username)
            if (user.username == updateData.userName) {
                user.incall = updateData.callStatus;
            }
        })
        io.emit("users", users.filter(user => user.active === true && user.incall === false));
    });
    
    socket.on('disconnect', () => {
        console.log(socket.userName + ' disconnected');
        users = users.filter(
            user => user.username !== socket.userName
        );
        io.emit('users', users);
    });
});

server.listen(PORT, () => console.log("Server running on port " + PORT)); 
