import VoiceChat from "./VoiceChat";

const GameScreen = ({
    socket,
    room,
    role,
    map,
    playerPos,
    winner,
    gameOverMsg,
    timeLeft,
    currentLevel,
    activeCurse,
    hasKey,
    movePlayer,
    handleNextLevel,
    handleRestart,
    isCellVisible,
    gameStarted,
}) => {
    const bgClass =
        activeCurse === "MIRROR"
            ? "bg-red-900"
            : activeCurse === "SPEED"
                ? "bg-blue-900"
                : "bg-gray-900";
    const bannerColor = activeCurse === "MIRROR" ? "bg-red-600" : "bg-blue-600";
    const borderClass =
        activeCurse === "MIRROR"
            ? "border-red-500 shadow-red-500/50"
            : activeCurse === "SPEED"
                ? "border-blue-500 shadow-blue-500/50"
                : "border-gray-700";

    return (
        <div
            className={`flex flex-col items-center justify-center min-h-screen text-white select-none relative overflow-hidden pb-10 transition-colors duration-500 ${bgClass}`}
        >
            {activeCurse && (
                <div className="absolute top-20 z-50 animate-bounce">
                    <div
                        className={`text-white px-6 py-3 rounded-full font-bold shadow-lg border-4 border-white text-xl md:text-2xl ${bannerColor}`}
                    >
                        {activeCurse === "MIRROR"
                            ? "⚠️ CURSE: CONTROLS REVERSED! ⚠️"
                            : "⚡ CURSE: SPEED DEMON (2x)! ⚡"}
                    </div>
                </div>
            )}

            <div className="mt-4 mb-2 text-center px-4 w-full max-w-lg">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-left">
                        <h2
                            className={`text-lg font-bold ${role === "walker" ? "text-blue-400" : "text-green-400"
                                }`}
                        >
                            {role === "walker" ? "🚶 WALKER" : "👀 WATCHER"}
                        </h2>
                        <p className="text-yellow-400 font-bold text-sm">
                            ⭐ LEVEL {currentLevel}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div
                            className={`text-3xl transition-all ${hasKey ? "opacity-100 scale-125" : "opacity-20 grayscale"
                                }`}
                        >
                            🔑
                        </div>
                        <div
                            className={`text-2xl font-mono font-bold border-2 px-3 rounded ${timeLeft < 10
                                    ? "text-red-500 border-red-500 animate-pulse"
                                    : "text-white border-gray-500"
                                }`}
                        >
                            ⏳ {timeLeft}s
                        </div>
                    </div>
                </div>
            </div>

            {!gameStarted ? (
                <div className="animate-pulse text-yellow-400 font-mono text-xl mt-10">
                    Waiting for partner...
                </div>
            ) : (
                <>
                    <VoiceChat socket={socket} roomCode={room} myRole={role} />

                    <div
                        className={`grid gap-1 bg-gray-800 p-2 rounded-lg border-4 shadow-2xl touch-none ${borderClass}`}
                        style={{
                            gridTemplateColumns: `repeat(${map[0]?.length || 10
                                }, minmax(30px, 40px))`,
                        }}
                    >
                        {map.map((row, rowIndex) =>
                            row.map((cell, colIndex) => {
                                const isPlayerHere =
                                    playerPos.x === colIndex && playerPos.y === rowIndex;
                                const visible = isCellVisible(rowIndex, colIndex);
                                let cellClass =
                                    "aspect-square rounded-sm flex items-center justify-center text-lg md:text-xl transition-all duration-200 ";
                                let content = "";

                                if (!visible) {
                                    cellClass += "bg-black border border-gray-900";
                                } else {
                                    if (cell === 1) {
                                        cellClass += "bg-slate-600 shadow-inner";
                                        content = "🧱";
                                    } else if (cell === 9) {
                                        cellClass += "bg-yellow-500 animate-pulse";
                                        content = "🏆";
                                    } else if (cell === 3) {
                                        if (role === "watcher" || winner || gameOverMsg) {
                                            cellClass += "bg-red-900/50 border border-red-500";
                                            content = "💣";
                                        } else {
                                            cellClass += "bg-slate-200";
                                            content = "";
                                        }
                                    } else if (cell === 5) {
                                        cellClass +=
                                            "bg-blue-900/50 border border-blue-400 animate-bounce";
                                        content = "🔑";
                                    } else if (cell === 4) {
                                        cellClass += hasKey
                                            ? "bg-green-800/50 border-green-500"
                                            : "bg-slate-700 border-4 border-yellow-600";
                                        content = hasKey ? "🔓" : "🔒";
                                    } else {
                                        cellClass += "bg-slate-200";
                                        content = "";
                                    }
                                }
                                return (
                                    <div key={`${rowIndex}-${colIndex}`} className={cellClass}>
                                        {isPlayerHere ? (
                                            <span className="text-xl md:text-2xl animate-bounce drop-shadow-md">
                                                {role === "walker" ? "🤖" : "🔵"}
                                            </span>
                                        ) : (
                                            content
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {role === "walker" && !winner && !gameOverMsg && (
                        <div className="mt-6 grid grid-cols-3 gap-2 w-48">
                            <div></div>
                            <button
                                className={`p-4 rounded-lg active:bg-blue-600 shadow-lg text-2xl ${activeCurse === "MIRROR"
                                        ? "bg-red-600"
                                        : activeCurse === "SPEED"
                                            ? "bg-blue-600"
                                            : "bg-gray-700"
                                    }`}
                                onClick={() => movePlayer("UP")}
                            >
                                ⬆️
                            </button>
                            <div></div>
                            <button
                                className={`p-4 rounded-lg active:bg-blue-600 shadow-lg text-2xl ${activeCurse === "MIRROR"
                                        ? "bg-red-600"
                                        : activeCurse === "SPEED"
                                            ? "bg-blue-600"
                                            : "bg-gray-700"
                                    }`}
                                onClick={() => movePlayer("LEFT")}
                            >
                                ⬅️
                            </button>
                            <button
                                className={`p-4 rounded-lg active:bg-blue-600 shadow-lg text-2xl ${activeCurse === "MIRROR"
                                        ? "bg-red-600"
                                        : activeCurse === "SPEED"
                                            ? "bg-blue-600"
                                            : "bg-gray-700"
                                    }`}
                                onClick={() => movePlayer("DOWN")}
                            >
                                ⬇️
                            </button>
                            <button
                                className={`p-4 rounded-lg active:bg-blue-600 shadow-lg text-2xl ${activeCurse === "MIRROR"
                                        ? "bg-red-600"
                                        : activeCurse === "SPEED"
                                            ? "bg-blue-600"
                                            : "bg-gray-700"
                                    }`}
                                onClick={() => movePlayer("RIGHT")}
                            >
                                ➡️
                            </button>
                        </div>
                    )}
                </>
            )}

            {(winner || gameOverMsg) && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm px-4">
                    <div className="bg-gray-800 p-6 rounded-2xl border-2 border-pink-500 text-center shadow-2xl animate-bounce-in w-full max-w-sm">
                        {winner ? (
                            <>
                                <div className="text-6xl mb-4">🏆</div>
                                <h2 className="text-3xl font-bold text-yellow-400 mb-2">
                                    LEVEL {currentLevel} CLEARED!
                                </h2>
                                <button
                                    onClick={handleNextLevel}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition-transform hover:scale-105 shadow-lg w-full"
                                >
                                    🚀 Start Level {currentLevel + 1}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="text-6xl mb-4">💥</div>
                                <h2 className="text-3xl font-bold text-red-500 mb-2">
                                    GAME OVER
                                </h2>
                                <p className="text-gray-300 mb-6">{gameOverMsg}</p>
                                <button
                                    onClick={handleRestart}
                                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-full transition-transform hover:scale-105 shadow-lg w-full"
                                >
                                    🔄 Retry Level {currentLevel}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameScreen;
