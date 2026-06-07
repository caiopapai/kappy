// src/App.jsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAccountsStore }     from "./store/accountsStore";
import { useCategoriesStore }   from "./store/categoriesStore";
import { useGoalsStore }        from "./store/goalsStore";
import { useInvestmentsStore }  from "./store/investmentsStore";
import { useTransactionsStore } from "./store/transactionsStore";
import { useBudgetsStore }      from "./store/budgetsStore";
import { useCreditCardsStore }  from "./store/creditCardsStore";
import { useLoansStore }        from "./store/loansStore";
import { useConfigStore }       from "./store/configStore";
import { useSettingsStore }      from "./store/settingsStore";
import { IS_CONFIGURED, bootstrapApi } from "./services/sheetsApi";
import AccountsPage     from "./features/accounts/AccountsPage";
import CategoriesPage   from "./features/categories/CategoriesPage";
import GoalsPage        from "./features/goals/GoalsPage";
import InvestmentsPage  from "./features/investments/InvestmentsPage";
import TransactionsPage from "./features/transactions/TransactionsPage";
import DashboardPage    from "./features/dashboard/DashboardPage";
import BudgetPage       from "./features/budget/BudgetPage";
import CalendarPage     from "./features/calendar/CalendarPage";
import SettingsPage     from "./features/settings/SettingsPage";

// ── Carga inicial ─────────────────────────────────────────────

function useBootstrap() {
  const checkConfig      = useConfigStore(s => s.check);
  const loadSettings     = useSettingsStore(s => s.load);
  const setAccounts      = useAccountsStore(s => s.setAll);
  const setCategories    = useCategoriesStore(s => s.setAll);
  const setGoals         = useGoalsStore(s => s.setAll);
  const setInvestments   = useInvestmentsStore(s => s.setAll);
  const setTransactions  = useTransactionsStore(s => s.setAll);
  const setBudgets       = useBudgetsStore(s => s.setAll);
  const setCreditCards   = useCreditCardsStore(s => s.setAll);
  const setLoans         = useLoansStore(s => s.setAll);

  useEffect(() => {
    checkConfig()
      .then(() => loadSettings())
      .then(async () => {
        if (!IS_CONFIGURED) {
          // Modo demo — stores já têm mocks, não precisa de fazer nada
          return;
        }

        try {
          const data = await bootstrapApi();

          // Hidrata os stores com os dados do bootstrap
          // Mesmo se vazio, substitui os mocks (IS_CONFIGURED = fonte de dados real)
          setAccounts(data.accounts     || []);
          setCategories(data.categories || [], data.subcategories || []);
          setGoals(data.goals           || []);
          setInvestments(data.investments || []);
          setTransactions(data.transactions || [], data.recurringRules || []);
          setBudgets(data.budgets       || []);
          setCreditCards(data.creditCards || []);
          setLoans(data.loans           || []);
        } catch (err) {
          console.error("[kappy] bootstrap failed:", err.message);
        }
      });
  }, [checkConfig, loadSettings, setAccounts, setCategories, setGoals,
      setInvestments, setTransactions, setBudgets]);
}

// ── NavItem ───────────────────────────────────────────────────

function NavItem({ to, icon, label, testId }) {
  return (
    <NavLink
      to={to}
      data-testid={testId}
      className={({ isActive }) => `
        flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5
        text-sm font-medium transition-all border-l-[3px]
        ${isActive
          ? "bg-overlay border-[var(--border-focus)] text-brand-light"
          : "border-transparent text-muted hover:text-secondary hover:bg-raised"}
      `}
    >
      <span className="w-5 text-center text-base">{icon}</span>
      {label}
    </NavLink>
  );
}

// ── Sidebar ───────────────────────────────────────────────────

