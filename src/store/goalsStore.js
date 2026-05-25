import { create } from "zustand";
import { goalsApi, IS_CONFIGURED } from "../services/sheetsApi";
import { INITIAL_GOALS } from "../data/mockData";

export const useGoalsStore = create((set, get) => ({
  goals:   INITIAL_GOALS,
  loading: false,
  error:   null,

  load: async () => {
    if (!IS_CONFIGURED) return;
    set({ loading: true, error: null });
    try {
      const goals = await goalsApi.getAll();
      set({ goals, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  save: async (goal) => {
    const toSave = goal.id ? goal : { ...goal, id: Date.now() };

    set(state => ({
      goals: state.goals.some(g => g.id === toSave.id)
        ? state.goals.map(g => g.id === toSave.id ? toSave : g)
        : [...state.goals, toSave],
    }));

    if (!IS_CONFIGURED) return toSave;
    try {
      await goalsApi.save(toSave);
    } catch (err) {
      set(state => ({
        goals: goal.id
          ? state.goals.map(g => g.id === goal.id ? goal : g)
          : state.goals.filter(g => g.id !== toSave.id),
      }));
      throw err;
    }
    return toSave;
  },

  delete: async (id) => {
    const snapshot = get().goals;
    set(state => ({ goals: state.goals.filter(g => g.id !== id) }));

    if (!IS_CONFIGURED) return;
    try {
      await goalsApi.delete(id);
    } catch (err) {
      set({ goals: snapshot });
      throw err;
    }
  },
}));
