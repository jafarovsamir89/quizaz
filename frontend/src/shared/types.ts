// ─────────────────────────────────────────────
//  Shared domain types for QuizAz
// ─────────────────────────────────────────────

export interface QuestionOption {
  a: string;
  b: string;
  c: string;
  d: string;
}

export interface Question {
  id: number;
  textAz: string;
  options: QuestionOption;
  categoryId: number;
  difficulty: number;
}

export interface City {
  id: number;
  nameAz: string;
  nameEn: string;
  slug: string;
}

export interface UserProfile {
  id: string;
  firebaseUid: string;
  email?: string;
  nickname: string;
  avatarUrl?: string;
  cityId?: number;
  city?: City;
  level: number;
  xp: number;
  balanceCoins: number;
  isAdmin: boolean;
  lastDailyBonusAt?: string;
  createdAt: string;
}

export interface GameSession {
  id: string;
  userId: string;
  mode: string;
  categoryId?: number;
  questionIds: number[];
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  coinsEarned: number;
  xpEarned: number;
  status: 'active' | 'finished' | 'expired';
  createdAt: string;
  finishedAt?: string;
}

export interface Duel {
  id: string;
  initiatorId: string;
  opponentId?: string;
  initiator: UserProfile;
  opponent?: UserProfile;
  questionIds: number[];
  initiatorScore: number;
  opponentScore: number;
  winnerId?: string;
  status: 'pending' | 'active' | 'finished' | 'expired' | 'cancelled';
  entryFeeCoins: number;
  prizeCoins: number;
  createdAt: string;
  expiresAt: string;
  finishedAt?: string;
}

export interface DuelResult {
  id: string;
  status: string;
  initiatorScore: number;
  opponentScore: number;
  winnerId?: string;
  finishedAt?: string;
  prizeCoins: number;
}

export interface AnswerFeedback {
  isCorrect: boolean;
  correctOption: string;
  explanation?: string;
  scoreEarned: number;
}

export interface Category {
  id: number;
  nameAz: string;
  iconUrl?: string;
}
