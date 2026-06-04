// src/store/accountsStore.js
// Estado global das contas com sync para a Google Sheet.
//
// Padrão usado em todo o Kappy:
//  1. Optimistic update — estado React actualiza imediatamente
//  2. Sync em background — Apps Script é chamado de seguida
//  3. Rollback em erro  — reverte e mostra toast de erro

import { create } from "zustand";
import { accountsApi, IS_CONFIGURED } from "../services/sheetsApi";
import { INITIAL_ACCOUNTS } from "../data/mockData";

export const useAccountsStore = create((set, get) => ({
  // ── Estado ─────────────────────────────────────────────────
  accounts: IS_CONFIGURED ? [] : INITIAL_ACCOUNTS,
  loading:  false,
  error:    null,

  // ── Carga inicial da sheet ──────────────────────────────────
  // Chamado uma vez no arranque da app (ver App.jsx).
  // Se a sheet não estiver configurada, mantém os dados mock.
  load: async () => {
    if (!IS_CONFIGURED) return;
    set({ loading: true, error: null });
    try {
      const accounts = await accountsApi.getAll();
      set({ accounts, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // ── Criar ou actualizar uma conta ───────────────────────────
  save: async (account) => {
    const toSave = account.id
      ? account
      : { ...account, id: Date.now() };

    // 1. Optimistic update
    set(state => ({
      accounts: state.accounts.some(a => a.id === toSave.id)
        ? state.accounts.map(a => a.id === toSave.id ? toSave : a)
        : [...state.accounts, toSave],
    }));

    // 2. Sync (só se configurado)
    if (!IS_CONFIGURED) return toSave;
    try {
      await accountsApi.save(toSave);
    } catch (err) {
      // 3. Rollback: remove se era nova, ou restaura o valor anterior
      set(state => ({
        accounts: account.id
          ? state.accounts.map(a => a.id === account.id ? account : a)
          : state.accounts.filter(a => a.id !== toSave.id),
      }));
      throw err; // a UI trata o erro com toast
    }

    return toSave;
  },

  // ── Eliminar uma conta ──────────────────────────────────────
  delete: async (id) => {
    // Snapshot para rollback
    const snapshot = get().accounts;

    // 1. Optimistic update
    set(state => ({
      accounts: state.accounts.filter(a => a.id !== id),
    }));

    // 2. Sync
    if (!IS_CONFIGURED) return;
    try {
      await accountsApi.delete(id);
    } catch (err) {
      // 3. Rollback
      set({ accounts: snapshot });
      throw err;
    }
  },

  // ── Seed: migrar dados mock para a sheet ────────────────────
  // Chamado pelo botão "Migrar dados" no banner de configuração.
  seed: async () => {
    await accountsApi.seedAll(get().accounts);
  },
}));