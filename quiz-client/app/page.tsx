// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import "./globals.css";
import { QUIZ_QUESTIONS } from "./constants";
import { LeaderboardEntry } from "./types";

// Import our new components
import Lobby from "./components/Lobby";
import QuizCard from "./components/QuizCard";
import Leaderboard from "./components/Leaderboard";

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState("");

  const [quizIdInput, setQuizIdInput] = useState("");
  const [activeQuizId, setActiveQuizId] = useState("");

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const generatedUserId = "User_" + Math.random().toString(36).substring(2, 6).toUpperCase();
    setUserId(generatedUserId);

    const newSocket = io("http://localhost:3000");

    newSocket.on("connect", () => setIsConnected(true));
    newSocket.on("disconnect", () => setIsConnected(false));

    newSocket.on("leaderboard_update", (data: LeaderboardEntry[]) => {
      setLeaderboard(data);
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleJoinQuiz = () => {
    if (socket && quizIdInput.trim() !== "") {
      socket.emit("join_quiz", { quizId: quizIdInput, userId });
      setActiveQuizId(quizIdInput);
    }
  };

 const handleCreateQuiz = () => {
    if (socket) {
      const newQuizId = "QUIZ_" + Math.random().toString(36).substring(2, 6).toUpperCase();
      socket.emit("join_quiz", { quizId: newQuizId, userId });
      setQuizIdInput(newQuizId);
      setActiveQuizId(newQuizId);
    }
  };

  const handleActionClick = () => {
    if (!selectedOptionId || !socket || !activeQuizId) return;

    const currentQuestion = QUIZ_QUESTIONS[currentQuestionIdx];
    const selectedOption = currentQuestion.options.find((o) => o.id === selectedOptionId);

    if (!isRevealed && selectedOption) {
      socket.emit("submit_answer", {
        quizId: activeQuizId,
        userId,
        isCorrect: selectedOption.isCorrect,
        points: selectedOption.isCorrect ? 10 : 0,
      });
      setIsRevealed(true);
    } else if (isRevealed) {
      setSelectedOptionId(null);
      setIsRevealed(false);

      if (currentQuestionIdx < QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestionIdx((prev) => prev + 1);
      } else {
        alert("Quiz Complete! Great job.");
      }
    }
  };

  // Render the Lobby if not in a room
  if (!activeQuizId) {
    return (
      <Lobby
        userId={userId}
        isConnected={isConnected}
        quizIdInput={quizIdInput}
        setQuizIdInput={setQuizIdInput}
        handleJoinQuiz={handleJoinQuiz}
        handleCreateQuiz={handleCreateQuiz}
      />
    );
  }

  // Render the Active Game Arena
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2D2A54] via-[#111026] to-[#0A0914] text-white p-6 font-sans flex flex-col md:flex-row gap-8 items-center justify-center">
      <QuizCard
        currentQuestionIdx={currentQuestionIdx}
        totalQuestions={QUIZ_QUESTIONS.length}
        activeQuizId={activeQuizId}
        currentQ={QUIZ_QUESTIONS[currentQuestionIdx]}
        selectedOptionId={selectedOptionId}
        setSelectedOptionId={setSelectedOptionId}
        isRevealed={isRevealed}
        handleActionClick={handleActionClick}
      />
      <Leaderboard leaderboard={leaderboard} userId={userId} />
    </div>
  );
}