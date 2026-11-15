// src/features/settings/DataConfig.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui";
import { useConfigStore } from "../../store/configStore";
import SheetConfig from "./SheetSettings";

// ── Opções de fonte de dados ──────────────────────────────────

const DATA_OPTIONS = [
  {
    id:          "demo",
    icon:        "🎭",
    implemented: true,
  },
  {
    id:          "sheets",
    icon:        "📊",
    implemented: true,
  },
  {
    id:          "database",
    icon:        "🗄",
    implemented: false,
  },
];

const DB_ENGINES = [
  { id: "postgres", icon: "🐘", label: "PostgreSQL" },
  { id: "mongodb",  icon: "🍃", label: "MongoDB"    },
  { id: "sqlite",   icon: "📦", label: "SQLite"      },
];

// ── Main ──────────────────────────────────────────────────────

export default function DataConfig() {
  const { t }                             = useTranslation();
  const { connected, provider, providerLabel } = useConfigStore();

  // Detecta opção activa com base no estado do engine
  const activeOption = !connected
    ? "demo"
    : provider === "google_sheets" || provider?.startsWith("excel") || provider?.startsWith("apple") || provider === "csv" || provider === "airtable" || provider === "notion"
      ? "sheets"
      : "database";

  const [selected, setSelected] = useState(activeOption);

  return (
    <div className="flex flex-col gap-6">

      {/* Selector das 3 opções */}
      <div className="grid grid-cols-3 gap-3">
        {DATA_OPTIONS.map(opt => (
          <OptionCard
            key={opt.id}
            opt={opt}
            isActive={selected === opt.id}
            isCurrent={activeOption === opt.id}
            onSelect={() => opt.implemented && setSelected(opt.id)}
          />
        ))}
      </div>

      {/* Conteúdo da opção seleccionada */}
      {selected === "demo"     && <DemoPanel />}
      {selected === "sheets"   && <SheetConfig />}
      {selected === "database" && <DatabasePanel />}
    </div>
  );
}

// ── Option Card ───────────────────────────────────────────────

function OptionCard({ opt, isActive, isCurrent, onSelect }) {
  const { t }      = useTranslation();
  const isDisabled = !opt.implemented;

  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
      className={`
        relative flex flex-col items-center gap-2 p-4 rounded-xl border
        text-center transition-all cursor-pointer
        ${isActive
          ? "bg-overlay border-[var(--border-focus)]"
          : isDisabled
            ? "bg-card border-default opacity-50 cursor-not-allowed"
            : "bg-card border-default hover:border-strong"}
      `}
    >
      <span className="text-2xl">{opt.icon}</span>
      <div className="text-sm font-semibold" style={{ color: isActive ? "var(--brand-light)" : "var(--text-secondary)" }}>
        {t(`settings.data.options.${opt.id}.label`)}
      </div>
      <div className="text-[11px]" style={{ color: isActive ? "var(--brand-dim)" : "var(--text-faint)" }}>
        {isDisabled ? t("common.comingSoon") : t(`settings.data.options.${opt.id}.desc`)}
      </div>

      {/* Badge de activo */}
      {isCurrent && (
        <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#4ade8022] text-success">
          {t("settings.data.active")}
        </span>
      )}

      {/* Badge em breve */}
      {isDisabled && (
        <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#2a2d3a] text-faint">
          {t("common.comingSoon")}
        </span>
      )}
    </button>
  );
}

// ── Demo Panel ────────────────────────────────────────────────

function DemoPanel() {
  const { t } = useTranslation();

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">🎭</span>
        <div>
          <div className="text-sm font-semibold text-primary">
            {t("settings.data.options.demo.label")}
          </div>
          <div className="text-xs text-faint">
            {t("settings.data.demo.subtitle")}
          </div>
        </div>
      </div>

      {/* Aviso de perda de dados */}
      <div className="flex gap-3 p-4 rounded-xl bg-warning border border-[var(--border)] mb-5">
        <span className="text-lg shrink-0">⚠️</span>
        <div className="text-xs text-warning leading-relaxed">
          <strong className="block mb-1">{t("settings.data.demo.warningTitle")}</strong>
          {t("settings.data.demo.warningDesc")}
        </div>
      </div>

      {/* Lista de dados mock disponíveis */}
      <div className="text-xs text-faint mb-3 uppercase tracking-wide font-semibold">
        {t("settings.data.demo.includes")}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: "🏦", label: t("nav.accounts") },
          { icon: "🗂",  label: t("nav.categories") },
          { icon: "🎯", label: t("nav.goals") },
          { icon: "📈", label: t("nav.investments") },
          { icon: "↕",  label: t("nav.transactions") },
          { icon: "📊", label: t("nav.budget") },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 px-3 py-2 bg-raised rounded-lg border border-default text-xs text-muted">
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Database Panel ────────────────────────────────────────────

function DatabasePanel() {
  const { t } = useTranslation();

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">🗄</span>
        <div>
          <div className="text-sm font-semibold text-primary">
            {t("settings.data.options.database.label")}
          </div>
          <div className="text-xs text-faint">
            {t("settings.data.database.subtitle")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {DB_ENGINES.map(db => (
          <div
            key={db.id}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-default bg-card opacity-60"
          >
            <span className="text-2xl">{db.icon}</span>
            <div className="text-sm font-semibold text-muted">{db.label}</div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2a2d3a] text-faint">
              {t("common.comingSoon")}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-raised border border-default text-xs text-faint leading-relaxed">
        {t("settings.data.database.desc")}
      </div>
    </Card>
  );
}