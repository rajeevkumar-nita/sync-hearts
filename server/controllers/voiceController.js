const { rooms } = require("../state/gameState");

const voiceReady = (io, socket, roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;

    if (!room.voiceReady) room.voiceReady = {};
    room.voiceReady[socket.id] = true;

    console.log(`Voice ready: ${socket.id} in room ${roomCode}`);

    if (room.players.length === 2) {
        const [firstPlayerID, secondPlayerID] = room.players;

        if (room.voiceReady[firstPlayerID] && room.voiceReady[secondPlayerID]) {
            console.log(
                `Both players voice-ready in room ${roomCode}. Starting WebRTC handshake.`
            );
            io.to(firstPlayerID).emit("all_users_connected", secondPlayerID);
        }
    }
};

const sendingSignal = (io, socket, payload) => {
    io.to(payload.userToSignal).emit("user_joined_call", {
        signal: payload.signal,
        callerID: payload.callerID,
    });
};

const returningSignal = (io, socket, payload) => {
    io.to(payload.callerID).emit("receiving_returned_signal", {
        signal: payload.signal,
        id: socket.id,
    });
};

module.exports = { voiceReady, sendingSignal, returningSignal };