function Sidebar() {
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { to: "/dashboard",    icon: "◈",  label: t("nav.dashboard"),    testId: "nav-dashboard" },
    { to: "/accounts",     icon: "🏦", label: t("nav.accounts"),     testId: "nav-accounts" },
    { to: "/budget",       icon: "📊", label: t("nav.budget"),       testId: "nav-budget" },
    { to: "/calendar",     icon: "📅", label: t("nav.calendar"),     testId: "nav-calendar" },
    { to: "/transactions", icon: "↕",  label: t("nav.transactions"), testId: "nav-transactions" },
    { to: "/investments",  icon: "📈", label: t("nav.investments"),  testId: "nav-investments" },
    { to: "/goals",        icon: "🎯", label: t("nav.goals"),        testId: "nav-goals" },
    { to: "/categories",   icon: "🗂",  label: t("nav.categories"),   testId: "nav-categories" },
  ];

  return (
    <aside className="w-[200px] bg-card border-r border-default flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-default">
        <div className="flex items-center gap-2.5">
          <img
            src="/src/assets/kappy_logo.png"
            alt="Kappy"
            style={{
              width: 36, height: 36, borderRadius: 10, objectFit: "cover",
              filter: "hue-rotate(-40deg) saturate(0.85) brightness(0.95)",
            }}
          />
          <span className="font-semibold text-primary">Kappy</span>
        </div>
      </div>

      {/* Navegação principal */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Definições + provider indicator — rodapé */}
      <div className="p-2 border-t border-default">
        <NavItem to="/settings" icon="⚙" label={t("nav.settings")} testId="nav-settings" />
        <ProviderBadge />
      </div>
    </aside>
  );
}

// ── Provider badge na sidebar ─────────────────────────────────

function ProviderBadge() {
  const { checked, connected, providerLabel, providerIcon, error } = useConfigStore();

  if (!checked) return null;

  return (
    <div
      className="mx-2 mt-1 mb-1 px-2 py-1.5 rounded-lg text-[10px] flex items-center gap-1.5"
      style={{
        background:  connected ? "var(--success-bg)" : "var(--danger-bg)",
        border:      `1px solid ${connected ? "var(--success-bg)" : "var(--danger-bg)"}`,
      }}
      title={error || providerLabel}
    >
      <span>{providerIcon || (connected ? "✓" : "✕")}</span>
      <span style={{ color: connected ? "var(--success)" : "var(--danger)" }} className="truncate">
        {providerLabel || (connected ? "Conectado" : "Sem ligação")}
      </span>
      <span
        className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: connected ? "var(--success)" : "var(--danger)" }}
      />
    </div>
  );
}

// ── Banner ────────────────────────────────────────────────────

function ConfigBanner() {
  const { t }                                  = useTranslation();
  const { checked, connected, providerLabel }  = useConfigStore();

  // Modo demo — engine não configurado
  if (!IS_CONFIGURED) {
    return (
      <div className="bg-warning border-b border-[var(--border)] px-5 py-2 flex items-center gap-3 text-xs">
        <span>🎭</span>
        <span className="text-warning">
          {t("banner.demoMode")}{" "}
          <NavLink to="/settings" className="text-[#a5b4fc] underline hover:text-[#c4b5fd]">
            {t("banner.demoAction")}
          </NavLink>
        </span>
      </div>
    );
  }

  // Engine configurado mas provider sem ligação
  if (checked && !connected) {
    return (
      <div className="bg-danger border-b border-[var(--border)] px-5 py-2 flex items-center gap-3 text-xs">
        <span>⚠️</span>
        <span className="text-danger">
          {t("banner.disconnected", { provider: providerLabel || t("banner.dataSource") })}{" "}
          <NavLink to="/settings" className="text-[#a5b4fc] underline hover:text-[#c4b5fd]">
            {t("banner.disconnectedAction")}
          </NavLink>
        </span>
      </div>
    );
  }

  return null;
}

// ── App ───────────────────────────────────────────────────────

export default function App() {
  useBootstrap();

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-base text-primary overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <ConfigBanner />
          <main className="flex-1 overflow-auto p-7">
            <Routes>
              <Route path="/"                   element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"          element={<DashboardPage />} />
              <Route path="/accounts"           element={<AccountsPage />} />
              <Route path="/goals"              element={<GoalsPage />} />
              <Route path="/categories"         element={<CategoriesPage />} />
              <Route path="/investments"        element={<InvestmentsPage />} />
              <Route path="/transactions"       element={<TransactionsPage />} />
              <Route path="/budget"              element={<BudgetPage />} />
              <Route path="/calendar"            element={<CalendarPage />} />
              <Route path="/settings"           element={<SettingsPage />} />
              <Route path="/settings/:section"  element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}