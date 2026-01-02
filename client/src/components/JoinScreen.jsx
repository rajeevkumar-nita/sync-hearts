const JoinScreen = ({ room, setRoom, joinRoom }) => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white font-sans px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 text-center">
                Sync Hearts 💖
            </h1>
            <div className="bg-gray-800 p-8 rounded-xl w-full max-w-sm text-center shadow-2xl border border-gray-700">
                <input
                    className="w-full p-3 rounded bg-gray-700 mb-4 text-center uppercase text-white font-bold tracking-widest outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="ENTER CODE"
                    value={room}
                    onChange={(e) => setRoom(e.target.value.toUpperCase())}
                />
                <button
                    onClick={joinRoom}
                    className="w-full bg-pink-600 hover:bg-pink-700 p-3 rounded font-bold transition-all transform active:scale-95"
                >
                    JOIN GAME
                </button>
            </div>
        </div>
    );
};

export default JoinScreen;
