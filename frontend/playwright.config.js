// playwright.config.js
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir:   "./tests/e2e",
  fullyParallel: false,       // sequencial — evita conflitos de estado
  retries:   1,               // 1 retry em CI para flakiness de timing
  workers:   1,
  reporter:  [["list"], ["html", { open: "never" }]],

  use: {
    baseURL:      "http://localhost:5173",
    browserName:  "chromium",
    headless:     false,
    viewport:     { width: 1280, height: 800 },
    screenshot:   "only-on-failure",
    video:        "retain-on-failure",
    trace:        "retain-on-failure",
    // Timeout por acção (click, fill, etc.)
    actionTimeout: 5000,
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  // Arranca o Vite antes dos testes e fecha no fim
  webServer: {
    command:            "npm run dev",
    url:                "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout:            15000,
    env: {
      // Força modo mock nos testes E2E — engine não é necessário
      VITE_ENGINE_URL: "",
    },
  },
});
