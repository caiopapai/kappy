// src/features/settings/LanguageConfig.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../../i18n";
import { Card, Button } from "../../components/ui";
import { Toast } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import { useSettingsStore } from "../../store/settingsStore";

export default function LanguageConfig() {
  const { t, i18n }           = useTranslation();
  const { toast, showToast }  = useToast();
  const { language, setLanguage } = useSettingsStore();
  const [selected, setSelected]   = useState(language || i18n.language || "pt-BR");
  const [saved,    setSaved]      = useState(false);

  async function handleSave() {
    await setLanguage(selected);
    setSaved(true);
    showToast(t("settings.language.saved"));
    setTimeout(() => setSaved(false), 3000);
  }

  const current = SUPPORTED_LANGUAGES.find(l => l.code === selected);

  return (
    <Card>
      <Toast toast={toast} />

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 pb-4 border-b border-default">
          <span className="text-2xl">{current?.flag}</span>
          <div>
            <div className="text-sm font-semibold text-primary">
              {current?.label}
            </div>
            <div className="text-xs text-faint mt-0.5">
              {t("settings.language.label")}
            </div>
          </div>
          {saved && (
            <span className="ml-auto text-xs font-semibold text-success bg-success px-2.5 py-1 rounded-full">
              ✓ {t("settings.language.saved")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {SUPPORTED_LANGUAGES.map(lang => {
            const isSelected = selected === lang.code;
            return (
              <button key={lang.code} onClick={() => setSelected(lang.code)}
                className={`
                  flex items-center gap-3 p-4 rounded-xl border text-left
                  transition-all cursor-pointer
                  ${isSelected
                    ? "bg-overlay border-[var(--border-focus)]"
                    : "bg-card border-default hover:border-strong"}
                `}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div>
                  <div className={`text-sm font-semibold ${isSelected ? "text-brand-light" : "text-secondary"}`}>
                    {lang.label}
                  </div>
                  <div className="text-xs text-faint mt-0.5">{lang.code}</div>
                </div>
                {isSelected && <span className="ml-auto text-brand text-base">✓</span>}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} disabled={selected === language}>
            {t("settings.language.saveButton")}
          </Button>
          {selected !== language && (
            <Button variant="secondary" onClick={() => setSelected(language || "pt-BR")}>
              {t("common.cancel")}
            </Button>
          )}
        </div>

        <div className="text-xs text-faint bg-raised rounded-lg p-3 border border-default">
          {t("settings.language.instantApply")}
        </div>
      </div>
    </Card>
  );
}