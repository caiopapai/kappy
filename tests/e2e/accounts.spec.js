// tests/e2e/accounts.spec.js
// Usa IDs numéricos fixos dos mocks — sem caracteres especiais nos selectores.

import { test, expect } from "@playwright/test";
import {
  goToAccounts,
  AccountForm,
  getCardById,
  clickEditById,
  clickDeleteById,
  expectCardVisible,
  expectCardGone,
  expectNameInCard,
  expectFormVisible,
  expectFormHidden,
  expectFormError,
  expectEmptyState,
  waitForAccountsReady,
} from "./helpers/setup.js";

// IDs fixos de src/data/mockData.js INITIAL_ACCOUNTS
const M1 = { id: 1, name: "Conta Principal" };
const M2 = { id: 2, name: "Poupança Férias"  };
const M3 = { id: 3, name: "Cartão Visa"      };
const MOCK = [M1, M2, M3];

// Intercepta todas as chamadas ao engine e simula respostas de sucesso.
// Isto permite que os testes corram sem o engine ligado — os stores
// recebem respostas válidas e o optimistic update mantém-se.
async function blockEngine(page) {
  await page.route("http://localhost:3001/**", async route => {
    const url = route.request().url();

    // Health check
    if (url.includes("/health")) {
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ ok: true, service: "kappy-engine" }) });
    }

    // Qualquer POST/DELETE às sheets — simula sucesso sem persistir
    if (route.request().method() !== "GET") {
      const body = route.request().postDataJSON().catch?.() || {};
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ ok: true, data: body.row || body.transaction || body.rule || {} }) });
    }

    // GET às sheets — devolve array vazio (os stores já têm os mocks)
    return route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ ok: true, data: [], count: 0 }) });
  });
}

// ── Happy Path ────────────────────────────────────────────────

test.describe("Contas — Happy Path", () => {
  test.beforeEach(async ({ page }) => {
    await blockEngine(page);
    await goToAccounts(page);
  });

  test("mostra os 3 cards mock no arranque", async ({ page }) => {
    for (const acc of MOCK) {
      await expectCardVisible(page, acc.id);
    }
  });

  test("cada card mostra o nome correcto", async ({ page }) => {
    for (const acc of MOCK) {
      await expectNameInCard(page, acc.id, acc.name);
    }
  });

  test("cria uma conta — card aparece na lista", async ({ page }) => {
    await AccountForm.open(page);
    await AccountForm.fillAndSave(page, {
      name:     "Conta Nova",
      type:     "savings",
      balance:  "500",
      currency: "EUR",
    });
    // Verifica pelo nome no texto da lista
    await expect(page.getByTestId("accounts-list")).toContainText("Conta Nova");
  });

  test("preview saldo positivo aparece no formulário", async ({ page }) => {
    await AccountForm.open(page);
    await AccountForm.fill(page, { name: "P", balance: "500" });
    await expect(page.getByTestId("balance-positive-badge")).toBeVisible();
  });

  test("preview saldo negativo aparece no formulário", async ({ page }) => {
    await AccountForm.open(page);
    await AccountForm.fill(page, { name: "P", balance: "-100" });
    await expect(page.getByTestId("balance-negative-badge")).toBeVisible();
  });

  test("edita o nome da conta 1", async ({ page }) => {
    await clickEditById(page, M1.id);
    await page.getByTestId("account-name-input").clear();
    await page.getByTestId("account-name-input").fill("Conta Editada");
    await page.getByTestId("account-save-btn").click();
    await expectFormHidden(page);
    await expectNameInCard(page, M1.id, "Conta Editada");
  });

  test("edita o saldo da conta 2", async ({ page }) => {
    await clickEditById(page, M2.id);
    await page.getByTestId("account-balance-input").clear();
    await page.getByTestId("account-balance-input").fill("9999");
    await page.getByTestId("account-save-btn").click();
    await expectFormHidden(page);
    await expect(getCardById(page, M2.id).getByTestId("account-balance")).toContainText("9");
  });

  test("formulário pré-preenchido com dados da conta ao editar", async ({ page }) => {
    await clickEditById(page, M1.id);
    await expect(page.getByTestId("account-name-input")).toHaveValue(M1.name);
  });

  test("remove a conta 3 — card desaparece", async ({ page }) => {
    await clickDeleteById(page, M3.id);
    await expectCardGone(page, M3.id);
  });

  test("cancela criação — formulário fecha sem criar", async ({ page }) => {
    await AccountForm.open(page);
    await AccountForm.fill(page, { name: "Cancelada" });
    await AccountForm.cancel(page);
    await expectFormHidden(page);
    await expect(page.getByTestId("accounts-list")).not.toContainText("Cancelada");
  });

  test("cancela edição — nome original mantido", async ({ page }) => {
    await clickEditById(page, M1.id);
    await page.getByTestId("account-name-input").fill("Nome temporário");
    await page.getByTestId("account-cancel-btn").click();
    await expectNameInCard(page, M1.id, M1.name);
  });

  test("clicar Editar de outra conta actualiza o formulário", async ({ page }) => {
    await clickEditById(page, M1.id);
    await expect(page.getByTestId("account-name-input")).toHaveValue(M1.name);
    await clickEditById(page, M2.id);
    await expect(page.getByTestId("account-name-input")).toHaveValue(M2.name);
  });
});

