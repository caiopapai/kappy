// src/App.jsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAccountsStore }     from "./store/accountsStore";
import { useCategoriesStore }   from "./store/categoriesStore";
import { useGoalsStore }        from "./store/goalsStore";
import { useInvestmentsStore }  from "./store/investmentsStore";
import { IS_CONFIGURED }        from "./services/sheetsApi";
import AccountsPage     from "./features/pages/AccountsPage";
import CategoriesPage   from "./features/pages/CategoriesPage";
import GoalsPage        from "./features/pages/GoalsPage";
import InvestmentsPage  from "./features/pages/InvestmentsPage";
import SettingsPage     from "./features/settings/SettingsPage";

// ── Carga inicial ─────────────────────────────────────────────

function useBootstrap() {
  const loadAccounts    = useAccountsStore(s => s.load);
  const loadCategories  = useCategoriesStore(s => s.load);
  const loadGoals       = useGoalsStore(s => s.load);
  const loadInvestments = useInvestmentsStore(s => s.load);

  useEffect(() => {
    loadAccounts().catch(() => {});
    loadCategories().catch(() => {});
    loadGoals().catch(() => {});
    loadInvestments().catch(() => {});
  }, [loadAccounts, loadCategories, loadGoals, loadInvestments]);
}

// ── NavItem ───────────────────────────────────────────────────

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5
        text-sm font-medium transition-all border-l-[3px]
        ${isActive
          ? "bg-[#1e2235] border-[#6366f1] text-[#a5b4fc]"
          : "border-transparent text-[#8a8fa8] hover:text-[#c4c0b8] hover:bg-[#1a1d2e]"}
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
    { to: "/accounts",    icon: "🏦", label: t("nav.accounts") },
    { to: "/goals",       icon: "🎯", label: t("nav.goals") },
    { to: "/categories",  icon: "🗂",  label: t("nav.categories") },
    { to: "/investments", icon: "📈", label: t("nav.investments") },
    // { to: "/transactions", icon: "↕",  label: t("nav.transactions") }, ← Feature 4
    // { to: "/budget",       icon: "📊", label: t("nav.budget") },       ← Feature 5
    // { to: "/dashboard",    icon: "◈",  label: t("nav.dashboard") },    ← Feature 7
  ];

  return (
    <aside className="w-[200px] bg-[#161820] border-r border-[#2a2d3a] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#2a2d3a]">
        <div className="flex items-center gap-2.5">
          <img
            src="/src/assets/kappy_logo.png"
            alt="Kappy"
            style={{
              width: 36, height: 36, borderRadius: 10, objectFit: "cover",
              filter: "hue-rotate(-40deg) saturate(0.85) brightness(0.95)",
            }}
          />
          <span className="font-semibold text-[#f0ede8]">Kappy</span>
        </div>
      </div>

      {/* Navegação principal */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Definições — rodapé */}
      <div className="p-2 border-t border-[#2a2d3a]">
        <NavItem to="/settings" icon="⚙" label={t("nav.settings")} />
      </div>
    </aside>
  );
}

// ── Banner ────────────────────────────────────────────────────

function ConfigBanner() {
  const { t } = useTranslation();
  if (IS_CONFIGURED) return null;
  return (
    <div className="bg-[#1e1a0e] border-b border-[#f59e0b33] px-5 py-2 flex items-center gap-3 text-xs">
      <span>⚙️</span>
      <span className="text-[#fcd34d]">
        {t("banner.localMode")}{" "}
        <span className="text-[#8a8fa8]">
          {t("banner.configure")}{" "}
          <NavLink to="/settings" className="text-[#a5b4fc] underline">
            {t("banner.sheetConfig")}
          </NavLink>.
        </span>
      </span>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────

export default function App() {
  useBootstrap();

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#0f1117] text-[#e8e6e0] overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <ConfigBanner />
          <main className="flex-1 overflow-auto p-7">
            <Routes>
              <Route path="/"                   element={<Navigate to="/accounts" replace />} />
              <Route path="/accounts"           element={<AccountsPage />} />
              <Route path="/goals"              element={<GoalsPage />} />
              <Route path="/categories"         element={<CategoriesPage />} />
              <Route path="/investments"        element={<InvestmentsPage />} />
              <Route path="/settings"           element={<SettingsPage />} />
              <Route path="/settings/:section"  element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}