// components/Lobby.tsx <-AI assisted code->
import React from "react";

interface LobbyProps {
  userId: string;
  isConnected: boolean;
  quizIdInput: string;
  setQuizIdInput: (id: string) => void;
  handleJoinQuiz: () => void;
  handleCreateQuiz: () => void;
}

export default function Lobby({
  userId,
  isConnected,
  quizIdInput,
  setQuizIdInput,
  handleJoinQuiz,
  handleCreateQuiz,
}: LobbyProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2D2A54] via-[#111026] to-[#0A0914] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-md space-y-8 bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ELSA Arena
          </h1>
          <p className="text-slate-400">
            Your ID: <span className="font-mono text-white">{userId}</span>
          </p>
          <div className={`text-sm font-medium ${isConnected ? "text-green-400" : "text-red-400"}`}>
            {isConnected ? "🟢 Connected to Server" : "🔴 Disconnected"}
          </div>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={quizIdInput}
            onChange={(e) => setQuizIdInput(e.target.value.toUpperCase())}
            placeholder="Enter Quiz Code"
            className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center text-xl tracking-widest uppercase transition-all placeholder:text-slate-600"
          />
          <button
            onClick={handleJoinQuiz}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.5)]"
          >
            Join Existing Quiz
          </button>
          <div className="relative py-2 flex items-center justify-center">
            <div className="absolute border-t border-white/10 w-full"></div>
            <span className="bg-[#15142b] px-4 text-xs text-slate-500 relative">OR</span>
          </div>
          <button
            onClick={handleCreateQuiz}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl border border-white/5 transition-all"
          >
            Join new Quiz
          </button>
        </div>
      </div>
    </div>
  );
}