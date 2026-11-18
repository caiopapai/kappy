// tests/e2e/helpers/setup.js
// Usa data-testid e data-account-id (numérico) — sem caracteres especiais nos selectores.

import { expect } from "@playwright/test";

export async function goToAccounts(page) {
  await page.goto("/accounts");
  await expect(page.getByTestId("accounts-page")).toBeVisible({ timeout: 10000 });
}

// Encontra card pelo ID numérico — sem problemas de encoding
export function getCardById(page, id) {
  return page.locator(`[data-account-id="${id}"]`);
}

export const AccountForm = {
  open: async (page) => {
    await page.getByTestId("account-add-btn").click();
    await expect(page.getByTestId("account-form")).toBeVisible({ timeout: 5000 });
  },

  fill: async (page, { name, type, balance, currency } = {}) => {
    if (name !== undefined) {
      await page.getByTestId("account-name-input").clear();
      await page.getByTestId("account-name-input").fill(name);
    }
    if (type !== undefined) {
      await page.getByTestId("account-type-select").selectOption({ value: type });
    }
    if (balance !== undefined) {
      await page.getByTestId("account-balance-input").clear();
      await page.getByTestId("account-balance-input").fill(String(balance));
    }
    if (currency !== undefined) {
      await page.getByTestId("account-currency-select").selectOption(currency);
    }
  },

  save: async (page) => {
    await page.getByTestId("account-save-btn").click();
  },

  cancel: async (page) => {
    await page.getByTestId("account-cancel-btn").click();
  },

  fillAndSave: async (page, data) => {
    await AccountForm.fill(page, data);
    await AccountForm.save(page);
    // Aguarda o formulário fechar
    await expect(page.getByTestId("account-form")).not.toBeVisible({ timeout: 5000 });
  },
};

export async function clickEditById(page, id) {
  await getCardById(page, id).getByTestId("account-edit-btn").click();
  await expect(page.getByTestId("account-form")).toBeVisible({ timeout: 3000 });
}

export async function clickDeleteById(page, id) {
  await getCardById(page, id).getByTestId("account-delete-btn").click();
}

export async function expectCardVisible(page, id) {
  await expect(getCardById(page, id)).toBeVisible({ timeout: 5000 });
}

export async function expectCardGone(page, id) {
  await expect(getCardById(page, id)).not.toBeVisible({ timeout: 5000 });
}

export async function expectNameInCard(page, id, name) {
  await expect(getCardById(page, id).getByTestId("account-name")).toContainText(name, { timeout: 3000 });
}

export async function expectFormVisible(page) {
  await expect(page.getByTestId("account-form")).toBeVisible({ timeout: 3000 });
}

export async function expectFormHidden(page) {
  await expect(page.getByTestId("account-form")).not.toBeVisible({ timeout: 5000 });
}

export async function expectFormError(page, field) {
  await expect(page.getByTestId(`error-${field}`)).toBeVisible({ timeout: 3000 });
}

export async function expectEmptyState(page) {
  await expect(page.getByTestId("accounts-empty")).toBeVisible({ timeout: 5000 });
}

export async function waitForAccountsReady(page) {
  await expect(page.getByTestId("accounts-page")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("accounts-list")).toBeVisible({ timeout: 5000 });
}