import { useState, useEffect } from "react";
import io from "socket.io-client";
import JoinScreen from "./components/JoinScreen";
import GameScreen from "./components/GameScreen";

// --- SOCKET.IO CONNECTION ---
// ⚠️ Production: Render URL
const socket = io.connect("https://couple-game-cj16.onrender.com");
// Dev testing:
// const socket = io.connect("http://localhost:3001");

// --- AUDIO ASSETS ---
const AUDIO_WIN = new Audio(
  "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"
);
const AUDIO_LOSE = new Audio(
  "https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3"
);
const AUDIO_MOVE = new Audio(
  "https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3"
);
const AUDIO_MIRROR = new Audio(
  "https://assets.mixkit.co/active_storage/sfx/243/243-preview.mp3"
);
const AUDIO_SPEED = new Audio(
  "https://assets.mixkit.co/active_storage/sfx/1659/1659-preview.mp3"
);

AUDIO_MOVE.volume = 0.2;

function App() {
  const [room, setRoom] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [role, setRole] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [map, setMap] = useState([]);
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [winner, setWinner] = useState(false);
  const [gameOverMsg, setGameOverMsg] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [activeCurse, setActiveCurse] = useState(null);
  const [hasKey, setHasKey] = useState(false);

  const joinRoom = () => {
    if (room !== "") socket.emit("join_room", room);
  };
  const handleRestart = () => socket.emit("restart_game", room);
  const handleNextLevel = () => socket.emit("next_level", room);

  // --- CONTROLS LOGIC ---
  const movePlayer = (dir) => {
    if (role !== "walker" || !gameStarted || winner || gameOverMsg) return;

    let finalDir = dir;
    if (activeCurse === "MIRROR") {
      if (dir === "UP") finalDir = "DOWN";
      if (dir === "DOWN") finalDir = "UP";
      if (dir === "LEFT") finalDir = "RIGHT";
      if (dir === "RIGHT") finalDir = "LEFT";
    }

    AUDIO_MOVE.currentTime = 0;
    AUDIO_MOVE.play().catch(() => { });
    socket.emit("move_player", { roomCode: room, direction: finalDir });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp") movePlayer("UP");
      if (e.key === "ArrowDown") movePlayer("DOWN");
      if (e.key === "ArrowLeft") movePlayer("LEFT");
      if (e.key === "ArrowRight") movePlayer("RIGHT");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [role, gameStarted, room, winner, gameOverMsg, activeCurse]);

  // --- SOCKET EVENTS ---
  useEffect(() => {
    socket.on("room_joined", (data) => {
      setIsJoined(true);
      setRole(data.role);
    });

    socket.on("start_game", (data) => {
      setGameStarted(true);
      setMap(data.map);
      setPlayerPos(data.startPos);
      setCurrentLevel(data.level);
      setActiveCurse(null);
      setHasKey(false);
    });

    socket.on("update_position", (pos) => setPlayerPos(pos));
    socket.on("timer_update", (time) => setTimeLeft(time));
    socket.on("map_updated", (newMap) => setMap(newMap));
    socket.on("key_collected", () => setHasKey(true));

    socket.on("curse_triggered", (data) => {
      setActiveCurse(data.type);
      if (data.type === "MIRROR") AUDIO_MIRROR.play();
      if (data.type === "SPEED") AUDIO_SPEED.play();
    });
    socket.on("curse_ended", () => setActiveCurse(null));

    socket.on("game_won", () => {
      setWinner(true);
      AUDIO_WIN.play();
    });
    socket.on("game_over", (msg) => {
      setGameOverMsg(msg);
      AUDIO_LOSE.play();
    });
    socket.on("reset_game_state", () => {
      setWinner(false);
      setGameOverMsg("");
      setActiveCurse(null);
      setHasKey(false);
    });

    // (Optional) cleanups if needed:
    // return () => { socket.off(...) ... }
  }, []);

  const isCellVisible = (rowIndex, colIndex) => {
    if (role === "watcher" || winner || gameOverMsg) return true;
    const distanceX = Math.abs(colIndex - playerPos.x);
    const distanceY = Math.abs(rowIndex - playerPos.y);
    return distanceX <= 1 && distanceY <= 1;
  };

  if (!isJoined) {
    return <JoinScreen room={room} setRoom={setRoom} joinRoom={joinRoom} />;
  }

  // Waiting screen logic was inline in original:
  if (!gameStarted) {

    return (
      <GameScreen
        socket={socket}
        room={room}
        role={role}
        map={map}
        playerPos={playerPos}
        winner={winner}
        gameOverMsg={gameOverMsg}
        timeLeft={timeLeft}
        currentLevel={currentLevel}
        activeCurse={activeCurse}
        hasKey={hasKey}
        movePlayer={movePlayer}
        handleNextLevel={handleNextLevel}
        handleRestart={handleRestart}
        isCellVisible={isCellVisible}
        gameStarted={gameStarted} // Pass this
      />
    );
  }

  return (
    <GameScreen
      socket={socket}
      room={room}
      role={role}
      map={map}
      playerPos={playerPos}
      winner={winner}
      gameOverMsg={gameOverMsg}
      timeLeft={timeLeft}
      currentLevel={currentLevel}
      activeCurse={activeCurse}
      hasKey={hasKey}
      movePlayer={movePlayer}
      handleNextLevel={handleNextLevel}
      handleRestart={handleRestart}
      isCellVisible={isCellVisible}
      gameStarted={gameStarted}
    />
  );
}

export default App;
