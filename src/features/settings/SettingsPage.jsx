// src/features/settings/SettingsPage.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui";
import SheetConfig     from "./SheetSettings";
import DataConfig      from "./DataSettings";
import LanguageConfig  from "./LanguageSettings";
import MarketApisConfig from "./MarketApisSettings";
import ThemeConfig     from "./ThemeSettings";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("language");

  const SECTIONS = [
    { id: "language",   icon: "🌐", label: t("settings.sections.language.label"),   desc: t("settings.sections.language.desc") },
    { id: "theme",      icon: "🎨", label: t("settings.sections.theme.label"),       desc: t("settings.sections.theme.desc") },
    { id: "currency",   icon: "💱", label: t("settings.sections.currency.label"),    desc: t("settings.sections.currency.desc") },
    { id: "data",       icon: "🗄", label: t("settings.sections.data.label"),       desc: t("settings.sections.data.desc") },
    { id: "marketApis", icon: "📡", label: t("settings.sections.marketApis.label"), desc: t("settings.sections.marketApis.desc") },
    { id: "backup",     icon: "💾", label: t("settings.sections.backup.label"),      desc: t("settings.sections.backup.desc") },
  ];

  const current = SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="flex gap-6 h-full">
      <aside className="w-56 shrink-0">
        <div className="text-[11px] text-faint uppercase tracking-widest font-semibold mb-3 px-1">
          {t("settings.title")}
        </div>
        <nav className="flex flex-col gap-0.5">
          {SECTIONS.map(s => {
            const isActive = activeSection === s.id;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  text-left text-sm font-medium transition-all border-l-[3px] border-0
                  ${isActive
                    ? "bg-overlay border-l-[#6366f1] text-brand-light"
                    : "border-l-transparent text-muted hover:text-secondary hover:bg-raised"}
                `}
              >
                <span className="text-base w-5 text-center">{s.icon}</span>
                <div>
                  <div>{s.label}</div>
                  <div className={`text-[11px] font-normal mt-0.5 ${isActive ? "text-[#6366f188]" : "text-faint"}`}>
                    {s.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{current.icon}</span>
          <div>
            <h2 className="text-base font-semibold text-primary m-0">{current.label}</h2>
            <div className="text-xs text-faint mt-0.5">{current.desc}</div>
          </div>
        </div>

        {activeSection === "language"   && <LanguageConfig />}
        {activeSection === "theme"      && <ThemeConfig />}
        {activeSection === "currency"   && <ComingSoon label={t("settings.sections.currency.label")} />}
        {activeSection === "data"       && <DataConfig />}
        {activeSection === "marketApis" && <MarketApisConfig />}
        {activeSection === "backup"     && <ComingSoon label={t("settings.sections.backup.label")} />}
      </div>
    </div>
  );
}

function ComingSoon({ label }) {
  const { t } = useTranslation();
  return (
    <Card>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-4">🚧</div>
        <div className="text-[15px] text-secondary mb-2">{label}</div>
        <div className="text-sm text-faint">{t("common.comingSoon")}</div>
      </div>
    </Card>
  );
}