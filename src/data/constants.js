export const CURRENCY_SYMBOLS = { BRL: "R$", EUR: "€", USD: "$" };
export const CURRENCY_LABELS  = { BRL: "Real", EUR: "Euro", USD: "Dólar" };

export const ACCOUNT_TYPES = [
  { value: "checking",        label: "Conta Corrente",   icon: "🏦" },
  { value: "savings",         label: "Poupança",         icon: "🐷" },
  { value: "investment",      label: "Investimento",     icon: "📈" },
  { value: "credit_card",     label: "Cartão de Crédito",icon: "💳" },
  { value: "personal_credit", label: "Crédito Pessoal",  icon: "🤝" },
  { value: "car_credit",      label: "Crédito de Carro", icon: "🚗" },
  { value: "housing_credit",  label: "Crédito Habitação",icon: "🏠" },
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
