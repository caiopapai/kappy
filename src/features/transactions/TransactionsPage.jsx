// src/features/pages/TransactionsPage.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTransactionsStore } from "../../store/transactionsStore";
import { useAccountsStore }     from "../../store/accountsStore";
import { useCategoriesStore }   from "../../store/categoriesStore";
import { useToast }             from "../../hooks/useToast";
import { ACCOUNT_TYPES, CURRENCY_SYMBOLS, TRANSACTION_TYPES } from "../../data/constants";
import { Button, Card, Input, Select } from "../../components/ui";
import { Toast } from "../../components/ui/Toast";

// ── Helpers ───────────────────────────────────────────────────

function fmt(amount, currency) {
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  return sym + " " + Math.abs(amount).toLocaleString("pt-PT", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

const TYPE_COLOR = {
  income: "var(--success)", investment: "var(--info)",
  fixed_expense: "var(--danger)", variable_expense: "var(--warning)",
};
const TYPE_BG = {
  income: "var(--success-bg)", investment: "var(--surface-raised)",
  fixed_expense: "var(--danger-bg)", variable_expense: "var(--warning-bg)",
};

function accountIcon(type) {
  return ACCOUNT_TYPES.find(a => a.value === type)?.icon || "💰";
}

// ── Page ──────────────────────────────────────────────────────

export default function TransactionsPage() {
  const { t } = useTranslation();
  const { transactions, recurringRules, saveTransaction, deleteTransaction, saveRecurringRule, deleteRecurringRule, toggleRecurringRule } = useTransactionsStore();
  const { accounts }                = useAccountsStore();
  const { categories, subcategories } = useCategoriesStore();
  const { toast, showToast }            = useToast();

  const [activeTab, setActiveTab] = useState("all");
  const [showForm,  setShowForm]  = useState(false);

  const today    = new Date().toISOString().slice(0, 10);
  const emptyForm = {
    accountId: "", amount: "", currency: "EUR", date: today,
    subcategoryId: "", notes: "", recurring: false, hasEndDate: false, endDate: "",
  };
  const [form, setForm] = useState(emptyForm);

  const [editingRule,   setEditingRule]   = useState(null);
  const [editRuleForm,  setEditRuleForm]  = useState({});

  const selectedSub  = subcategories.find(s => s.id === parseInt(form.subcategoryId));
  const selectedAcc  = accounts.find(a => a.id === parseInt(form.accountId));
  const sorted       = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  // ── Guardar transação / regra ─────────────────────────────────

  async function handleSave() {
    if (!form.accountId || !form.amount || !form.subcategoryId || !form.date)
      return showToast(t("transactions.toast.fillRequired"), "error");
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0)
      return showToast(t("common.invalid"), "error");

    const sub = subcategories.find(s => s.id === parseInt(form.subcategoryId));

    try {
      if (form.recurring) {
        const endDate = form.hasEndDate && form.endDate ? form.endDate : null;
        const rule = {
          accountId:    parseInt(form.accountId),
          amount,
          currency:     form.currency,
          subcategoryId:parseInt(form.subcategoryId),
          type:         sub?.type || "variable_expense",
          notes:        form.notes,
          startDate:    form.date,
          endDate:      endDate || new Date(new Date(form.date).setFullYear(new Date(form.date).getFullYear() + 10)).toISOString().slice(0, 10),
          hasNoEnd:     !form.hasEndDate,
          active:       true,
        };
        await saveRecurringRule(rule);
        showToast(t("transactions.toast.recurringCreated"));
      } else {
        const tx = {
          accountId:    parseInt(form.accountId),
          amount,
          currency:     form.currency,
          date:         form.date,
          subcategoryId:parseInt(form.subcategoryId),
          notes:        form.notes,
          type:         sub?.type || "variable_expense",
          recurring:    false,
        };
        await saveTransaction(tx);
        const isPos = sub?.type === "income";
        showToast(`${isPos ? "+" : "-"}${fmt(amount, form.currency)} ${t("transactions.toast.registered")}`);
      }
      setForm(emptyForm);
      setShowForm(false);
    } catch {
      showToast(t("common.connectionError"), "error");
    }
  }

  async function handleDelete(tx) {
    try {
      await deleteTransaction(tx);
      showToast(t("transactions.toast.deleted"));
    } catch {
      showToast(t("common.connectionError"), "error");
    }
  }

  // ── Editar regra recorrente ───────────────────────────────────

  function startEditRule(rule) {
    setEditingRule(rule.id);
    setEditRuleForm({ amount: rule.amount, endDate: rule.endDate || "", hasNoEnd: rule.hasNoEnd, notes: rule.notes });
  }

  async function saveEditRule(rule) {
    const newAmount = parseFloat(editRuleForm.amount);
    if (isNaN(newAmount) || newAmount <= 0)
      return showToast(t("common.invalid"), "error");

    const todayStr = new Date().toISOString().slice(0, 10);
    try {
      // Fecha regra actual em hoje
      await saveRecurringRule({ ...rule, endDate: todayStr, hasNoEnd: false });
      // Cria nova regra a partir de hoje com novos valores
      await saveRecurringRule({
        ...rule,
        id:       undefined,
        amount:   newAmount,
        notes:    editRuleForm.notes,
        startDate:todayStr,
        endDate:  editRuleForm.hasNoEnd
          ? new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString().slice(0, 10)
          : editRuleForm.endDate || todayStr,
        hasNoEnd: editRuleForm.hasNoEnd,
      });
      setEditingRule(null);
      showToast(t("transactions.toast.ruleUpdated"));
    } catch {
      showToast(t("common.connectionError"), "error");
    }
  }

  async function handleToggleRule(id) {
    try {
      await toggleRecurringRule(id);
    } catch {
      showToast(t("common.connectionError"), "error");
    }
  }

  async function handleDeleteRule(id) {
    try {
      await deleteRecurringRule(id);
      showToast(t("transactions.toast.ruleDeleted"));
    } catch {
      showToast(t("common.connectionError"), "error");
    }
  }

  const activeRulesCount = recurringRules.filter(r => r.active).length;

  const tabStyle = (active) => [
    "px-5 py-2 rounded-lg text-sm font-medium transition-all border-0 cursor-pointer",
    active ? "bg-[#6366f1] text-white" : "bg-transparent text-faint hover:text-secondary",
  ].join(" ");

  return (
    <div>
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex gap-1 bg-raised rounded-xl p-1">
          <button className={tabStyle(activeTab === "all")} onClick={() => setActiveTab("all")}>
            {t("transactions.tabs.all")}
          </button>
          <button className={tabStyle(activeTab === "recurring")} onClick={() => setActiveTab("recurring")}>
            🔄 {t("transactions.tabs.recurring")}
            {activeRulesCount > 0 && (
              <span className="ml-1.5 bg-[#6366f1] text-white rounded-full text-[10px] px-1.5 py-0.5">
                {activeRulesCount}
              </span>
            )}
          </button>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowForm(!showForm); }}>
          {showForm ? t("common.close") : "+ " + t("transactions.add")}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className={`mb-5 ${form.recurring ? "border-[#7c3aed]" : ""}`}>
          <div className="text-sm font-semibold text-brand-light mb-5">+ {t("transactions.add")}</div>

          <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "1.5fr 1fr 1fr" }}>
            {/* Conta */}
            <div>
              <label className="block text-[11px] text-faint uppercase tracking-wide font-medium mb-1.5">
                {t("transactions.form.account")}
              </label>
              <select
                className="w-full bg-raised border border-default rounded-lg px-3 py-2.5 text-sm text-primary outline-none focus:border-[var(--border-focus)]"
                value={form.accountId}
                onChange={e => {
                  const acc = accounts.find(a => a.id === parseInt(e.target.value));
                  setForm(f => ({ ...f, accountId: e.target.value, currency: acc?.currency || "EUR" }));
                }}
              >
                <option value="">{t("transactions.form.selectAccount")}</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{accountIcon(a.type)} {a.name}</option>
                ))}
              </select>
            </div>

            {/* Valor */}
            <Input
              label={t("transactions.form.amount")}
              type="number" step="0.01" min="0" placeholder="0.00"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            />

            {/* Moeda */}
            <Select
              label={t("common.currency")}
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
            >
              <option value="EUR">€ Euro</option>
              <option value="BRL">R$ Real</option>
              <option value="USD">$ Dólar</option>
            </Select>
          </div>

          <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "1.5fr 1fr 1fr" }}>
            {/* Subcategoria agrupada por categoria */}
            <div>
              <label className="block text-[11px] text-faint uppercase tracking-wide font-medium mb-1.5">
                {t("transactions.form.subcategory")}
              </label>
              <select
                className="w-full bg-raised border border-default rounded-lg px-3 py-2.5 text-sm text-primary outline-none focus:border-[var(--border-focus)]"
                value={form.subcategoryId}
                onChange={e => setForm(f => ({ ...f, subcategoryId: e.target.value }))}
              >
                <option value="">{t("transactions.form.selectSubcategory")}</option>
                {categories.map(cat => (
                  <optgroup key={cat.id} label={cat.name}>
                    {subcategories.filter(s => s.categoryId === cat.id).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Data */}
            <Input
              label={form.recurring ? t("transactions.form.startDate") : t("common.date")}
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />

            {/* Notas */}
            <Input
              label={t("common.notes")}
              placeholder={t("transactions.form.notesPlaceholder")}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          {/* Toggle recorrente */}
          <div
            className="p-4 rounded-xl mb-4 border transition-colors"
            style={{ borderColor: form.recurring ? "var(--brand)" : "var(--border)", background: "var(--surface-raised)" }}
          >
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 cursor-pointer accent-[#7c3aed]"
                checked={form.recurring}
                onChange={e => setForm(f => ({ ...f, recurring: e.target.checked, hasEndDate: false, endDate: "" }))}
              />
              <div>
                <div className={`text-sm font-semibold ${form.recurring ? "text-[#c084fc]" : "text-muted"}`}>
                  🔄 {t("transactions.recurring.label")}
                </div>
                <div className="text-xs text-faint mt-0.5">{t("transactions.recurring.desc")}</div>
              </div>
            </label>

            {form.recurring && (
              <div className="mt-4 pt-4 border-t border-default">
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer accent-[#6366f1]"
                    checked={form.hasEndDate}
                    onChange={e => setForm(f => ({ ...f, hasEndDate: e.target.checked, endDate: "" }))}
                  />
                  <span className="text-sm text-muted">{t("transactions.recurring.hasEndDate")}</span>
                </label>
                {form.hasEndDate ? (
                  <div className="max-w-[220px]">
                    <Input
                      label={t("transactions.recurring.endDate")}
                      type="date"
                      min={form.date}
                      value={form.endDate}
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    />
                  </div>
                ) : (
                  <div className="text-xs text-faint italic">{t("transactions.recurring.noEndDesc")}</div>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          {selectedSub && selectedAcc && (
            <div
              className="px-4 py-2.5 rounded-lg mb-4 text-sm font-semibold"
              style={{
                background: selectedSub.type === "income" ? "var(--success-bg)" : "var(--danger-bg)",
                color: selectedSub.type === "income" ? "var(--success)" : "var(--danger)",
              }}
            >
              {form.recurring
                ? `🔄 ${t("transactions.preview.recurring", { account: selectedAcc.name, date: new Date(form.date).toLocaleDateString("pt-PT") })}`
                : `${selectedSub.type === "income" ? "↑" : "↓"} ${t("transactions.preview.balance", { account: selectedAcc.name })}`
              }
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              style={{ background: form.recurring ? "var(--brand)" : undefined }}
            >
              {form.recurring ? "🔄 " + t("transactions.recurring.create") : t("transactions.register")}
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
          </div>
        </Card>
      )}

      {/* Tab: Todas as transações */}
      {activeTab === "all" && (
        <Card className="overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[11px] text-faint uppercase tracking-wide">
                {[t("common.date"), t("transactions.table.subcategory"), t("transactions.table.account"), t("common.type"), t("common.notes"), t("transactions.table.value"), ""].map((h, i) => (
                  <th key={i} className={`pb-3 font-semibold ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(tx => {
                const sub  = subcategories.find(s => s.id === tx.subcategoryId);
                const cat  = categories.find(c => c.id === sub?.categoryId);
                const acc  = accounts.find(a => a.id === tx.accountId);
                const isPos = tx.type === "income";
                const color = TYPE_COLOR[tx.type] || "var(--text-muted)";
                const bg    = TYPE_BG[tx.type]    || "var(--border)";

                return (
                  <tr key={tx.id} className="border-t border-default">
                    <td className="py-3 text-sm text-muted whitespace-nowrap pr-4">
                      {new Date(tx.date).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="text-sm text-primary">{sub?.name || "—"}</div>
                      <div className="text-xs text-faint">{cat?.name}</div>
                    </td>
                    <td className="py-3 pr-4 text-sm text-muted">{acc?.name || "—"}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: bg, color }}>
                        {t("categories.types." + tx.type)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-faint max-w-[140px] truncate">{tx.notes || "—"}</td>
                    <td className="py-3 text-right text-sm font-bold tabular-nums" style={{ color: isPos ? "var(--success)" : "var(--danger)" }}>
                      {isPos ? "+" : "-"}{fmt(tx.amount, tx.currency)}
                    </td>
                    <td className="py-3 pl-3">
                      <Button variant="danger" size="sm" onClick={() => handleDelete(tx)}>×</Button>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-faint text-sm">
                    {t("transactions.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Tab: Recorrentes */}
      {activeTab === "recurring" && (
        <div>
          <div className="text-xs text-faint mb-4 leading-relaxed">
            {t("transactions.recurring.helpText")}
          </div>

          {recurringRules.length === 0 && (
            <Card className="text-center py-10 text-faint">
              {t("transactions.recurring.empty")}
            </Card>
          )}

          <div className="flex flex-col gap-3">
            {recurringRules.map(rule => {
              const sub      = subcategories.find(s => s.id === rule.subcategoryId);
              const cat      = categories.find(c => c.id === sub?.categoryId);
              const acc      = accounts.find(a => a.id === rule.accountId);
              const isPos    = rule.type === "income";
              const color    = TYPE_COLOR[rule.type] || "var(--text-muted)";
              const bg       = TYPE_BG[rule.type]    || "var(--border)";
              const isEditing = editingRule === rule.id;
              const endLabel  = rule.hasNoEnd
                ? t("transactions.recurring.noEnd")
                : rule.endDate
                  ? new Date(rule.endDate).toLocaleDateString("pt-PT")
                  : "—";

              return (
                <div
                  key={rule.id}
                  className="rounded-xl p-4 transition-all"
                  style={{
                    background:  "var(--surface-raised)",
                    border:      `1px solid ${isEditing ? "var(--brand-light)" : rule.active ? "var(--border)" : "var(--surface-overlay)"}`,
                    borderLeft:  `3px solid ${rule.active ? color : "var(--border-strong)"}`,
                    opacity:     rule.active ? 1 : 0.6,
                  }}
                >
                  {!isEditing ? (
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🔄</span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-semibold text-primary">{sub?.name || "—"}</span>
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: bg, color }}>
                              {t("categories.types." + rule.type)}
                            </span>
                            {!rule.active && (
                              <span className="text-[11px] text-faint border border-[#3a3d52] rounded-full px-2 py-0.5">
                                {t("transactions.recurring.paused")}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-faint mt-1">
                            {cat?.name} · {acc?.name} · {new Date(rule.startDate).toLocaleDateString("pt-PT")} → {endLabel}
                          </div>
                          {rule.notes && <div className="text-xs text-faint italic mt-0.5">{rule.notes}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold tabular-nums" style={{ color: isPos ? "var(--success)" : "var(--danger)" }}>
                          {isPos ? "+" : "-"}{fmt(rule.amount, rule.currency)}
                          <span className="text-xs text-faint font-normal">/mês</span>
                        </span>
                        <div className="flex gap-1.5">
                          <Button variant="secondary" size="sm" onClick={() => startEditRule(rule)}>✏</Button>
                          <Button
                            variant="secondary" size="sm"
                            onClick={() => handleToggleRule(rule.id)}
                            className={rule.active ? "text-warning" : "text-success"}
                          >
                            {rule.active ? "⏸" : "▶"}
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteRule(rule.id)}>×</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-semibold text-[#c084fc] mb-4">
                        ✏ {t("transactions.recurring.editNote")}
                      </div>
                      <div className="flex gap-3 flex-wrap items-end mb-4">
                        <div className="flex-1 min-w-[120px]">
                          <Input
                            label={t("transactions.recurring.newAmount")}
                            type="number" step="0.01"
                            value={editRuleForm.amount}
                            onChange={e => setEditRuleForm(f => ({ ...f, amount: e.target.value }))}
                          />
                        </div>
                        <div className="flex-2 min-w-[180px]">
                          <Input
                            label={t("common.notes")}
                            value={editRuleForm.notes}
                            onChange={e => setEditRuleForm(f => ({ ...f, notes: e.target.value }))}
                          />
                        </div>
                        <div className="flex-1 min-w-[160px]">
                          <label className="flex items-center gap-2 text-[11px] text-faint uppercase tracking-wide font-medium mb-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              className="accent-[#6366f1]"
                              checked={editRuleForm.hasNoEnd}
                              onChange={e => setEditRuleForm(f => ({ ...f, hasNoEnd: e.target.checked, endDate: "" }))}
                            />
                            {t("transactions.recurring.noEndDate")}
                          </label>
                          {!editRuleForm.hasNoEnd && (
                            <input
                              type="date"
                              className="w-full bg-raised border border-default rounded-lg px-3 py-2.5 text-sm text-primary outline-none focus:border-[var(--border-focus)]"
                              value={editRuleForm.endDate}
                              onChange={e => setEditRuleForm(f => ({ ...f, endDate: e.target.value }))}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => saveEditRule(rule)} style={{ background: "var(--brand)" }}>
                          {t("transactions.recurring.saveFuture")}
                        </Button>
                        <Button variant="secondary" onClick={() => setEditingRule(null)}>{t("common.cancel")}</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}