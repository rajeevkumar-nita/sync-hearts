const { rooms } = require("../state/gameState");
const { getLevelConfig, generateSolvableMap } = require("../utils/mapUtils");
const { startRoomTimer } = require("./gameController");

const joinRoom = (io, socket, roomCode) => {
    if (!rooms[roomCode]) {
        const startLevel = 1;
        const config = getLevelConfig(startLevel);
        rooms[roomCode] = {
            players: [],
            level: startLevel,
            map: generateSolvableMap(config),
            position: { x: 1, y: 1 },
            timeLeft: config.time,
            timerInterval: null,
            isCursed: false,
            activeCurseType: null,
            hasKey: false,
            voiceReady: {},
        };
    }

    const room = rooms[roomCode];

    if (room.players.length >= 2) {
        socket.emit("error_message", "Room Full!");
        return;
    }

    socket.join(roomCode);
    room.players.push(socket.id);

    const role = room.players.length === 1 ? "walker" : "watcher";
    socket.emit("room_joined", { roomCode, role });

    if (room.players.length === 2) {
        // Start game
        startRoomTimer(io, roomCode);
        io.to(roomCode).emit("start_game", {
            map: room.map,
            startPos: { x: 1, y: 1 },
            level: room.level,
        });
    }
};

const disconnect = (socket) => {
    // Logic to handle cleanup if needed
    // Currently empty in original code but good to have the structure
};

module.exports = { joinRoom, disconnect };
