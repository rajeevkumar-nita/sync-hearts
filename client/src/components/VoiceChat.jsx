
import { useState, useEffect, useRef } from "react";

if (typeof window !== "undefined") {
  window.global = window;
  window.process = { env: {} };
  window.Buffer = window.Buffer || [];
}

const VoiceChat = ({ socket, roomCode, myRole }) => {
  const [stream, setStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const userAudio = useRef(null);
  const connectionRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const initVoice = async () => {
      try {
        const module = await import("simple-peer");
        const Peer = module.default;

        const currentStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });

        if (!isMounted) {
          currentStream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = currentStream;
        setStream(currentStream);

        socket.emit("voice_ready", roomCode);

        socket.on("all_users_connected", (targetID) => {
          console.log("Both users voice-ready. Initiating call to:", targetID);
          createPeer(Peer, targetID, socket.id, currentStream);
        });

        socket.on("user_joined_call", (payload) => {
          console.log("Incoming call signal received.");
          addPeer(Peer, payload.signal, payload.callerID, currentStream);
        });

        socket.on("receiving_returned_signal", (payload) => {
          console.log("Call accepted by partner.");
          connectionRef.current?.signal(payload.signal);
        });
      } catch (err) {
        console.error("VoiceChat error:", err);
      }
    };

    initVoice();

    return () => {
      isMounted = false;
      socket.off("all_users_connected");
      socket.off("user_joined_call");
      socket.off("receiving_returned_signal");

      connectionRef.current?.destroy();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [roomCode, socket]);

  // 🔊 apply volume on remote audio
  useEffect(() => {
    if (userAudio.current) {
      userAudio.current.volume = volume;
    }
  }, [volume]);

  const createPeer = (Peer, userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("sending_signal", { userToSignal, callerID, signal });
    });

    peer.on("stream", (remoteStream) => {
      if (userAudio.current) {
        userAudio.current.srcObject = remoteStream;
      }
    });

    connectionRef.current = peer;
  };

  const addPeer = (Peer, incomingSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returning_signal", { signal, callerID });
    });

    peer.on("stream", (remoteStream) => {
      if (userAudio.current) {
        userAudio.current.srcObject = remoteStream;
      }
    });

    peer.signal(incomingSignal);
    connectionRef.current = peer;
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  };

  const handleVolumeChange = (e) => {
    const v = Number(e.target.value) / 100;
    setVolume(v);
  };

  const volumeIcon =
    volume === 0 ? "🔇" : volume < 0.4 ? "🔈" : volume < 0.8 ? "🔉" : "🔊";

  return (
    <>
      {/* remote audio (partner) */}
      <audio playsInline autoPlay ref={userAudio} />

      <div
        className={`
          z-50 flex items-center gap-3 bg-gray-900/80 px-4 py-3 rounded-2xl shadow-lg 
          border border-gray-700 backdrop-blur text-xs sm:text-sm

          w-full justify-center mt-3
          md:w-auto md:mt-0 md:fixed md:bottom-4 md:right-4
        `}
      >
        {/* status badge */}
        <div
          className={`px-3 py-2 rounded-full border-2 font-bold flex items-center gap-2 ${
            stream
              ? "bg-gray-800 border-green-500 text-green-400"
              : "bg-gray-800 border-red-500 text-red-500"
          }`}
        >
          {stream ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span>{isMuted ? "Muted" : "Voice Active"}</span>
            </>
          ) : (
            <span>Loading...</span>
          )}
        </div>

        {/* mute button */}
        {stream && (
          <button
            onClick={toggleMute}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-full text-white font-semibold shadow-md transition-all active:scale-95 border border-gray-500"
          >
            {isMuted ? "🎙️ Unmute" : "🔇 Mute"}
          </button>
        )}

        {/* volume slider */}
        {stream && (
          <div className="flex items-center gap-2 min-w-[110px] sm:min-w-[130px]">
            <span className="text-lg">{volumeIcon}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={handleVolumeChange}
              className="w-20 sm:w-24 accent-pink-500"
            />
          </div>
        )}
      </div>
    </>
  );
};

export default VoiceChat;