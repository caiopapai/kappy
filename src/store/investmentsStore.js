// src/store/investmentsStore.js
import { create } from "zustand";
import { investmentsApi, IS_CONFIGURED } from "../services/sheetsApi";
import { INITIAL_INVESTMENTS } from "../data/mockData";

export const useInvestmentsStore = create((set, get) => ({
  investments: INITIAL_INVESTMENTS,
  loading:     false,
  error:       null,

  load: async () => {
    if (!IS_CONFIGURED) return;
    set({ loading: true, error: null });
    try {
      const investments = await investmentsApi.getAll();
      set({ investments, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  save: async (investment) => {
    const toSave = investment.id ? investment : { ...investment, id: Date.now() };

    set(state => ({
      investments: state.investments.some(i => i.id === toSave.id)
        ? state.investments.map(i => i.id === toSave.id ? toSave : i)
        : [...state.investments, toSave],
    }));

    if (!IS_CONFIGURED) return toSave;
    try {
      await investmentsApi.save(toSave);
    } catch (err) {
      set(state => ({
        investments: investment.id
          ? state.investments.map(i => i.id === investment.id ? investment : i)
          : state.investments.filter(i => i.id !== toSave.id),
      }));
      throw err;
    }
    return toSave;
  },

  delete: async (id) => {
    const snapshot = get().investments;
    set(state => ({ investments: state.investments.filter(i => i.id !== id) }));

    if (!IS_CONFIGURED) return;
    try {
      await investmentsApi.delete(id);
    } catch (err) {
      set({ investments: snapshot });
      throw err;
    }
  },
}));
