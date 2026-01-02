const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { initSocket } = require("./socket/socketManager");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Initialize Socket Manager
initSocket(io);

server.listen(3001, () => {
  console.log("SERVER RUNNING ON PORT 3001");
});
