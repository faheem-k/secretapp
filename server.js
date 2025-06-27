const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Track active rooms and users
const rooms = new Map();
const userRooms = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    userRooms.set(socket.id, roomId);
    
    // Track room participants
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);
    
    console.log(`User ${socket.id} joined room: ${roomId}`);
    console.log(`Room ${roomId} now has ${rooms.get(roomId).size} participants`);
    
    // Notify room about participant count
    io.to(roomId).emit("room-info", {
      participantCount: rooms.get(roomId).size,
      roomId: roomId
    });
  });

  socket.on("signal", ({ roomId, data }) => {
    // Forward the signal to other users in the room
    socket.to(roomId).emit("signal", data);
    
    console.log(`Signal forwarded in room ${roomId}: ${data.type}`);
  });

  socket.on("disconnect", () => {
    const roomId = userRooms.get(socket.id);
    
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).delete(socket.id);
      
      // Clean up empty rooms
      if (rooms.get(roomId).size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
      } else {
        // Notify remaining participants
        io.to(roomId).emit("room-info", {
          participantCount: rooms.get(roomId).size,
          roomId: roomId
        });
      }
    }
    
    userRooms.delete(socket.id);
    console.log(`User disconnected: ${socket.id}`);
  });

  // Handle typing indicators
  socket.on("typing", (roomId) => {
    socket.to(roomId).emit("user-typing", socket.id);
  });

  socket.on("stop-typing", (roomId) => {
    socket.to(roomId).emit("user-stopped-typing", socket.id);
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    activeRooms: rooms.size,
    totalConnections: io.engine.clientsCount,
    uptime: process.uptime()
  });
});

// API endpoint to get room info
app.get("/api/room/:roomId", (req, res) => {
  const roomId = req.params.roomId;
  const room = rooms.get(roomId);
  
  res.json({
    exists: !!room,
    participantCount: room ? room.size : 0,
    roomId: roomId
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 QuantumChat Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check available at http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});