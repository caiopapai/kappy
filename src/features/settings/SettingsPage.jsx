// src/features/settings/SettingsPage.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui";
import SheetConfig     from "./SheetConfig";
import LanguageConfig  from "./LanguageConfig";
import MarketApisConfig from "./MarketApisConfig";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("language");

  const SECTIONS = [
    { id: "language",   icon: "🌐", label: t("settings.sections.language.label"),   desc: t("settings.sections.language.desc") },
    { id: "theme",      icon: "🎨", label: t("settings.sections.theme.label"),       desc: t("settings.sections.theme.desc") },
    { id: "currency",   icon: "💱", label: t("settings.sections.currency.label"),    desc: t("settings.sections.currency.desc") },
    { id: "sheet",      icon: "🔗", label: t("settings.sections.sheet.label"),       desc: t("settings.sections.sheet.desc") },
    { id: "marketApis", icon: "📡", label: t("settings.sections.marketApis.label"), desc: t("settings.sections.marketApis.desc") },
    { id: "backup",     icon: "💾", label: t("settings.sections.backup.label"),      desc: t("settings.sections.backup.desc") },
  ];

  const current = SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="flex gap-6 h-full">
      <aside className="w-56 shrink-0">
        <div className="text-[11px] text-[#5a5f78] uppercase tracking-widest font-semibold mb-3 px-1">
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

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{current.icon}</span>
          <div>
            <h2 className="text-base font-semibold text-[#f0ede8] m-0">{current.label}</h2>
            <div className="text-xs text-[#5a5f78] mt-0.5">{current.desc}</div>
          </div>
        </div>

        {activeSection === "language"   && <LanguageConfig />}
        {activeSection === "theme"      && <ComingSoon label={t("settings.sections.theme.label")} />}
        {activeSection === "currency"   && <ComingSoon label={t("settings.sections.currency.label")} />}
        {activeSection === "sheet"      && <SheetConfig />}
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
        <div className="text-[15px] text-[#c4c0b8] mb-2">{label}</div>
        <div className="text-sm text-[#5a5f78]">{t("common.comingSoon")}</div>
      </div>
    </Card>
  );
}