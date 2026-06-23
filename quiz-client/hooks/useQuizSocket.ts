// <Ai Assisted react hook>

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { LeaderboardEntry } from "../app/types";

const SERVER_URL = "http://localhost:3001";

export function useQuizSocket(userId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Prevent double-initialization in React Strict Mode
    if (!socketRef.current) {
      socketRef.current = io(SERVER_URL, {
        reconnectionAttempts: 5, // Automatically try to reconnect if dropped
        reconnectionDelay: 1000,
      });
    }

    const socket = socketRef.current;

    socket.on("connect", () => {
      setIsConnected(true);
      setErrorMessage(null);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("leaderboard_update", (data: LeaderboardEntry[]) => {
      setLeaderboard(data);
    });

    // Handle server-side errors (e.g., database transaction failed)
    socket.on("error_message", (data: { message: string }) => {
      setErrorMessage(data.message);
      // Auto-clear error after 3 seconds
      setTimeout(() => setErrorMessage(null), 3000); 
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { socket: socketRef.current, isConnected, leaderboard, errorMessage };
}