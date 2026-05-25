import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, setLanguage } from "../../i18n";
import { Card, Button, Select } from "../../components/ui";
import { Toast } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";

export default function LanguageConfig() {
  const { t, i18n }    = useTranslation();
  const { toast, showToast } = useToast();
  const [selected, setSelected] = useState(i18n.language || "pt-BR");
  const [saved,    setSaved]    = useState(false);

  function handleSave() {
    setLanguage(selected);
    setSaved(true);
    showToast(t("settings.language.saved"));
    setTimeout(() => setSaved(false), 3000);
  }

  const current = SUPPORTED_LANGUAGES.find(l => l.code === selected);

  return (
    <Card>
      <Toast toast={toast} />

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 pb-4 border-b border-[#2a2d3a]">
          <span className="text-2xl">{current?.flag}</span>
          <div>
            <div className="text-sm font-semibold text-[#e8e6e0]">
              {current?.label}
            </div>
            <div className="text-xs text-[#5a5f78] mt-0.5">
              {t("settings.language.label")}
            </div>
          </div>
          {saved && (
            <span className="ml-auto text-xs font-semibold text-[#4ade80] bg-[#1f3a2a] px-2.5 py-1 rounded-full">
              ✓ {t("settings.language.saved")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {SUPPORTED_LANGUAGES.map(lang => {
            const isSelected = selected === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setSelected(lang.code)}
                className={`
                  flex items-center gap-3 p-4 rounded-xl border text-left
                  transition-all cursor-pointer
                  ${isSelected
                    ? "bg-[#1e2235] border-[#6366f1]"
                    : "bg-[#161820] border-[#2a2d3a] hover:border-[#3a3d52]"}
                `}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div>
                  <div className={`text-sm font-semibold ${isSelected ? "text-[#a5b4fc]" : "text-[#c4c0b8]"}`}>
                    {lang.label}
                  </div>
                  <div className="text-xs text-[#5a5f78] mt-0.5">{lang.code}</div>
                </div>
                {isSelected && (
                  <span className="ml-auto text-[#6366f1] text-base">✓</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            onClick={handleSave}
            disabled={selected === i18n.language}
          >
            {t("settings.language.saveButton")}
          </Button>
          {selected !== i18n.language && (
            <Button
              variant="secondary"
              onClick={() => setSelected(i18n.language || "pt-BR")}
            >
              {t("common.cancel")}
            </Button>
          )}
        </div>

        <div className="text-xs text-[#5a5f78] bg-[#1a1d2e] rounded-lg p-3 border border-[#2a2d3a]">
          {t("settings.language.instantApply")}
        </div>
      </div>
    </Card>
  );
}