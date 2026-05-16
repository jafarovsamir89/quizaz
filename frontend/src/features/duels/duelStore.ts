import { create } from 'zustand';
import { duelsApi } from '../../shared/api';
import type { Question, DuelResult, AnswerFeedback, Duel } from '../../shared/types';

interface DuelState {
  currentDuelId: string | null;
  questions: Question[];
  currentStep: number;
  results: DuelResult | null;
  isLoading: boolean;
  role: 'initiator' | 'opponent' | null;

  findOrCreate: () => Promise<any>;
  submitAnswer: (data: { questionId: number; selectedOption: string; timeSpentMs: number }) => Promise<AnswerFeedback>;
  finishDuel: () => Promise<DuelResult | null>;
  setDuel: (duel: Duel, questions: Question[], role: 'initiator' | 'opponent') => void;
  /** Set duel state from a full Duel API object (for resuming from list) */
  setDuelFromApi: (duel: Duel, role: 'initiator' | 'opponent') => void;
  reset: () => void;
}

export const useDuelStore = create<DuelState>((set, get) => ({
  currentDuelId: null,
  questions: [],
  currentStep: 0,
  results: null,
  isLoading: false,
  role: null,

  findOrCreate: async () => {
    set({ isLoading: true });
    try {
      const res = await duelsApi.findOrCreate();
      // Backend returns { duelId, status, questions, role, expiresAt }
      set({
        currentDuelId: res.data.duelId,
        questions: res.data.questions,
        role: res.data.role,
        currentStep: 0,
        results: null,
      });
      return res.data;
    } finally {
      set({ isLoading: false });
    }
  },

  submitAnswer: async (data) => {
    const { currentDuelId } = get();
    if (!currentDuelId) return {} as AnswerFeedback;
    const res = await duelsApi.submitAnswer(currentDuelId, data);
    set((state) => ({ currentStep: state.currentStep + 1 }));
    return res.data as AnswerFeedback;
  },

  finishDuel: async () => {
    const { currentDuelId } = get();
    if (!currentDuelId) return null;
    set({ isLoading: true });
    try {
      const res = await duelsApi.finishSide(currentDuelId);
      set({ results: res.data });
      return res.data as DuelResult;
    } finally {
      set({ isLoading: false });
    }
  },

  setDuel: (duel, questions, role) =>
    set({
      currentDuelId: duel.id,
      questions,
      role,
      currentStep: 0,
      results: {
        id: duel.id,
        status: duel.status,
        initiatorScore: duel.initiatorScore,
        opponentScore: duel.opponentScore,
        winnerId: duel.winnerId,
        finishedAt: duel.finishedAt,
        prizeCoins: duel.prizeCoins,
      },
    }),

  setDuelFromApi: (duel, role) =>
    set({
      currentDuelId: duel.id,
      questions: [],
      role,
      currentStep: 0,
      results: {
        id: duel.id,
        status: duel.status,
        initiatorScore: duel.initiatorScore,
        opponentScore: duel.opponentScore,
        winnerId: duel.winnerId,
        finishedAt: duel.finishedAt,
        prizeCoins: duel.prizeCoins,
      },
    }),

  reset: () =>
    set({ currentDuelId: null, questions: [], currentStep: 0, results: null, role: null }),
}));
