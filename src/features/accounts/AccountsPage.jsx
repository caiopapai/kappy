// src/features/accounts/AccountsPage.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccountsStore } from "../../store/accountsStore";
import { useToast } from "../../hooks/useToast";
import { ACCOUNT_TYPES, CURRENCY_SYMBOLS } from "../../data/constants";
import { Button, Select, Card } from "../../components/ui";
import { Toast } from "../../components/ui/Toast";

function accountIcon(type) {
  return ACCOUNT_TYPES.find(a => a.value === type)?.icon || "💰";
}

function formatCurrency(amount, currency) {
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  return sym + " " + Math.abs(amount).toLocaleString("pt-PT", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

export default function AccountsPage() {
  const { t } = useTranslation();
  const { accounts, save, delete: deleteAccount } = useAccountsStore();
  const { toast, showToast } = useToast();

  const emptyForm = { name: "", type: "checking", balance: "", currency: "EUR" };
  const [form,      setForm]      = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const [errors,    setErrors]    = useState({});
  const [saving,    setSaving]    = useState(false);

  function validate() {
    const e = {};
    if (!form.name.trim())                                       e.name    = t("common.required");
    if (form.balance === "")                                     e.balance = t("common.required");
    else if (isNaN(parseFloat(form.balance.replace(",",".")))) e.balance = t("common.invalid");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (saving) return;
    if (!validate()) return;
    setSaving(true);
    const bal = parseFloat(form.balance.replace(",", "."));
    try {
      if (editingId !== null) {
        await save({ id: editingId, ...form, balance: bal });
        showToast(t("accounts.toast.updated"));
      } else {
        await save({ ...form, balance: bal });
        showToast(t("accounts.toast.created"));
      }
      handleCancel();
    } catch {
      showToast(t("common.connectionError"), "error");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(acc) {
    setForm({ name: acc.name, type: acc.type, balance: String(acc.balance), currency: acc.currency });
    setEditingId(acc.id);
    setErrors({});
    setShowForm(true);
  }

  async function handleDelete(id) {
    try {
      await deleteAccount(id);
      showToast(t("accounts.toast.deleted"));
    } catch {
      showToast(t("common.connectionError"), "error");
    }
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
    setShowForm(false);
  }

  const balanceNum   = parseFloat((form.balance || "").replace(",", "."));
  const balanceValid = form.balance !== "" && !isNaN(balanceNum);

  return (
    <div
      data-testid="accounts-page"
      className="grid gap-5"
      style={{ gridTemplateColumns: "1.4fr 1fr" }}
    >
      <Toast toast={toast} />

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-primary">{t("accounts.title")}</h2>
          <Button data-testid="account-add-btn" onClick={() => { handleCancel(); setShowForm(true); }}>
            + {t("accounts.add")}
          </Button>
        </div>

        <div data-testid="accounts-list" className="flex flex-col gap-2">
          {accounts.map(acc => (
            <AccountCard
              key={acc.id}
              account={acc}
              isEditing={editingId === acc.id}
              onEdit={() => handleEdit(acc)}
              onDelete={() => handleDelete(acc.id)}
            />
          ))}
          {accounts.length === 0 && (
            <Card data-testid="accounts-empty" className="text-center text-faint py-10">
              {t("accounts.empty")}
            </Card>
          )}
        </div>
      </div>

      {showForm && (
        <AccountForm
          form={form} setForm={setForm} errors={errors}
          editingId={editingId} balanceNum={balanceNum}
          balanceValid={balanceValid} saving={saving}
          onSave={handleSave} onCancel={handleCancel}
        />
      )}
    </div>
  );
}

function AccountCard({ account, isEditing, onEdit, onDelete }) {
  const { t }      = useTranslation();
  const isPositive = account.balance >= 0;
  const typeInfo   = ACCOUNT_TYPES.find(a => a.value === account.type);

  return (
    <div
      data-testid={`account-card-${account.id}`}
      data-account-id={account.id}
      data-account-name={account.name}
      className="flex justify-between items-center p-4 rounded-xl border transition-colors bg-raised"
      style={{
        borderColor: isEditing
          ? "var(--border-focus)"
          : isPositive ? "var(--success-bg)" : "var(--danger-bg)",
        background: isEditing ? "var(--surface-overlay)" : undefined,
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{accountIcon(account.type)}</span>
        <div>
          <div data-testid="account-name" className="text-[15px] font-semibold text-primary">
            {account.name}
          </div>
          <div className="text-xs text-faint">
            {typeInfo ? t("accounts.types." + account.type) : account.type} · {account.currency}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span
          data-testid="account-balance"
          className="text-base font-bold tabular-nums"
          style={{ color: isPositive ? "var(--success)" : "var(--danger)" }}
        >
          {account.balance < 0 ? "-" : ""}{formatCurrency(account.balance, account.currency)}
        </span>
        <div className="flex gap-1.5">
          <Button data-testid="account-edit-btn"   variant="secondary" size="sm" onClick={onEdit}>
            {t("common.edit")}
          </Button>
          <Button data-testid="account-delete-btn" variant="danger"    size="sm" onClick={onDelete}>
            {t("common.delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AccountForm({ form, setForm, errors, editingId, balanceNum, balanceValid, saving, onSave, onCancel }) {
  const { t }     = useTranslation();
  const set       = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const isEditing = editingId !== null;

  return (
    <Card
      data-testid="account-form"
      style={{ borderColor: isEditing ? "var(--border-focus)" : undefined }}
    >
      <div className="text-sm font-semibold text-brand-light mb-5">
        {isEditing ? "✏ " + t("accounts.edit") : "+ " + t("accounts.add")}
      </div>
      <div className="flex flex-col gap-4">

        <div className="flex flex-col gap-1.5">
          <label className="label-base">{t("accounts.form.name")}</label>
          <input
            data-testid="account-name-input"
            type="text"
            placeholder={t("accounts.form.namePlaceholder")}
            value={form.name}
            onChange={set("name")}
            className={`input-base ${errors.name ? "error" : ""}`}
          />
        </div>

        <Select data-testid="account-type-select" label={t("accounts.form.type")}
          value={form.type} onChange={set("type")}>
          {ACCOUNT_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.icon} {t("accounts.types." + type.value)}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="label-base">{t("accounts.form.balance")}</label>
            <input
              data-testid="account-balance-input"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={form.balance}
              onChange={set("balance")}
              className={`input-base ${errors.balance ? "error" : ""}`}
            />
          </div>

          <Select data-testid="account-currency-select" label={t("accounts.form.currency")}
            value={form.currency} onChange={set("currency")}>
            <option value="EUR">€ {t("common.currencies.EUR")}</option>
            <option value="BRL">R$ {t("common.currencies.BRL")}</option>
            <option value="USD">$ {t("common.currencies.USD")}</option>
          </Select>
        </div>

        {balanceValid && (
          <div
            data-testid={balanceNum >= 0 ? "balance-positive-badge" : "balance-negative-badge"}
            className="px-3 py-2.5 rounded-lg text-sm font-semibold"
            style={{
              background: balanceNum >= 0 ? "var(--success-bg)" : "var(--danger-bg)",
              color:      balanceNum >= 0 ? "var(--success)"    : "var(--danger)",
            }}
          >
            {balanceNum >= 0 ? t("accounts.balance.positive") : t("accounts.balance.negative")}
          </div>
        )}

        <div data-testid="form-errors" className="flex flex-col gap-1">
          {errors.name    && <span data-testid="error-name"    className="text-xs text-danger">{errors.name}</span>}
          {errors.balance && <span data-testid="error-balance" className="text-xs text-danger">{errors.balance}</span>}
        </div>

        <div className="flex gap-2 mt-1">
          <Button data-testid="account-save-btn" onClick={onSave} disabled={saving}>
            {saving ? "..." : t("common.save")}
          </Button>
          <Button data-testid="account-cancel-btn" variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    </Card>
  );
}