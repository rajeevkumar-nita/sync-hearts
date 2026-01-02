const roomController = require("../controllers/roomController");
const gameController = require("../controllers/gameController");
const voiceController = require("../controllers/voiceController");

const initSocket = (io) => {
    io.on("connection", (socket) => {
        console.log(`User Connected: ${socket.id}`);

        // Room Events
        socket.on("join_room", (roomCode) => roomController.joinRoom(io, socket, roomCode));
        socket.on("disconnect", () => roomController.disconnect(socket));

        // Game Events
        socket.on("move_player", (payload) => gameController.movePlayer(io, payload));
        socket.on("restart_game", (roomCode) => gameController.restartGame(io, roomCode));
        socket.on("next_level", (roomCode) => gameController.nextLevel(io, roomCode));

        // Voice Events
        socket.on("voice_ready", (roomCode) => voiceController.voiceReady(io, socket, roomCode));
        socket.on("sending_signal", (payload) => voiceController.sendingSignal(io, socket, payload));
        socket.on("returning_signal", (payload) => voiceController.returningSignal(io, socket, payload));
    });
};

module.exports = { initSocket };
