// src/store/creditCardsStore.js
import { create } from "zustand";
import { IS_CONFIGURED } from "../services/sheetsApi";

const ENGINE_URL = import.meta.env.KAPPY_ENGINE_URL || "http://localhost:3001";

const api = {
  getAll: async () => {
    const res  = await fetch(`${ENGINE_URL}/api/credit_cards`);
    const json = await res.json();
    return json.data || [];
  },
  save: async (row) => {
    const res  = await fetch(`${ENGINE_URL}/api/credit_cards`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ row }),
    });
    return res.json();
  },
  delete: async (id) => {
    const res = await fetch(`${ENGINE_URL}/api/credit_cards/${id}`, { method: "DELETE" });
    return res.json();
  },
};

const MOCK_CARDS = [
  { id: 1, name: "Visa NuBank", bank: "NuBank", limit: 5000, used: 1200, available: 3800, currency: "BRL", due_date: 10, close_date: 3, accountId: 1, color: "#8b5cf6", usedPercent: 24 },
];

export const useCreditCardsStore = create((set, get) => ({
  creditCards: IS_CONFIGURED ? [] : MOCK_CARDS,
  loading:     false,

  setAll: (creditCards) => set({ creditCards }),

  load: async () => {
    if (!IS_CONFIGURED) return;
    set({ loading: true });
    try {
      const creditCards = await api.getAll();
      set({ creditCards, loading: false });
    } catch (err) { set({ loading: false }); }
  },

  save: async (card) => {
    const toSave = card.id ? card : { ...card, id: Date.now() };
    set(s => ({
      creditCards: s.creditCards.some(c => c.id === toSave.id)
        ? s.creditCards.map(c => c.id === toSave.id ? toSave : c)
        : [...s.creditCards, toSave],
    }));
    if (!IS_CONFIGURED) return toSave;
    try {
      const res = await api.save(toSave);
      // Recarrega para obter used calculado
      const fresh = await api.getAll();
      set({ creditCards: fresh });
      return res.data;
    } catch (err) {
      set(s => ({ creditCards: s.creditCards.filter(c => c.id !== toSave.id) }));
      throw err;
    }
  },

  delete: async (id) => {
    const snapshot = get().creditCards;
    set(s => ({ creditCards: s.creditCards.filter(c => c.id !== id) }));
    if (!IS_CONFIGURED) return;
    try { await api.delete(id); }
    catch (err) { set({ creditCards: snapshot }); throw err; }
  },
}));