// components/Leaderboard.tsx. <-AI assisted code->
import React from "react";
import { LeaderboardEntry } from "../types";

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  userId: string;
}

export default function Leaderboard({ leaderboard, userId }: LeaderboardProps) {
  return (
    <div className="w-full max-w-sm bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden flex flex-col h-[500px]">
      <div className="bg-black/40 p-6 border-b border-white/5">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>🏆</span> Live Standings
        </h2>
        <p className="text-xs text-slate-400 mt-1">Updates instantly via Redis</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {leaderboard.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-600 animate-spin"></div>
            <p className="text-sm">Waiting for scores...</p>
          </div>
        ) : (
          <ul className="space-y-2 p-2">
            {leaderboard.map((entry) => {
              const isMe = entry.userId === userId;
              return (
                <li
                  key={entry.userId}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                    isMe ? "bg-blue-500/20 border border-blue-500/30" : "bg-black/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold w-6 text-center ${
                        entry.rank === 1
                          ? "text-yellow-400"
                          : entry.rank === 2
                          ? "text-slate-300"
                          : entry.rank === 3
                          ? "text-amber-600"
                          : "text-slate-500"
                      }`}
                    >
                      #{entry.rank}
                    </span>
                    <span className={`font-medium ${isMe ? "text-blue-300" : "text-slate-200"}`}>
                      {entry.userId} {isMe && "(You)"}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white bg-white/10 px-3 py-1 rounded-lg">
                    {entry.score}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}