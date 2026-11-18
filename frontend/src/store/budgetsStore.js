// src/store/budgetsStore.js
import { create } from "zustand";
import { budgetsApi, IS_CONFIGURED } from "../services/sheetsApi";
import { INITIAL_BUDGETS } from "../data/mockData";

const ENGINE_URL = import.meta.env.KAPPY_ENGINE_URL || "http://localhost:3001";

export function budgetToRows(budget) {
  return Object.entries(budget.months || {}).map(([month, amount]) => ({
    id:            `${budget.subcategoryId}_${month}_${budget.year}`,
    year:          budget.year,
    subcategoryId: budget.subcategoryId,
    month:         parseInt(month),
    amount,
  }));
}

export function rowsToBudgets(rows) {
  const map = {};
  rows.forEach(r => {
    const key = `${r.year}_${r.subcategoryId}`;
    if (!map[key]) {
      map[key] = {
        id:            `${r.subcategoryId}_${r.year}`,
        year:          parseInt(r.year),
        subcategoryId: parseInt(r.subcategoryId),
        months:        {},
      };
    }
    map[key].months[parseInt(r.month)] = parseFloat(r.amount) || 0;
  });
  return Object.values(map);
}

export const useBudgetsStore = create((set, get) => ({
  budgets:  IS_CONFIGURED ? [] : INITIAL_BUDGETS,
  summary:  {}, // summary[year][month][subcategoryId] = { planned, actual, projected, effective, diff }
  loading:  false,
  error:    null,

  setAll: (rows) => { const budgets = rowsToBudgets(rows); if (budgets.length > 0) set({ budgets }); },

  load: async () => {
    if (!IS_CONFIGURED) return;
    set({ loading: true, error: null });
    try {
      const rows    = await budgetsApi.getAll();
      const budgets = rowsToBudgets(rows);
      set({ budgets, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  // Carrega o summary do engine para um ano (inclui real + projecção)
  loadSummary: async (year) => {
    if (!IS_CONFIGURED) return;
    try {
      const res  = await fetch(`${ENGINE_URL}/api/budgets/summary?year=${year}`);
      const json = await res.json();
      if (!json.ok) { throw new Error(json.error); }
      set(state => ({
        summary: { ...state.summary, [year]: json.monthly },
      }));
    } catch (err) {
      console.error("budgets.loadSummary error", err.message);
    }
  },

  setCell: async (year, subcategoryId, month, amount) => {
    const prev     = get().budgets;
    const existing = prev.find(b => b.year === year && b.subcategoryId === subcategoryId);
    let updated;

    if (existing) {
      updated = prev.map(b =>
        b.year === year && b.subcategoryId === subcategoryId
          ? { ...b, months: { ...b.months, [month]: amount } }
          : b
      );
    } else {
      updated = [...prev, { id: `${subcategoryId}_${year}`, year, subcategoryId, months: { [month]: amount } }];
    }

    set({ budgets: updated });

    if (!IS_CONFIGURED) return;
    const row = { id: `${subcategoryId}_${month}_${year}`, year, subcategoryId, month, amount };
    try {
      await budgetsApi.save(row);
      get().loadSummary(year);
    } catch {
      set({ budgets: prev });
    }
  },

  removeRow: async (year, subcategoryId) => {
    const prev   = get().budgets;
    const budget = prev.find(b => b.year === year && b.subcategoryId === subcategoryId);
    set({ budgets: prev.filter(b => !(b.year === year && b.subcategoryId === subcategoryId)) });

    if (!IS_CONFIGURED || !budget) return;
    try {
      await Promise.all(budgetToRows(budget).map(r => budgetsApi.delete(r.id)));
      get().loadSummary(year);
    } catch {
      set({ budgets: prev });
    }
  },
}));