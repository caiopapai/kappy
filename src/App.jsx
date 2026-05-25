// src/App.jsx
// Shell da aplicação — router + providers + carga inicial.
// À medida que migras features, adiciona rotas e chamadas load() aqui.

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useAccountsStore } from "./store/accountsStore";
import { useCategoriesStore } from "./store/categoriesStore";
import { IS_CONFIGURED } from "./services/sheetsApi";
import AccountsPage    from "./features/AccountsPage";
import CategoriesPage  from "./features/CategoriesPage";

// ── Carga inicial ─────────────────────────────────────────────
// Cada store tem um load() que vai buscar dados à sheet.
// À medida que adicionas features, importa e chama o store aqui.

function useBootstrap() {
  const loadAccounts    = useAccountsStore(s => s.load);
  const loadCategories  = useCategoriesStore(s => s.load);

  useEffect(() => {
    loadAccounts().catch(() => {});
    loadCategories().catch(() => {});
  }, [loadAccounts, loadCategories]);
}

// ── Sidebar ───────────────────────────────────────────────────
// Versão mínima para arrancar. Vai crescer com cada feature.

const NAV_ITEMS = [
  { to: "/accounts",    icon: "🏦", label: "Contas" },
  { to: "/categories",  icon: "🗂",  label: "Categorias" },
];

function Sidebar() {
  return (
    <aside className="w-[200px] bg-[#161820] border-r border-[#2a2d3a] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#2a2d3a]">
        <div className="flex items-center gap-2.5">
          <img
            src="/src/assets/kappy_logo.png"
            alt="Kappy"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              objectFit: "cover",
              // Ajusta a cor do fundo roxo original para o roxo do design system (#6366f1)
              // hue-rotate: desloca o matiz do roxo original (~290°) para o indigo (~240°)
              filter: "hue-rotate(-40deg) saturate(0.85) brightness(0.95)",
            }}
          />
          <span className="font-semibold text-[#f0ede8]">Kappy</span>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-2">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5
              text-sm font-medium transition-all
              border-l-[3px]
              ${isActive
                ? "bg-[#1e2235] border-[#6366f1] text-[#a5b4fc]"
                : "border-transparent text-[#8a8fa8] hover:text-[#c4c0b8]"}
            `}
          >
            <span className="w-5 text-center text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Rodapé */}
      <div className="p-2 border-t border-[#2a2d3a]">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#5a5f78]">
          <span className="w-5 text-center">⚙</span>
          Definições
        </div>
      </div>
    </aside>
  );
}

// ── Banner de configuração ────────────────────────────────────

function ConfigBanner() {
  if (IS_CONFIGURED) return null;
  return (
    <div className="bg-[#1e1a0e] border-b border-[#f59e0b33] px-5 py-2 flex items-center gap-3 text-xs">
      <span>⚙️</span>
      <span className="text-[#fcd34d]">
        Modo local — dados não persistidos.{" "}
        <span className="text-[#8a8fa8]">
          Configura <code className="text-[#a5b4fc]">VITE_SHEETS_URL</code> no{" "}
          <code className="text-[#a5b4fc]">.env.local</code> para activar a sync.
        </span>
      </span>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────

export default function App() {
  console.log("SHEETS_URL:", import.meta.env.VITE_SHEETS_URL);

  useBootstrap();

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#0f1117] text-[#e8e6e0] overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <ConfigBanner />
          <main className="flex-1 overflow-auto p-7">
            <Routes>
              <Route path="/"            element={<Navigate to="/accounts" replace />} />
              <Route path="/accounts"   element={<AccountsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