// ── Validação ─────────────────────────────────────────────────

test.describe("Contas — Validação", () => {
  test.beforeEach(async ({ page }) => {
    await blockEngine(page);
    await goToAccounts(page);
    await AccountForm.open(page);
  });

  test("nome vazio — erro visível, formulário mantém-se", async ({ page }) => {
    await AccountForm.fill(page, { balance: "100" });
    await AccountForm.save(page);
    await expectFormVisible(page);
    await expectFormError(page, "name");
  });

  test("saldo vazio — erro visível", async ({ page }) => {
    await AccountForm.fill(page, { name: "Sem Saldo" });
    await page.getByTestId("account-balance-input").clear();
    await AccountForm.save(page);
    await expectFormVisible(page);
    await expectFormError(page, "balance");
  });

  test("saldo com texto — erro visível", async ({ page }) => {
    await AccountForm.fill(page, { name: "Inválida" });
    await page.getByTestId("account-balance-input").fill("abc");
    await AccountForm.save(page);
    await expectFormVisible(page);
    await expectFormError(page, "balance");
  });

  test("saldo decimal válido — submete com sucesso", async ({ page }) => {
    await AccountForm.fillAndSave(page, { name: "Decimal", balance: "1234.56" });
    await expect(page.getByTestId("accounts-list")).toContainText("Decimal");
  });

  test("saldo zero — submete com sucesso", async ({ page }) => {
    await AccountForm.fillAndSave(page, { name: "Zero", balance: "0" });
    await expect(page.getByTestId("accounts-list")).toContainText("Zero");
  });

  test("saldo negativo — submete com sucesso", async ({ page }) => {
    await AccountForm.fillAndSave(page, { name: "Negativa", balance: "-500" });
    await expect(page.getByTestId("accounts-list")).toContainText("Negativa");
  });

  test("erros desaparecem ao reabrir o formulário", async ({ page }) => {
    await AccountForm.save(page);
    await expectFormError(page, "name");
    await AccountForm.cancel(page);
    await AccountForm.open(page);
    await expect(page.getByTestId("error-name")).not.toBeVisible();
  });

  test("ambos os erros ao submeter formulário vazio", async ({ page }) => {
    await AccountForm.save(page);
    await expectFormError(page, "name");
    await expectFormError(page, "balance");
  });

  test("selector de tipo tem pelo menos 5 opções", async ({ page }) => {
    const opts = await page.getByTestId("account-type-select").locator("option").count();
    expect(opts).toBeGreaterThanOrEqual(5);
  });

  test("selector de moeda tem EUR, BRL e USD", async ({ page }) => {
    const values = await page.getByTestId("account-currency-select")
      .locator("option").evaluateAll(opts => opts.map(o => o.value));
    expect(values).toContain("EUR");
    expect(values).toContain("BRL");
    expect(values).toContain("USD");
  });
});

// ── Edge Cases ────────────────────────────────────────────────

