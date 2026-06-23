// app/page.tsx. <AI refactored code >
"use client";

import { useState, useEffect } from "react";
import "./globals.css";
import { QUIZ_QUESTIONS } from "./constants";
import { useQuizSocket } from "../hooks/useQuizSocket";

// Components
import Lobby from "./components/Lobby";
import QuizCard from "./components/QuizCard";
import Leaderboard from "./components/Leaderboard";

export default function Home() {
  // 1. Core State
  const [userId, setUserId] = useState("");
  const [quizIdInput, setQuizIdInput] = useState("");
  const [activeQuizId, setActiveQuizId] = useState("");

  // 2. Quiz Logic State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // 3. Initialize Custom Hook
  const { socket, isConnected, leaderboard, errorMessage } = useQuizSocket(userId);

  // Generate User ID only once on mount
  useEffect(() => {
    setUserId("User_" + Math.random().toString(36).substring(2, 6).toUpperCase());
  }, []);

  // --- Handlers ---
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
      // User checks their answer
      socket.emit("submit_answer", {
        quizId: activeQuizId,
        userId,
        isCorrect: selectedOption.isCorrect,
        points: selectedOption.isCorrect ? 10 : 0,
      });
      setIsRevealed(true);
    } else if (isRevealed) {
      // User proceeds to the next question
      setSelectedOptionId(null);
      setIsRevealed(false);

      if (currentQuestionIdx < QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestionIdx((prev) => prev + 1);
      } else {
        alert("Quiz Complete! Great job.");
        // Optional: Reset state or redirect back to lobby here
      }
    }
  };

  // --- Render logic ---
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

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2D2A54] via-[#111026] to-[#0A0914] text-white p-6 font-sans flex flex-col items-center justify-center relative">
      
      {/* Dynamic Error Toast */}
      {errorMessage && (
        <div className="absolute top-4 bg-red-500 text-white px-6 py-3 rounded shadow-lg animate-pulse z-50">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl justify-center items-start">
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
    </div>
  );
}