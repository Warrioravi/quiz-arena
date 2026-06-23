// types.ts
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  score: number;
}

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  word: string;
  question: string;
  options: Option[];
}