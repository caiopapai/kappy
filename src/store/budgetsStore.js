// src/store/budgetsStore.js
import { create } from "zustand";
import { budgetsApi, IS_CONFIGURED } from "../services/sheetsApi";
import { INITIAL_BUDGETS } from "../data/mockData";

export function budgetToRows(budget) {
  return Object.entries(budget.months || {}).map(([month, amount]) => ({
    id:            `${budget.id}_${month}`,
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
        id:            parseFloat(String(r.id).split("_")[0]) || Date.now(),
        year:          parseInt(r.year),
        subcategoryId: parseInt(r.subcategoryId),
        months:        {},
      };
    }
    map[key].months[parseInt(r.month)] = parseFloat(r.amount);
  });
  return Object.values(map);
}

export const useBudgetsStore = create((set, get) => ({
  budgets: IS_CONFIGURED ? [] : INITIAL_BUDGETS,
  loading: false,
  error:   null,

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
      updated = [...prev, { id: Date.now(), year, subcategoryId, months: { [month]: amount } }];
    }

    set({ budgets: updated });

    if (!IS_CONFIGURED) return;
    const budget = updated.find(b => b.year === year && b.subcategoryId === subcategoryId);
    const rows   = budgetToRows(budget);
    const row    = rows.find(r => r.month === month);
    try {
      await budgetsApi.save(row);
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
    } catch {
      set({ budgets: prev });
    }
  },
}));