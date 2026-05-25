// src/features/settings/SettingsPage.jsx
import { useState } from "react";
import { Card } from "../../components/ui";
import SheetConfig from "../settings/SheetConfig"

// ── Secções disponíveis ───────────────────────────────────────

const SECTIONS = [
  {
    id:    "language",
    icon:  "🌐",
    label: "Idioma Padrão",
    desc:  "Língua da interface",
  },
  {
    id:    "theme",
    icon:  "🎨",
    label: "Tema Padrão",
    desc:  "Aparência da aplicação",
  },
  {
    id:    "currency",
    icon:  "💱",
    label: "Moeda Padrão",
    desc:  "Moeda usada por defeito",
  },
  {
    id:    "sheet",
    icon:  "🔗",
    label: "Sheet Config",
    desc:  "URL e chave de acesso à Google Sheet",
  },
  {
    id:    "backup",
    icon:  "💾",
    label: "Backups",
    desc:  "Exportar e importar dados",
  },
];

// ── Page ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("language");
  const current = SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="flex gap-6 h-full">

      {/* Menu lateral de secções */}
      <aside className="w-56 shrink-0">
        <div className="text-[11px] text-[#5a5f78] uppercase tracking-widest font-semibold mb-3 px-1">
          Definições
        </div>
        <nav className="flex flex-col gap-0.5">
          {SECTIONS.map(s => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  text-left text-sm font-medium transition-all border-l-[3px] border-0
                  ${isActive
                    ? "bg-[#1e2235] border-l-[#6366f1] text-[#a5b4fc]"
                    : "border-l-transparent text-[#8a8fa8] hover:text-[#c4c0b8] hover:bg-[#1a1d2e]"}
                `}
              >
                <span className="text-base w-5 text-center">{s.icon}</span>
                <div>
                  <div>{s.label}</div>
                  <div className={`text-[11px] font-normal mt-0.5 ${isActive ? "text-[#6366f188]" : "text-[#5a5f78]"}`}>
                    {s.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Conteúdo da secção activa */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{current.icon}</span>
          <div>
            <h2 className="text-base font-semibold text-[#f0ede8] m-0">{current.label}</h2>
            <div className="text-xs text-[#5a5f78] mt-0.5">{current.desc}</div>
          </div>
        </div>

        {activeSection === "language" && <LanguageSection />}
        {activeSection === "theme"    && <ThemeSection />}
        {activeSection === "currency" && <CurrencySection />}
        {activeSection === "sheet"    && <SheetSection />}
        {activeSection === "backup"   && <BackupSection />}
      </div>

    </div>
  );
}

// ── Secção: Idioma ────────────────────────────────────────────

function LanguageSection() {
  return (
    <Card>
      <ComingSoon label="Idioma Padrão" />
    </Card>
  );
}

// ── Secção: Tema ──────────────────────────────────────────────

function ThemeSection() {
  return (
    <Card>
      <ComingSoon label="Tema Padrão" />
    </Card>
  );
}

// ── Secção: Moeda ─────────────────────────────────────────────

function CurrencySection() {
  return (
    <Card>
      <ComingSoon label="Moeda Padrão" />
    </Card>
  );
}

// ── Secção: Sheet Config ──────────────────────────────────────

function SheetSection() {
  return <SheetConfig />;
}

// ── Secção: Backups ───────────────────────────────────────────

function BackupSection() {
  return (
    <Card>
      <ComingSoon label="Backups" />
    </Card>
  );
}

// ── Placeholder ───────────────────────────────────────────────

function ComingSoon({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4">🚧</div>
      <div className="text-[15px] text-[#c4c0b8] mb-2">{label}</div>
      <div className="text-sm text-[#5a5f78]">Esta secção está a ser preparada.</div>
    </div>
  );
}