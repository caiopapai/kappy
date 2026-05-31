// src/data/mockData.js
// Dados de demonstração usados como estado inicial enquanto
// a Google Sheet não está configurada (ou como fallback offline).
// À medida que migras features, adiciona as restantes entidades aqui.

export const INITIAL_ACCOUNTS = [
  { id: 1, name: "Conta Principal", type: "checking",    balance: 2450.00,  currency: "EUR" },
  { id: 2, name: "Poupança Férias",  type: "savings",     balance: 1800.00,  currency: "EUR" },
  { id: 3, name: "Cartão Visa",      type: "credit_card", balance: -320.50,  currency: "EUR" },
];

export const INITIAL_CATEGORIES = [
  { id: 1, name: "Salário",     type: "income" },
  { id: 2, name: "Freelance",   type: "income" },
  { id: 3, name: "Habitação",   type: "fixed_expense" },
  { id: 4, name: "Alimentação", type: "variable_expense" },
  { id: 5, name: "ETFs",        type: "investment" },
];

export const INITIAL_SUBCATEGORIES = [
  { id: 1, name: "Salário Mensal", categoryId: 1, type: "income" },
  { id: 2, name: "Projeto Web",    categoryId: 2, type: "income" },
  { id: 3, name: "Renda",          categoryId: 3, type: "fixed_expense" },
  { id: 4, name: "Supermercado",   categoryId: 4, type: "variable_expense" },
  { id: 5, name: "S&P 500 ETF",    categoryId: 5, type: "investment" },
];

export const INITIAL_GOALS = [
  { id: 1, type: "invested",  label: "Capital Investido",  targetValue: 10000, currency: "EUR" },
  { id: 2, type: "dividends", label: "Dividendos Mensais", targetValue: 500,   currency: "EUR" },
];

export const INITIAL_INVESTMENTS = [
  { id: 1, opType: "buy",  assetType: "etf",   ticker: "VWCE",  name: "Vanguard FTSE All-World", date: "2025-01-15", quantity: 10,   unitPrice: 112.50, otherCosts: 1.50, currency: "EUR", totalValue: 1126.50, dyAnnual: 1.8  },
  { id: 2, opType: "buy",  assetType: "crypto", ticker: "BTC",   name: "Bitcoin",                 date: "2025-02-10", quantity: 0.05, unitPrice: 38000,  otherCosts: 5,    currency: "EUR", totalValue: 1905,    dyAnnual: 0    },
  { id: 3, opType: "buy",  assetType: "acoes",  ticker: "PETR4", name: "Petrobras PN",             date: "2025-03-05", quantity: 100,  unitPrice: 38.20,  otherCosts: 4.50, currency: "BRL", totalValue: 3824.50, dyAnnual: 14.2 },
  { id: 4, opType: "sell", assetType: "acoes",  ticker: "PETR4", name: "Petrobras PN",             date: "2025-04-20", quantity: 50,   unitPrice: 41.80,  otherCosts: 3.00, currency: "BRL", totalValue: 2087.00, dyAnnual: 14.2 },
];


export const INITIAL_TRANSACTIONS = [
  { id: 1, accountId: 1, amount: 2800,  currency: "EUR", date: "2025-05-01", subcategoryId: 1, notes: "Maio 2025",  type: "income" },
  { id: 2, accountId: 1, amount: 850,   currency: "EUR", date: "2025-05-02", subcategoryId: 3, notes: "Renda Maio", type: "fixed_expense" },
  { id: 3, accountId: 3, amount: 120.5, currency: "EUR", date: "2025-05-10", subcategoryId: 4, notes: "Continente", type: "variable_expense" },
];

export const INITIAL_RECURRING = [
  { id: 1, accountId: 1, amount: 850,  currency: "EUR", subcategoryId: 3, type: "fixed_expense", notes: "Renda mensal", startDate: "2025-01-01", endDate: null, hasNoEnd: true, active: true },
  { id: 2, accountId: 1, amount: 2800, currency: "EUR", subcategoryId: 1, type: "income",         notes: "Salário",     startDate: "2025-01-01", endDate: null, hasNoEnd: true, active: true },
];

// As restantes entidades serão adicionadas aqui
// à medida que cada feature for migrada:
//
// export const INITIAL_BUDGETS = [ ... ];  ← Feature 5