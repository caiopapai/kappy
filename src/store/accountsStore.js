import { create } from "zustand";
import { accountsApi, IS_CONFIGURED } from "../services/sheetsApi.js";
import { INITIAL_ACCOUNTS } from "../data/mockData.js";

export const useAccountsStore = create((set, get) => ({

  accounts: INITIAL_ACCOUNTS,
  loading:  false,
  error:    null,

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

  save: async (account) => {
    const toSave = account.id
      ? account
      : { ...account, id: Date.now() };

    set(state => ({
      accounts: state.accounts.some(a => a.id === toSave.id)
        ? state.accounts.map(a => a.id === toSave.id ? toSave : a)
        : [...state.accounts, toSave],
    }));

    if (!IS_CONFIGURED) return toSave;
    try {
      await accountsApi.save(toSave);
    } catch (err) {

      set(state => ({
        accounts: account.id
          ? state.accounts.map(a => a.id === account.id ? account : a)
          : state.accounts.filter(a => a.id !== toSave.id),
      }));
      throw err;
    }

    return toSave;
  },

  delete: async (id) => {
    const snapshot = get().accounts;

    set(state => ({
      accounts: state.accounts.filter(a => a.id !== id),
    }));

    if (!IS_CONFIGURED) return;
    try {
      await accountsApi.delete(id);
    } catch (err) {
      set({ accounts: snapshot });
      throw err;
    }
  },

  seed: async () => {
    await accountsApi.seedAll(get().accounts);
  },
}));
