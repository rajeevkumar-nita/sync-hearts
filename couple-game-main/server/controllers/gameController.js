const { rooms } = require("../state/gameState");
const { getLevelConfig, generateSolvableMap, ROWS, COLS } = require("../utils/mapUtils");

// --- CHAOS LOGIC ---
function triggerRandomCurse(io, roomCode) {
    const room = rooms[roomCode];
    if (!room || room.isCursed) return;

    room.isCursed = true;

    const curseType = Math.random() < 0.5 ? "MIRROR" : "SPEED";
    room.activeCurseType = curseType;

    const duration = Math.min(8, 4 + Math.floor(room.level / 2));

    io.to(roomCode).emit("curse_triggered", { type: curseType, duration });

    setTimeout(() => {
        if (rooms[roomCode]) {
            rooms[roomCode].isCursed = false;
            rooms[roomCode].activeCurseType = null;
            io.to(roomCode).emit("curse_ended");
        }
    }, duration * 1000);
}

// --- TIMER LOGIC ---
function startRoomTimer(io, roomCode) {
    const room = rooms[roomCode];
    if (!room) return;
    if (room.timerInterval) clearInterval(room.timerInterval);

    const config = getLevelConfig(room.level);
    room.timeLeft = config.time;

    room.timerInterval = setInterval(() => {
        if (!rooms[roomCode]) return clearInterval(room.timerInterval);

        room.timeLeft -= 1;
        io.to(roomCode).emit("timer_update", room.timeLeft);

        const checkInterval = room.level >= 5 ? 3 : 5;

        if (
            room.timeLeft % checkInterval === 0 &&
            room.timeLeft > 3 &&
            room.timeLeft < config.time
        ) {
            let curseProbability = 0.25 + room.level * 0.05;
            if (curseProbability > 0.9) curseProbability = 0.9;

            if (Math.random() < curseProbability) {
                triggerRandomCurse(io, roomCode);
            }
        }

        if (room.timeLeft <= 0) {
            clearInterval(room.timerInterval);
            io.to(roomCode).emit(
                "game_over",
                "⏳ TIME'S UP! The darkness consumed you."
            );
        }
    }, 1000);
}

// --- GAME ACTIONS ---
const movePlayer = (io, { roomCode, direction }) => {
    const room = rooms[roomCode];
    if (!room || room.timeLeft <= 0) return;

    const stepsToMove = room.activeCurseType === "SPEED" ? 2 : 1;

    for (let i = 0; i < stepsToMove; i++) {
        let { x, y } = room.position;
        if (direction === "UP") y -= 1;
        if (direction === "DOWN") y += 1;
        if (direction === "LEFT") x -= 1;
        if (direction === "RIGHT") x += 1;

        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
            const currentMap = room.map;
            const cell = currentMap[y][x];

            if (cell === 1) break;
            if (cell === 4 && !room.hasKey) break;

            room.position = { x, y };

            if (cell === 5) {
                room.hasKey = true;
                currentMap[y][x] = 0;
                io.to(roomCode).emit("key_collected");
                io.to(roomCode).emit("map_updated", currentMap);
            }

            if (cell === 3) {
                clearInterval(room.timerInterval);
                room.position = { x: 1, y: 1 };
                room.hasKey = false;
                const msg =
                    room.activeCurseType === "SPEED"
                        ? "⚡ TOO FAST! You ran into a trap!"
                        : "💣 BOOM! Trap hit!";
                io.to(roomCode).emit("game_over", msg);
                io.to(roomCode).emit("update_position", room.position);
                return;
            }

            if (cell === 9) {
                clearInterval(room.timerInterval);
                io.to(roomCode).emit("game_won", true);
                return;
            }
        }
    }
    io.to(roomCode).emit("update_position", room.position);
};

const restartGame = (io, roomCode) => {
    const room = rooms[roomCode];
    if (room) {
        const config = getLevelConfig(room.level);
        room.map = generateSolvableMap(config);
        room.position = { x: 1, y: 1 };
        room.isCursed = false;
        room.activeCurseType = null;
        room.hasKey = false;
        startRoomTimer(io, roomCode);
        io.to(roomCode).emit("start_game", {
            map: room.map,
            startPos: room.position,
            level: room.level,
        });
        io.to(roomCode).emit("reset_game_state");
    }
};

const nextLevel = (io, roomCode) => {
    const room = rooms[roomCode];
    if (room) {
        room.level += 1;
        const config = getLevelConfig(room.level);
        room.map = generateSolvableMap(config);
        room.position = { x: 1, y: 1 };
        room.isCursed = false;
        room.activeCurseType = null;
        room.hasKey = false;
        startRoomTimer(io, roomCode);
        io.to(roomCode).emit("start_game", {
            map: room.map,
            startPos: room.position,
            level: room.level,
        });
        io.to(roomCode).emit("reset_game_state");
    }
};

module.exports = { startRoomTimer, movePlayer, restartGame, nextLevel };
