const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// Global variables to hold all usernames and rooms created
var usernames = {};
var rooms = [
  { name: "global", creator: "Anonymous" },
  { name: "chess", creator: "Anonymous" },
];

io.on("connection", function (socket) {
  console.log(`Usuario conectado al servidor.`);

  socket.on("createUser", function (username) {
    socket.username = username;
    usernames[username] = username;
    socket.currentRoom = "global";
    socket.join("global");

    console.log(`Usuario ${username} creado en el servidor de manera exitosa.`);

    socket.emit("updateChat", "INFO", "Te uniste a la sala GLOBAL");
    socket.broadcast
      .to("global")
      .emit("updateChat", "INFO", username + " se ha unido a sala GLOBAL");
    io.sockets.emit("updateUsers", usernames);
    socket.emit("updateRooms", rooms, "global");
  });

  socket.on("sendMessage", function (data) {
    io.sockets.to(socket.currentRoom).emit("updateChat", socket.username, data);
  });

  socket.on("createRoom", function (room) {
    if (room != null) {
      rooms.push({ name: room, creator: socket.username });
      io.sockets.emit("updateRooms", rooms, null);
    }
  });

  socket.on("updateRooms", function (room) {
    socket.broadcast
      .to(socket.currentRoom)
      .emit("updateChat", "INFO", socket.username + " dejó la sala.");
    socket.leave(socket.currentRoom);
    socket.currentRoom = room;
    socket.join(room);
    socket.emit("updateChat", "INFO", "Te uniste a la sala  " + room);
    socket.broadcast
      .to(room)
      .emit(
        "updateChat",
        "INFO",
        socket.username + " has joined " + room + " room"
      );
  });

  socket.on("disconnect", function () {
    console.log(`User ${socket.username} se desonectó del servidor.`);
    delete usernames[socket.username];
    io.sockets.emit("updateUsers", usernames);
    socket.broadcast.emit(
      "updateChat",
      "INFO",
      socket.username + " se desconectó"
    );
  });
});

server.listen(5002, function () {
  console.log("Listening to port 5002.");
});
