// src/store/categoriesStore.js
import { create } from "zustand";
import { categoriesApi, subcategoriesApi, IS_CONFIGURED } from "../services/sheetsApi";
import { INITIAL_CATEGORIES, INITIAL_SUBCATEGORIES } from "../data/mockData";

export const useCategoriesStore = create((set, get) => ({
  // ── Estado ─────────────────────────────────────────────────
  categories:    INITIAL_CATEGORIES,
  subcategories: INITIAL_SUBCATEGORIES,
  loading:       false,
  error:         null,

  // ── Carga inicial ───────────────────────────────────────────
  load: async () => {
    if (!IS_CONFIGURED) return;
    set({ loading: true, error: null });
    try {
      const [categories, subcategories] = await Promise.all([
        categoriesApi.getAll(),
        subcategoriesApi.getAll(),
      ]);
      set({ categories, subcategories, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // ── Categorias ──────────────────────────────────────────────
  saveCategory: async (category) => {
    const toSave = category.id ? category : { ...category, id: Date.now() };

    set(state => ({
      categories: state.categories.some(c => c.id === toSave.id)
        ? state.categories.map(c => c.id === toSave.id ? toSave : c)
        : [...state.categories, toSave],
    }));

    if (!IS_CONFIGURED) return toSave;
    try {
      await categoriesApi.save(toSave);
    } catch (err) {
      // Rollback
      set(state => ({
        categories: category.id
          ? state.categories.map(c => c.id === category.id ? category : c)
          : state.categories.filter(c => c.id !== toSave.id),
      }));
      throw err;
    }
    return toSave;
  },

  deleteCategory: async (id) => {
    const snapshot = {
      categories:    get().categories,
      subcategories: get().subcategories,
    };

    // Remove categoria e todas as subcategorias associadas
    set(state => ({
      categories:    state.categories.filter(c => c.id !== id),
      subcategories: state.subcategories.filter(s => s.categoryId !== id),
    }));

    if (!IS_CONFIGURED) return;
    try {
      // Apaga subcategorias primeiro, depois a categoria
      const subsToDelete = snapshot.subcategories.filter(s => s.categoryId === id);
      await Promise.all(subsToDelete.map(s => subcategoriesApi.delete(s.id)));
      await categoriesApi.delete(id);
    } catch (err) {
      set(snapshot);
      throw err;
    }
  },

  // ── Subcategorias ───────────────────────────────────────────
  saveSubcategory: async (subcategory) => {
    const toSave = subcategory.id
      ? subcategory
      : { ...subcategory, id: Date.now(), categoryId: parseInt(subcategory.categoryId) };

    set(state => ({
      subcategories: state.subcategories.some(s => s.id === toSave.id)
        ? state.subcategories.map(s => s.id === toSave.id ? toSave : s)
        : [...state.subcategories, toSave],
    }));

    if (!IS_CONFIGURED) return toSave;
    try {
      await subcategoriesApi.save(toSave);
    } catch (err) {
      set(state => ({
        subcategories: subcategory.id
          ? state.subcategories.map(s => s.id === subcategory.id ? subcategory : s)
          : state.subcategories.filter(s => s.id !== toSave.id),
      }));
      throw err;
    }
    return toSave;
  },

  deleteSubcategory: async (id) => {
    const snapshot = get().subcategories;

    set(state => ({
      subcategories: state.subcategories.filter(s => s.id !== id),
    }));

    if (!IS_CONFIGURED) return;
    try {
      await subcategoriesApi.delete(id);
    } catch (err) {
      set({ subcategories: snapshot });
      throw err;
    }
  },
}));
