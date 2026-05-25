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
