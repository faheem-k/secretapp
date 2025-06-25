const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("signal", ({ roomId, data }) => {
    socket.to(roomId).emit("signal", data);
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log("Server listening on http://0.0.0.0:3000");
});

