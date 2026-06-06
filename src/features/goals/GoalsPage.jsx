// src/features/goals/GoalsPage.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGoalsStore } from "../../store/goalsStore";
import { useAccountsStore } from "../../store/accountsStore";
import { useInvestmentsStore } from "../../store/investmentsStore";
import { useToast } from "../../hooks/useToast";
import { CURRENCY_SYMBOLS } from "../../data/constants";
import { Button, Input, Select, Card } from "../../components/ui";
import { Toast } from "../../components/ui/Toast";
import { IS_CONFIGURED } from "../../services/sheetsApi";

const GOAL_TYPE_VALUES = ["invested", "dividends"];
const goalColor = (type) => type === "dividends" ? "var(--warning)" : "var(--brand)";

function fmtCurrency(amount, currency) {
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  return sym + " " + Math.abs(amount).toLocaleString("pt-PT", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

function calcLocalProgress(goal, investments) {
  const accountIds = goal.accountIds
    ? String(goal.accountIds).split(",").map(Number).filter(Boolean)
    : [];

  const relevant = accountIds.length > 0
    ? investments.filter(i => accountIds.includes(Number(i.accountId)))
    : investments;

  if (goal.type === "invested") {
    return relevant.reduce((s, i) => {
      const v = parseFloat(i.totalValue) || 0;
      return s + (i.opType === "buy" ? v : -v);
    }, 0);
  }
  if (goal.type === "dividends") {
    const portfolio = {};
    relevant.forEach(inv => {
      const t = inv.ticker;
      if (!portfolio[t]) portfolio[t] = { qty: 0, totalBought: 0, dyAnnual: 0 };
      const qty = parseFloat(inv.quantity) || 0;
      if (inv.opType === "buy") {
        portfolio[t].qty += qty;
        portfolio[t].totalBought += qty * (parseFloat(inv.unitPrice) || 0);
        if (inv.dyAnnual) portfolio[t].dyAnnual = parseFloat(inv.dyAnnual) || 0;
      } else {
        portfolio[t].qty -= qty;
      }
    });
    return Object.values(portfolio).filter(p => p.qty > 0).reduce((s, p) => {
      const avg = p.qty > 0 ? p.totalBought / p.qty : 0;
      return s + avg * p.qty * (p.dyAnnual / 100 / 12);
    }, 0);
  }
  return 0;
}

export default function GoalsPage() {
  const { t } = useTranslation();
  const { goals, save, delete: deleteGoal } = useGoalsStore();
  const { accounts } = useAccountsStore();
  const { investments } = useInvestmentsStore();
  const { toast, showToast } = useToast();

  const emptyForm = { type: "invested", label: "", targetValue: "", currency: "EUR", accountIds: [] };
  const [form,      setForm]      = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const [errors,    setErrors]    = useState({});

  const eligibleAccounts = accounts.filter(a =>
    ["checking", "savings", "investment"].includes(a.type)
  );

  function validate() {
    const e = {};
    if (!form.label.trim())                                                        e.label       = t("common.required");
    if (!form.targetValue)                                                         e.targetValue = t("common.required");
    if (isNaN(parseFloat(form.targetValue)) || parseFloat(form.targetValue) <= 0) e.targetValue = t("common.invalid");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const payload = {
      ...form,
      targetValue: parseFloat(form.targetValue),
      accountIds:  Array.isArray(form.accountIds) ? form.accountIds.join(",") : form.accountIds,
    };
    try {
      await save(editingId !== null ? { id: editingId, ...payload } : payload);
      showToast(editingId !== null ? t("goals.toast.updated") : t("goals.toast.created"));
      handleCancel();
    } catch {
      showToast(t("common.connectionError"), "error");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteGoal(id);
      showToast(t("goals.toast.deleted"));
    } catch {
      showToast(t("common.connectionError"), "error");
    }
  }

  function handleEdit(g) {
    setForm({
      type:        g.type,
      label:       g.label,
      targetValue: String(g.targetValue),
      currency:    g.currency,
      accountIds:  g.accountIds
        ? String(g.accountIds).split(",").map(Number).filter(Boolean)
        : [],
    });
    setEditingId(g.id);
    setShowForm(true);
    setErrors({});
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  }

  function getProgress(goal) {
    if (IS_CONFIGURED && goal.currentValue != null) {
      return parseFloat(goal.currentValue) || 0;
    }
    return calcLocalProgress(goal, investments);
  }

  const investedGoals = goals.filter(g => g.type === "invested");
  const dividendGoals = goals.filter(g => g.type === "dividends");

  return (
    <div data-testid="goals-page">
      <Toast toast={toast} />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base font-semibold text-[#f0ede8] m-0">{t("goals.title")}</h2>
        <Button data-testid="goal-add-btn" onClick={() => { handleCancel(); setShowForm(!showForm); }}>
          {showForm ? t("common.close") : "+ " + t("goals.add")}
        </Button>
      </div>

      {showForm && (
        <GoalForm
          form={form} setForm={setForm} errors={errors}
          editingId={editingId} accounts={eligibleAccounts}
          onSave={handleSave} onCancel={handleCancel}
        />
      )}

      {goals.length === 0 && !showForm && (
        <Card className="text-center py-16">
          <div className="text-4xl mb-4">🎯</div>
          <div className="text-[15px] text-secondary mb-2">{t("goals.empty.title")}</div>
          <div className="text-sm text-faint">{t("goals.empty.desc")}</div>
        </Card>
      )}

      {investedGoals.length > 0 && (
        <div className="mb-8">
          <SectionHeader label={t("goals.sections.invested")} />
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {investedGoals.map(g => (
              <GoalCard key={g.id} goal={g} real={getProgress(g)}
                accounts={eligibleAccounts}
                onEdit={() => handleEdit(g)} onDelete={() => handleDelete(g.id)} />
            ))}
          </div>
        </div>
      )}

      {dividendGoals.length > 0 && (
        <div>
          <SectionHeader label={t("goals.sections.dividends")} />
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {dividendGoals.map(g => (
              <GoalCard key={g.id} goal={g} real={getProgress(g)}
                accounts={eligibleAccounts}
                onEdit={() => handleEdit(g)} onDelete={() => handleDelete(g.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label }) {
  return <div className="text-xs font-bold text-faint uppercase tracking-widest mb-3 mt-6">{label}</div>;
}

function GoalForm({ form, setForm, errors, editingId, accounts, onSave, onCancel }) {
  const { t } = useTranslation();
  const color     = goalColor(form.type);
  const isEditing = editingId !== null;

  function toggleAccount(id) {
    const current = Array.isArray(form.accountIds) ? form.accountIds : [];
    const next    = current.includes(id)
      ? current.filter(a => a !== id)
      : [...current, id];
    setForm(f => ({ ...f, accountIds: next }));
  }

  return (
    <Card className="mb-6" style={{ borderColor: color }}>
      <div className="text-sm font-semibold text-brand-light mb-5">
        {isEditing ? "✏ " + t("goals.edit") : "+ " + t("goals.add")}
      </div>

      <div className="mb-4">
        <label className="block text-[11px] text-faint uppercase tracking-wide font-medium mb-2">
          {t("goals.form.type")}
        </label>
        <div className="flex gap-3">
          {GOAL_TYPE_VALUES.map(v => (
            <button key={v} onClick={() => setForm(f => ({ ...f, type: v }))}
              className="flex-1 p-3 rounded-xl cursor-pointer text-center transition-all border"
              style={{
                borderColor: form.type === v ? goalColor(v) : "var(--border)",
                background:  form.type === v ? goalColor(v) + "18" : "var(--surface-raised)",
                color:       form.type === v ? goalColor(v) : "var(--text-faint)",
              }}
            >
              <div className="text-xl mb-1">{v === "invested" ? "📈" : "💰"}</div>
              <div className="text-sm font-semibold">{t("goals.types." + v)}</div>
              <div className="text-xs opacity-70 mt-0.5">{t("goals.desc." + v)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "2fr 1fr 1fr" }}>
        <Input data-testid="goal-label-input"
          label={t("goals.form.name")} placeholder={t("goals.form.namePlaceholder")}
          value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          error={errors.label} />
        <Input data-testid="goal-target-input"
          label={t("goals.form.targetValue")} type="number" step="any" min="0"
          placeholder={form.type === "dividends" ? "500" : "10000"}
          value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
          error={errors.targetValue} />
        <Select data-testid="goal-currency-select"
          label={t("goals.form.currency")} value={form.currency}
          onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
          <option value="EUR">€ {t("common.currencies.EUR")}</option>
          <option value="BRL">R$ {t("common.currencies.BRL")}</option>
          <option value="USD">$ {t("common.currencies.USD")}</option>
        </Select>
      </div>

      <div className="mb-4">
        <label className="block text-[11px] text-faint uppercase tracking-wide font-medium mb-2">
          {t("goals.form.accounts")}
        </label>
        {accounts.length === 0 ? (
          <div className="text-xs text-faint p-3 bg-raised rounded-lg border border-default">
            {t("goals.form.noAccounts")}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {accounts.map(a => {
              const selected = Array.isArray(form.accountIds) && form.accountIds.includes(a.id);
              return (
                <button key={a.id} onClick={() => toggleAccount(a.id)}
                  className="px-3 py-1.5 rounded-lg text-xs border transition-all cursor-pointer"
                  style={{
                    borderColor: selected ? "var(--brand)" : "var(--border)",
                    background:  selected ? "var(--brand-dim)" : "var(--surface-raised)",
                    color:       selected ? "var(--brand-light)" : "var(--text-faint)",
                  }}
                >
                  {selected ? "✓ " : ""}{a.name}
                </button>
              );
            })}
          </div>
        )}
        <div className="text-[11px] text-faint mt-1.5">
          {t("goals.form.accountsHint")}
        </div>
      </div>

      <div className="flex gap-2">
        <Button data-testid="goal-save-btn" onClick={onSave}>
          {isEditing ? t("common.save") : t("goals.add")}
        </Button>
        <Button data-testid="goal-cancel-btn" variant="secondary" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </Card>
  );
}

function GoalCard({ goal, real, accounts, onEdit, onDelete }) {
  const { t } = useTranslation();
  const target    = parseFloat(goal.targetValue) || 0;
  const pct       = target > 0 ? Math.min((real / target) * 100, 100) : 0;
  const remaining = Math.max(target - real, 0);
  const done      = real >= target;
  const color     = done ? "var(--success)" : pct >= 70 ? "var(--warning)" : "var(--brand)";
  const suffix    = goal.type === "dividends" ? "/mês" : "";
  const R = 44, stroke = 8, size = 104;
  const circ = 2 * Math.PI * R;
  const dash = (pct / 100) * circ;
  const sym = CURRENCY_SYMBOLS[goal.currency] || goal.currency;

  const linkedIds      = goal.accountIds
    ? String(goal.accountIds).split(",").map(Number).filter(Boolean)
    : [];
  const linkedAccounts = accounts.filter(a => linkedIds.includes(a.id));

  return (
    <Card className="relative" data-testid={`goal-card-${goal.id}`}>
      <div className="absolute top-3.5 right-3.5 flex gap-1.5">
        <Button variant="secondary" size="sm" onClick={onEdit}>✏</Button>
        <Button data-testid="goal-delete-btn" variant="danger" size="sm" onClick={onDelete}>×</Button>
      </div>
      <div className="mb-4 pr-20">
        <div className="text-[15px] font-semibold text-primary">
          {goal.type === "invested" ? "📈" : "💰"} {goal.label}
        </div>
        <div className="text-xs text-faint mt-0.5">
          {t("goals.card." + goal.type)} · {goal.currency}
        </div>
        {linkedAccounts.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {linkedAccounts.map(a => (
              <span key={a.id} className="text-[10px] px-2 py-0.5 rounded-full bg-overlay text-brand border border-[#6366f133]">
                {a.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="var(--border)" strokeWidth={stroke} />
            <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.6s ease" }} />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-[17px] font-extrabold leading-none" style={{ color }}>{Math.round(pct)}%</div>
            {done && <div className="text-[9px] text-success mt-0.5">✓</div>}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between mb-2.5">
            <div>
              <div className="text-[10px] text-faint uppercase tracking-wide mb-1">{t("goals.card.real")}</div>
              <div className="text-lg font-bold tabular-nums" style={{ color }}>
                {sym} {real.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                <span className="text-xs text-faint font-normal">{suffix}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-faint uppercase tracking-wide mb-1">{t("goals.card.target")}</div>
              <div className="text-lg font-bold text-primary tabular-nums">
                {sym} {target.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                <span className="text-xs text-faint font-normal">{suffix}</span>
              </div>
            </div>
          </div>
          <div className="h-1.5 bg-[#2a2d3a] rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + "%", background: color }} />
          </div>
          {done ? (
            <div className="text-xs font-semibold text-success">{t("goals.card.achieved")}</div>
          ) : (
            <div className="text-xs text-faint">
              {t("goals.card.remaining")}{" "}
              <span className="text-primary font-semibold">
                {sym} {remaining.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{suffix}
              </span>
              {" · "}<span style={{ color }}>+{(100 - pct).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}