import { create } from 'zustand';
import { gameApi } from '../../shared/api';
import type { Question, GameSession, AnswerFeedback } from '../../shared/types';

interface GameState {
  sessionId: string | null;
  questions: Question[];
  currentStep: number;
  results: GameSession | null;
  isLoading: boolean;

  startSolo: (params: { categoryId?: number; difficulty?: number; limit?: number }) => Promise<void>;
  submitAnswer: (data: { questionId: number; selectedOption: string; timeSpentMs: number }) => Promise<AnswerFeedback>;
  finishSolo: () => Promise<GameSession | null>;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  sessionId: null,
  questions: [],
  currentStep: 0,
  results: null,
  isLoading: false,

  startSolo: async (params) => {
    set({ isLoading: true });
    try {
      const res = await gameApi.startSolo(params);
      set({
        sessionId: res.data.sessionId,
        questions: res.data.questions,
        currentStep: 0,
        results: null,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  submitAnswer: async (data) => {
    const { sessionId } = get();
    if (!sessionId) return {} as AnswerFeedback;
    const res = await gameApi.submitAnswer(sessionId, data);
    set((state) => ({ currentStep: state.currentStep + 1 }));
    return res.data as AnswerFeedback;
  },

  finishSolo: async () => {
    const { sessionId } = get();
    if (!sessionId) return null;
    set({ isLoading: true });
    try {
      const res = await gameApi.finishSolo(sessionId);
      set({ results: res.data });
      return res.data as GameSession;
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set({ sessionId: null, questions: [], currentStep: 0, results: null }),
}));
