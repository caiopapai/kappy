import { create } from "zustand";

export const useInvestmentsStore = create(() => ({
  investments: [],
}));
