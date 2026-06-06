// src/features/settings/ThemeConfig.jsx
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../store/settingsStore";

const THEMES = [
  {
    id:    "dark",
    icon:  "🌙",
    preview: {
      bg:     "#0f1117",
      card:   "#161820",
      text:   "#e8e6e0",
      muted:  "#5a5f78",
      accent: "#6366f1",
    },
  },
  {
    id:    "light",
    icon:  "☀️",
    preview: {
      bg:     "#f0f2f5",
      card:   "#ffffff",
      text:   "#1a1a2e",
      muted:  "#8a8fa8",
      accent: "#6366f1",
    },
  },
];

export default function ThemeConfig() {
  const { t }              = useTranslation();
  const { theme, setTheme } = useSettingsStore();

  return (
    <div className="flex flex-col gap-6">

      {/* Switch toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-default bg-card">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{theme === "dark" ? "🌙" : "☀️"}</span>
          <div>
            <div className="text-sm font-semibold text-primary">
              {t("settings.theme.current")}: {t("settings.theme." + theme)}
            </div>
            <div className="text-xs text-faint mt-0.5">
              {t("settings.theme.hint")}
            </div>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors cursor-pointer border-0"
          style={{
            background: theme === "light" ? "var(--brand)" : "var(--border-strong)",
          }}
          aria-label={t("settings.theme.toggle")}
        >
          <span
            className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200"
            style={{ transform: theme === "light" ? "translateX(32px)" : "translateX(4px)" }}
          />
        </button>
      </div>

      {/* Preview cards */}
      <div className="grid grid-cols-2 gap-4">
        {THEMES.map(th => {
          const isActive = theme === th.id;
          return (
            <button
              key={th.id}
              onClick={() => setTheme(th.id)}
              className="text-left rounded-xl border-2 overflow-hidden cursor-pointer transition-all"
              style={{
                borderColor: isActive ? "var(--brand)" : "var(--border)",
                background:  "transparent",
              }}
            >
              {/* Mini preview */}
              <div className="p-3" style={{ background: th.preview.bg }}>
                {/* Fake sidebar */}
                <div className="flex gap-2 mb-2">
                  <div className="w-16 rounded" style={{ background: th.preview.card, height: 56 }}>
                    {[1,2,3].map(i => (
                      <div key={i} className="mx-1.5 my-1.5 h-1.5 rounded-full"
                        style={{ background: th.preview.muted, opacity: 0.4, width: i === 1 ? "60%" : i === 2 ? "80%" : "50%" }} />
                    ))}
                  </div>
                  {/* Fake content */}
                  <div className="flex-1">
                    <div className="h-3 rounded mb-1.5" style={{ background: th.preview.card, width: "70%" }} />
                    <div className="h-6 rounded mb-1" style={{ background: th.preview.card }} />
                    <div className="h-6 rounded" style={{ background: th.preview.card }} />
                  </div>
                </div>
                {/* Fake accent */}
                <div className="h-2 rounded-full" style={{ background: th.preview.accent, width: "40%", opacity: 0.8 }} />
              </div>

              {/* Label */}
              <div className="px-3 py-2 flex items-center justify-between"
                style={{ background: isActive ? "var(--brand-dim)" : "var(--surface-raised)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{th.icon}</span>
                  <span className="text-sm font-semibold"
                    style={{ color: isActive ? "var(--brand-light)" : "var(--text-muted)" }}>
                    {t("settings.theme." + th.id)}
                  </span>
                </div>
                {isActive && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--brand)", color: "#fff" }}>
                    ✓
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}