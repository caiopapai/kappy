// src/data/constants.js
// Constantes partilhadas por toda a aplicação.
// Extraídas do FinanceApp.jsx original.

export const CURRENCY_SYMBOLS = { BRL: "R$", EUR: "€", USD: "$" };
export const CURRENCY_LABELS  = { BRL: "Real", EUR: "Euro", USD: "Dólar" };

export const ACCOUNT_TYPES = [
  { value: "checking",   label: "Conta Corrente", icon: "🏦" },
  { value: "savings",    label: "Poupança",        icon: "🐷" },
  { value: "investment", label: "Investimento",    icon: "📈" },
];

export const TRANSACTION_TYPES = [
  { value: "income",           label: "Ganho",           color: "#4ade80" },
  { value: "investment",       label: "Investimento",    color: "#60a5fa" },
  { value: "fixed_expense",    label: "Despesa Fixa",    color: "#f87171" },
  { value: "variable_expense", label: "Despesa Variável",color: "#fb923c" },
];

export const COLORS = {
  income:           "#4ade80",
  investment:       "#60a5fa",
  fixed_expense:    "#f87171",
  variable_expense: "#fb923c",
};