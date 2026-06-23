// components/QuizCard.tsx <-AI assisted code->
import React from "react";
import { Question } from "../types";

interface QuizCardProps {
  currentQuestionIdx: number;
  totalQuestions: number;
  activeQuizId: string;
  currentQ: Question;
  selectedOptionId: string | null;
  setSelectedOptionId: (id: string) => void;
  isRevealed: boolean;
  handleActionClick: () => void;
}

export default function QuizCard({
  currentQuestionIdx,
  totalQuestions,
  activeQuizId,
  currentQ,
  selectedOptionId,
  setSelectedOptionId,
  isRevealed,
  handleActionClick,
}: QuizCardProps) {
  const progressPercentage = ((currentQuestionIdx + 1) / totalQuestions) * 100;

  const isCorrectSelected =
    isRevealed && currentQ.options.find((o) => o.id === selectedOptionId)?.isCorrect;

  const buttonStyle = isRevealed
    ? isCorrectSelected
      ? "bg-green-600 hover:bg-green-500 text-white shadow-[0_4px_20px_rgba(34,197,94,0.4)]"
      : "bg-red-600 hover:bg-red-500 text-white shadow-[0_4px_20px_rgba(239,68,68,0.4)]"
    : selectedOptionId
    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)]"
    : "bg-white/5 text-slate-500 cursor-not-allowed";

  return (
    <div className="w-full max-w-md border border-[#6441cc] p-6 rounded-2xl flex flex-col items-center space-y-8">
      {/* Progress Bar */}
      <div className="w-full flex items-center gap-4">
        <div className="text-slate-400 font-mono text-sm">
          {currentQuestionIdx + 1}/{totalQuestions}
        </div>
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="text-blue-400 font-mono text-sm uppercase px-2 py-1 bg-blue-500/10 rounded border border-blue-500/20">
          {activeQuizId}
        </div>
      </div>

      <div className="space-y-3 text-center w-full">
        <h3 className="text-blue-400 text-sm font-bold tracking-widest uppercase">
          Vocabulary Match
        </h3>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{currentQ.question}</h2>
      </div>

      <div className="w-full space-y-3">
        {currentQ.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrectAnswer = option.isCorrect;

          let optionContainerStyle =
            "bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer";
          let optionIconStyle = "border-2 border-white/20 group-hover:border-white/50";

          if (isRevealed) {
            if (isCorrectAnswer) {
              optionContainerStyle =
                "bg-green-500/20 border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
              optionIconStyle = "bg-green-500 text-white border-transparent";
            } else if (isSelected && !isCorrectAnswer) {
              optionContainerStyle =
                "bg-red-500/20 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
              optionIconStyle = "bg-red-500 text-white border-transparent";
            } else {
              optionContainerStyle = "bg-white/5 border border-white/10 opacity-40 cursor-default";
            }
          } else if (isSelected) {
            optionContainerStyle =
              "bg-blue-500/15 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]";
            optionIconStyle = "bg-blue-500 text-white border-transparent";
          }

          return (
            <button
              key={option.id}
              disabled={isRevealed}
              onClick={() => setSelectedOptionId(option.id)}
              className={`w-full text-left px-6 py-4 rounded-2xl transition-all flex items-center gap-4 group ${optionContainerStyle}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${optionIconStyle}`}
              >
                {(isSelected || (isRevealed && isCorrectAnswer)) && (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {isRevealed && isSelected && !isCorrectAnswer ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      ></path>
                    )}
                  </svg>
                )}
              </div>
              <span
                className={`font-medium ${
                  isSelected || (isRevealed && isCorrectAnswer) ? "text-white" : "text-slate-300"
                }`}
              >
                {option.text}
              </span>
            </button>
          );
        })}
      </div>

      <div className="w-full pt-4">
        <button
          onClick={handleActionClick}
          disabled={!selectedOptionId}
          className={`w-full font-bold py-4 rounded-full transition-all ${buttonStyle}`}
        >
          {!isRevealed ? "Check Answer" : "Continue"}
        </button>
      </div>
    </div>
  );
}