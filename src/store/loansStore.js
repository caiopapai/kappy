// src/store/loansStore.js
import { create } from "zustand";
import { IS_CONFIGURED } from "../services/sheetsApi";

const ENGINE_URL = import.meta.env.KAPPY_ENGINE_URL || "http://localhost:3001";

const api = {
  getAll: async () => {
    const res  = await fetch(`${ENGINE_URL}/api/loans`);
    const json = await res.json();
    return json.data || [];
  },
  save: async (row) => {
    const res  = await fetch(`${ENGINE_URL}/api/loans`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ row }),
    });
    return res.json();
  },
  delete: async (id) => {
    const res = await fetch(`${ENGINE_URL}/api/loans/${id}`, { method: "DELETE" });
    return res.json();
  },
};

const MOCK_LOANS = [
  { id: 1, name: "Crédito Habitação", bank: "CGD", contracted: 27000, paid: 8500, remaining: 18500, installment: 450, currency: "EUR", start_date: "2020-01-01", end_date: "2031-01-01", accountId: 1, paidPercent: 31 },
];

export const useLoansStore = create((set, get) => ({
  loans:   IS_CONFIGURED ? [] : MOCK_LOANS,
  loading: false,

  setAll: (loans) => set({ loans }),

  load: async () => {
    if (!IS_CONFIGURED) return;
    set({ loading: true });
    try {
      const loans = await api.getAll();
      set({ loans, loading: false });
    } catch (err) { set({ loading: false }); }
  },

  save: async (loan) => {
    const toSave = loan.id ? loan : { ...loan, id: Date.now() };
    set(s => ({
      loans: s.loans.some(l => l.id === toSave.id)
        ? s.loans.map(l => l.id === toSave.id ? toSave : l)
        : [...s.loans, toSave],
    }));
    if (!IS_CONFIGURED) return toSave;
    try {
      const res   = await api.save(toSave);
      const fresh = await api.getAll();
      set({ loans: fresh });
      return res.data;
    } catch (err) {
      set(s => ({ loans: s.loans.filter(l => l.id !== toSave.id) }));
      throw err;
    }
  },

  delete: async (id) => {
    const snapshot = get().loans;
    set(s => ({ loans: s.loans.filter(l => l.id !== id) }));
    if (!IS_CONFIGURED) return;
    try { await api.delete(id); }
    catch (err) { set({ loans: snapshot }); throw err; }
  },
}));