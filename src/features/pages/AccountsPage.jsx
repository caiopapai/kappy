import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccountsStore } from "../../store/accountsStore";
import { useToast } from "../../hooks/useToast";
import { ACCOUNT_TYPES, CURRENCY_SYMBOLS } from "../../data/constants";
import { Button, Input, Select, Card } from "../../components/ui";
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

  function validate() {
    const e = {};
    if (!form.name.trim())               e.name    = t("common.required");
    if (form.balance === "")             e.balance = t("common.required");
    if (isNaN(parseFloat(form.balance))) e.balance = t("common.invalid");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const bal = parseFloat(form.balance);
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

  const balanceNum   = parseFloat(form.balance);
  const balanceValid = form.balance !== "" && !isNaN(balanceNum);

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
      <Toast toast={toast} />

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-[#f0ede8]">{t("accounts.title")}</h2>
          <Button onClick={() => { handleCancel(); setShowForm(true); }}>
            + {t("accounts.add")}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {accounts.map(acc => (
            <AccountCard
              key={acc.id}
              account={acc}
              isEditing={editingId === acc.id}
              onEdit={() => handleEdit(acc)}
              onDelete={() => handleDelete(acc.id)}
              formatCurrency={formatCurrency}
            />
          ))}
          {accounts.length === 0 && (
            <Card className="text-center text-[#5a5f78] py-10">
              {t("accounts.empty")}
            </Card>
          )}
        </div>
      </div>

      {showForm && (
        <AccountForm
          form={form}
          setForm={setForm}
          errors={errors}
          editingId={editingId}
          balanceNum={balanceNum}
          balanceValid={balanceValid}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

function AccountCard({ account, isEditing, onEdit, onDelete, formatCurrency }) {
  const { t } = useTranslation();
  const isPositive = account.balance >= 0;
  const typeInfo = ACCOUNT_TYPES.find(a => a.value === account.type);

  return (
    <div className={`
      flex justify-between items-center p-4 rounded-xl border transition-colors
      ${isEditing ? "bg-[#1e2235] border-[#6366f1]"
        : isPositive ? "bg-[#1a1d2e] border-[#1f3a2a]"
        : "bg-[#1a1d2e] border-[#3a1f1f]"}
    `}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{accountIcon(account.type)}</span>
        <div>
          <div className="text-[15px] font-semibold text-[#e8e6e0]">{account.name}</div>
          <div className="text-xs text-[#5a5f78]">
            {typeInfo ? t("accounts.types." + account.type) : account.type} · {account.currency}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className={`text-base font-bold tabular-nums ${isPositive ? "text-[#4ade80]" : "text-[#f87171]"}`}>
          {account.balance < 0 ? "-" : ""}{formatCurrency(account.balance, account.currency)}
        </span>
        <div className="flex gap-1.5">
          <Button variant="secondary" size="sm" onClick={onEdit}>{t("common.edit")}</Button>
          <Button variant="danger"    size="sm" onClick={onDelete}>{t("common.delete")}</Button>
        </div>
      </div>
    </div>
  );
}

function AccountForm({ form, setForm, errors, editingId, balanceNum, balanceValid, onSave, onCancel }) {
  const { t } = useTranslation();
  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const isEditing = editingId !== null;

  return (
    <Card className={isEditing ? "border-[#6366f1]" : ""}>
      <div className="text-sm font-semibold text-[#a5b4fc] mb-5">
        {isEditing ? "✏ " + t("accounts.edit") : "+ " + t("accounts.add")}
      </div>
      <div className="flex flex-col gap-4">
        <Input
          label={t("accounts.form.name")}
          placeholder={t("accounts.form.namePlaceholder")}
          value={form.name}
          onChange={set("name")}
          error={errors.name}
        />
        <Select label={t("accounts.form.type")} value={form.type} onChange={set("type")}>
          {ACCOUNT_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.icon} {t("accounts.types." + type.value)}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("accounts.form.balance")}
            type="number" step="0.01" placeholder="0.00"
            value={form.balance}
            onChange={set("balance")}
            error={errors.balance}
          />
          <Select label={t("accounts.form.currency")} value={form.currency} onChange={set("currency")}>
            <option value="EUR">€ {t("common.currencies.EUR")}</option>
            <option value="BRL">R$ {t("common.currencies.BRL")}</option>
            <option value="USD">$ {t("common.currencies.USD")}</option>
          </Select>
        </div>
        {balanceValid && (
          <div className={`px-3 py-2.5 rounded-lg text-sm font-semibold ${
            balanceNum >= 0 ? "bg-[#1f3a2a] text-[#4ade80]" : "bg-[#3a1f1f] text-[#f87171]"
          }`}>
            {balanceNum >= 0 ? t("accounts.balance.positive") : t("accounts.balance.negative")}
          </div>
        )}
        <div className="flex gap-2 mt-1">
          <Button onClick={onSave}>{t("common.save")}</Button>
          <Button variant="secondary" onClick={onCancel}>{t("common.cancel")}</Button>
        </div>
      </div>
    </Card>
  );
}