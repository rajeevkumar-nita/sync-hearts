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
    // In original code:
    // {!gameStarted ? ( ... Waiting for partner ... ) : ( ... Game ... )}
    // And surrounding usage of bgClass etc.
    // I should probably pass this "Waiting" state to GameScreen or handle it here.
    // The original code rendered the "Waiting" text inside the main container with `bgClass`.
    // So `GameScreen` is probably best place for the container and waiting text, 
    // OR we render a simple waiting div here reusing the container style.
    // Let's look at GameScreen component I made.
    // It renders `bgClass` container.
    // It renders `VoiceChat`.
    // It renders `map` if `gameStarted`??
    // My GameScreen I made ASSUMES `map` is valid?
    // Wait, my GameScreen has `{map.map...}` which would crash if map is empty/undefined?
    // In original, `map` is set in `start_game`.
    // So if `!gameStarted`, we shouldn't render `GameScreen`'s map part.
    // But `GameScreen` component I wrote handles the layout. 

    // I should probably modify `GameScreen` to assume game is started OR handle waiting state.
    // BUT, I'll just render the waiting screen here for simplicity if I didn't add waiting logic to GameScreen.

    // Actually, I put `VoiceChat` in `GameScreen`.
    // And `bgClass` logic is in `GameScreen`.
    // So if I don't render `GameScreen`, I lose the background styling.

    // Let's render GameScreen but pass a prop `gameStarted`.
    // I need to update GameScreen to handle `!gameStarted`.

    // Re-reading my `GameScreen` code from Step 66.
    // It does NOT check `gameStarted`. It goes straight to rendering `map`.
    // It renders `VoiceChat`.
    // It renders `activeCurse` banner.

    // So I need to update `GameScreen` to handle the waiting state.
    // OR I just handle it in App and duplicate the container style? 
    // Duplicating container style is bad.

    // I will update `GameScreen` to accept `gameStarted` prop.
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