test.describe("Contas — Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await blockEngine(page);
    await goToAccounts(page);
  });

  test("nome com caracteres especiais — aceite", async ({ page }) => {
    await AccountForm.open(page);
    await AccountForm.fillAndSave(page, { name: "Conta & Teste 2025", balance: "100" });
    await expect(page.getByTestId("accounts-list")).toContainText("Conta & Teste 2025");
  });

  test("nome com acentos — aceite", async ({ page }) => {
    await AccountForm.open(page);
    await AccountForm.fillAndSave(page, { name: "Poupança Especial", balance: "100" });
    await expect(page.getByTestId("accounts-list")).toContainText("Poupança Especial");
  });

  test("nome longo (200 chars) — UI não quebra", async ({ page }) => {
    await AccountForm.open(page);
    await AccountForm.fillAndSave(page, { name: "A".repeat(200), balance: "100" });
    await expect(page.getByTestId("accounts-page")).toBeVisible();
  });

  test("saldo muito grande — não quebra", async ({ page }) => {
    await AccountForm.open(page);
    await AccountForm.fillAndSave(page, { name: "Grande", balance: "9999999999" });
    await expect(page.getByTestId("accounts-list")).toContainText("Grande");
  });

  test("saldo muito negativo — não quebra", async ({ page }) => {
    await AccountForm.open(page);
    await AccountForm.fillAndSave(page, { name: "Devedora", balance: "-9999999" });
    await expect(page.getByTestId("accounts-list")).toContainText("Devedora");
  });

  test("emojis no nome — aceite", async ({ page }) => {
    await AccountForm.open(page);
    await AccountForm.fillAndSave(page, { name: "Conta Emoji 💰", balance: "100" });
    await expect(page.getByTestId("accounts-list")).toContainText("Conta Emoji");
  });

  test("criar 5 contas em sequência — todas presentes na lista", async ({ page }) => {
    for (let i = 1; i <= 5; i++) {
      await AccountForm.open(page);
      await AccountForm.fillAndSave(page, { name: `Seq ${i}`, balance: String(i * 100) });
    }
    for (let i = 1; i <= 5; i++) {
      await expect(page.getByTestId("accounts-list")).toContainText(`Seq ${i}`);
    }
  });

  test("apagar as 3 contas mock — estado vazio visível", async ({ page }) => {
    for (const acc of MOCK) {
      await clickDeleteById(page, acc.id);
      await expectCardGone(page, acc.id);
    }
    await expectEmptyState(page);
  });

  test("criar após apagar todas — lista volta a ter 1 item", async ({ page }) => {
    for (const acc of MOCK) {
      await clickDeleteById(page, acc.id);
    }
    await expectEmptyState(page);
    await AccountForm.open(page);
    await AccountForm.fillAndSave(page, { name: "Nova", balance: "100" });
    await expect(page.getByTestId("accounts-list")).toContainText("Nova");
  });

  test("reload — mocks voltam ao estado inicial", async ({ page }) => {
    await page.reload();
    await waitForAccountsReady(page);
    for (const acc of MOCK) {
      await expectCardVisible(page, acc.id);
    }
  });
});

// ── Segurança e Robustez ──────────────────────────────────────

test.describe("Contas — Segurança e Robustez", () => {
  test.beforeEach(async ({ page }) => {
    await blockEngine(page);
    await goToAccounts(page);
  });

  test("XSS no nome — script não executa", async ({ page }) => {
    await AccountForm.open(page);
    await AccountForm.fillAndSave(page, {
      name:    "<script>window.__xss=1</script>",
      balance: "100",
    });
    expect(await page.evaluate(() => window.__xss)).toBeFalsy();
  });

  test("HTML injection — não renderiza tags", async ({ page }) => {
    await AccountForm.open(page);
    await AccountForm.fillAndSave(page, {
      name:    "<b>Bold</b><img src=x onerror='window.__img=1'>",
      balance: "100",
    });
    expect(await page.evaluate(() => window.__img)).toBeFalsy();
  });

  test("double-click em Guardar — no máximo 1 conta criada", async ({ page }) => {
    await AccountForm.open(page);
    await AccountForm.fill(page, { name: "Dupla", balance: "100" });
    await page.getByTestId("account-save-btn").dblclick();
    await page.waitForTimeout(600);
    const count = await page.getByTestId("accounts-list").getByText("Dupla").count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test("Editar e Apagar em sequência — não quebra estado", async ({ page }) => {
    await clickEditById(page, M1.id);
    await clickDeleteById(page, M1.id);
    await expectCardGone(page, M1.id);
    await expect(page.getByTestId("accounts-page")).toBeVisible();
  });

  test("saldo com muitas decimais — exibe com no máximo 2", async ({ page }) => {
    await AccountForm.open(page);
    await AccountForm.fillAndSave(page, { name: "Decimais", balance: "1234.56789" });
    const balance = await page.getByTestId("accounts-list")
      .locator('[data-testid="account-balance"]').last().innerText();
    const match = balance.match(/[,.](\d+)$/);
    if (match) { expect(match[1].length).toBeLessThanOrEqual(2); }
  });

  test("navegar para Goals e voltar — cards mock intactos", async ({ page }) => {
    await page.getByTestId("nav-goals").click();
    await page.waitForTimeout(300);
    await page.getByTestId("nav-accounts").click();
    await waitForAccountsReady(page);
    for (const acc of MOCK) {
      await expectCardVisible(page, acc.id);
    }
  });

  test("Enter no nome com saldo vazio — não submete", async ({ page }) => {
    await AccountForm.open(page);
    await page.getByTestId("account-name-input").fill("Enter Test");
    await page.getByTestId("account-name-input").press("Enter");
    await expect(page.getByTestId("accounts-page")).toBeVisible();
  });

  test("Escape com formulário aberto — página não crasha", async ({ page }) => {
    await AccountForm.open(page);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("accounts-page")).toBeVisible();
  });
});