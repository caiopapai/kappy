// src/store/transactionsStore.js
// O engine é responsável pela lógica de negócio:
//   - Actualização atómica do saldo da conta ao criar transação
//   - Reversão do saldo ao eliminar
// O store apenas gere estado local com optimistic updates.

import { create } from "zustand";
import { transactionsEngineApi, IS_CONFIGURED } from "../services/sheetsApi";
import { INITIAL_TRANSACTIONS, INITIAL_RECURRING } from "../data/mockData";

export const useTransactionsStore = create((set, get) => ({
  transactions:   INITIAL_TRANSACTIONS,
  recurringRules: INITIAL_RECURRING,
  loading:        false,
  error:          null,

  // ── Carga inicial ───────────────────────────────────────────
  load: async () => {
    if (!IS_CONFIGURED) return;
    set({ loading: true, error: null });
    try {
      const [transactions, recurringRules] = await Promise.all([
        transactionsEngineApi.getAll(),
        transactionsEngineApi.getAllRecurring(),
      ]);
      set({ transactions, recurringRules, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // ── Transações ──────────────────────────────────────────────
  // O engine trata do saldo — o store só actualiza a lista local

  saveTransaction: async (tx) => {
    const toSave = tx.id ? tx : { ...tx, id: Date.now() };

    // Optimistic
    set(state => ({
      transactions: state.transactions.some(t => t.id === toSave.id)
        ? state.transactions.map(t => t.id === toSave.id ? toSave : t)
        : [...state.transactions, toSave],
    }));

    if (!IS_CONFIGURED) return toSave;

    try {
      // Engine actualiza saldo da conta automaticamente
      const saved = await transactionsEngineApi.save(toSave);
      return saved;
    } catch (err) {
      // Rollback
      set(state => ({
        transactions: tx.id
          ? state.transactions.map(t => t.id === tx.id ? tx : t)
          : state.transactions.filter(t => t.id !== toSave.id),
      }));
      throw err;
    }
  },

  deleteTransaction: async (tx) => {
    const snapshot = get().transactions;

    // Optimistic
    set(state => ({ transactions: state.transactions.filter(t => t.id !== tx.id) }));

    if (!IS_CONFIGURED) return;

    try {
      // Engine reverte saldo da conta automaticamente
      await transactionsEngineApi.delete(tx.id);
    } catch (err) {
      set({ transactions: snapshot });
      throw err;
    }
  },

  // ── Regras Recorrentes ──────────────────────────────────────

  saveRecurringRule: async (rule) => {
    const toSave = rule.id ? rule : { ...rule, id: Date.now() };
    set(state => ({
      recurringRules: state.recurringRules.some(r => r.id === toSave.id)
        ? state.recurringRules.map(r => r.id === toSave.id ? toSave : r)
        : [...state.recurringRules, toSave],
    }));
    if (!IS_CONFIGURED) return toSave;
    try {
      return await transactionsEngineApi.saveRecurring(toSave);
    } catch (err) {
      set(state => ({
        recurringRules: rule.id
          ? state.recurringRules.map(r => r.id === rule.id ? rule : r)
          : state.recurringRules.filter(r => r.id !== toSave.id),
      }));
      throw err;
    }
  },

  deleteRecurringRule: async (id) => {
    const snapshot = get().recurringRules;
    set(state => ({ recurringRules: state.recurringRules.filter(r => r.id !== id) }));
    if (!IS_CONFIGURED) return;
    try {
      await transactionsEngineApi.deleteRecurring(id);
    } catch (err) {
      set({ recurringRules: snapshot });
      throw err;
    }
  },

  toggleRecurringRule: async (id) => {
    const rule = get().recurringRules.find(r => r.id === id);
    if (!rule) return;
    const updated = { ...rule, active: !rule.active };
    set(state => ({
      recurringRules: state.recurringRules.map(r => r.id === id ? updated : r),
    }));
    if (!IS_CONFIGURED) return;
    try {
      await transactionsEngineApi.saveRecurring(updated);
    } catch (err) {
      set(state => ({
        recurringRules: state.recurringRules.map(r => r.id === id ? rule : r),
      }));
      throw err;
    }
  },
}));