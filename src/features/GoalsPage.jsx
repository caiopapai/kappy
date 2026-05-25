import { useState } from "react";
import { useGoalsStore } from "../store/goalsStore";
import { useInvestmentsStore } from "../store/investmentsStore";
import { useToast } from "../hooks/useToast";
import { CURRENCY_SYMBOLS } from "../data/constants";
import { Button, Input, Select, Card } from "../components/ui";
import { Toast } from "../components/ui/Toast";

function formatCurrency(amount, currency) {
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  return sym + " " + Math.abs(amount).toLocaleString("pt-PT", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

const GOAL_TYPES = [
  { value: "invested",  label: "Capital Investido", icon: "📈", desc: "Total em carteira" },
  { value: "dividends", label: "Dividendos Mensais", icon: "💰", desc: "Rendimento passivo/mês" },
];

const goalColor = (type) => type === "dividends" ? "#f59e0b" : "#6366f1";

function useRealValue(goal, investments) {
  if (goal.type === "invested") {
    return investments
      .filter(i => i.opType === "buy" && i.currency === goal.currency)
      .reduce((s, i) => s + i.totalValue, 0);
  }

  if (goal.type === "dividends") {
    const portfolio = Object.values(
      investments.reduce((acc, op) => {
        if (!acc[op.ticker]) {
          acc[op.ticker] = {
            ticker: op.ticker, currency: op.currency,
            qty: 0, totalBought: 0, dyAnnual: op.dyAnnual || 0,
          };
        }
        if (op.opType === "buy") {
          acc[op.ticker].qty         += op.quantity;
          acc[op.ticker].totalBought += op.quantity * op.unitPrice;
          if (op.dyAnnual != null) acc[op.ticker].dyAnnual = op.dyAnnual;
        } else {
          acc[op.ticker].qty -= op.quantity;
        }
        return acc;
      }, {})
    ).filter(p => p.qty > 0 && p.currency === goal.currency);

    return portfolio.reduce((s, p) => {
      const totalBuyQty = investments
        .filter(i => i.ticker === p.ticker && i.opType === "buy")
        .reduce((a, i) => a + i.quantity, 0) || 1;
      const avgPrice = p.totalBought / totalBuyQty;
      return s + avgPrice * (p.dyAnnual / 100 / 12) * p.qty;
    }, 0);
  }

  return 0;
}

export default function GoalsPage() {
  const { goals, save, delete: deleteGoal } = useGoalsStore();
  const { investments } = useInvestmentsStore();
  const { toast, showToast } = useToast();

  const emptyForm = { type: "invested", label: "", targetValue: "", currency: "EUR" };
  const [form,      setForm]      = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const [errors,    setErrors]    = useState({});

  function validate() {
    const e = {};
    if (!form.label.trim())                          e.label       = "Nome obrigatório";
    if (!form.targetValue)                           e.targetValue = "Valor obrigatório";
    if (isNaN(parseFloat(form.targetValue)) ||
        parseFloat(form.targetValue) <= 0)           e.targetValue = "Valor inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const val = parseFloat(form.targetValue);
    try {
      if (editingId !== null) {
        await save({ id: editingId, ...form, targetValue: val });
        showToast("Meta actualizada!");
      } else {
        await save({ ...form, targetValue: val });
        showToast("Meta criada!");
      }
      handleCancel();
    } catch {
      showToast("Erro ao guardar — verifica a ligação", "error");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteGoal(id);
      showToast("Meta removida");
    } catch {
      showToast("Erro ao remover — verifica a ligação", "error");
    }
  }

  function handleEdit(g) {
    setForm({ type: g.type, label: g.label, targetValue: String(g.targetValue), currency: g.currency });
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

  const investedGoals  = goals.filter(g => g.type === "invested");
  const dividendGoals  = goals.filter(g => g.type === "dividends");

  return (
    <div>
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base font-semibold text-[#f0ede8] m-0">As Minhas Metas</h2>
        <Button onClick={() => { handleCancel(); setShowForm(!showForm); }}>
          {showForm ? "Fechar" : "+ Nova Meta"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <GoalForm
          form={form}
          setForm={setForm}
          errors={errors}
          editingId={editingId}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Empty state */}
      {goals.length === 0 && !showForm && (
        <Card className="text-center py-16">
          <div className="text-4xl mb-4">🎯</div>
          <div className="text-[15px] text-[#c4c0b8] mb-2">Ainda não tens metas definidas</div>
          <div className="text-sm text-[#5a5f78]">Clica em "+ Nova Meta" para começar a acompanhar o teu progresso</div>
        </Card>
      )}

      {/* Capital Investido */}
      {investedGoals.length > 0 && (
        <div className="mb-8">
          <SectionHeader label="📈 Capital Investido" />
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {investedGoals.map(g => (
              <GoalCard
                key={g.id}
                goal={g}
                real={useRealValue(g, investments)}
                onEdit={() => handleEdit(g)}
                onDelete={() => handleDelete(g.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dividendos */}
      {dividendGoals.length > 0 && (
        <div>
          <SectionHeader label="💰 Dividendos Mensais" />
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {dividendGoals.map(g => (
              <GoalCard
                key={g.id}
                goal={g}
                real={useRealValue(g, investments)}
                onEdit={() => handleEdit(g)}
                onDelete={() => handleDelete(g.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label }) {
  return (
    <div className="text-xs font-bold text-[#5a5f78] uppercase tracking-widest mb-3 mt-6">
      {label}
    </div>
  );
}

// ── GoalForm ──────────────────────────────────────────────────

function GoalForm({ form, setForm, errors, editingId, onSave, onCancel }) {
  const color = goalColor(form.type);
  const isEditing = editingId !== null;

  return (
    <Card className="mb-6" style={{ borderColor: color }}>
      <div className="text-sm font-semibold text-[#a5b4fc] mb-5">
        {isEditing ? "✏ Editar Meta" : "+ Nova Meta"}
      </div>

      {/* Type toggle */}
      <div className="mb-4">
        <label className="block text-[11px] text-[#5a5f78] uppercase tracking-wide font-medium mb-2">
          Tipo de Meta
        </label>
        <div className="flex gap-3">
          {GOAL_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setForm(f => ({ ...f, type: t.value }))}
              className="flex-1 p-3 rounded-xl cursor-pointer text-center transition-all border"
              style={{
                borderColor: form.type === t.value ? goalColor(t.value) : "#2a2d3a",
                background:  form.type === t.value ? goalColor(t.value) + "18" : "#1a1d2e",
                color:       form.type === t.value ? goalColor(t.value) : "#5a5f78",
              }}
            >
              <div className="text-xl mb-1">{t.icon}</div>
              <div className="text-sm font-semibold">{t.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "2fr 1fr 1fr" }}>
        <Input
          label="Nome da Meta"
          placeholder='Ex: "Independência Financeira"'
          value={form.label}
          onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          error={errors.label}
        />
        <Input
          label="Valor Alvo"
          type="number"
          step="any"
          min="0"
          placeholder={form.type === "dividends" ? "500" : "10000"}
          value={form.targetValue}
          onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
          error={errors.targetValue}
        />
        <Select
          label="Moeda"
          value={form.currency}
          onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
        >
          <option value="EUR">€ Euro</option>
          <option value="BRL">R$ Real</option>
          <option value="USD">$ Dólar</option>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={onSave}>{isEditing ? "Guardar" : "Criar Meta"}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </Card>
  );
}

// ── GoalCard ──────────────────────────────────────────────────

function GoalCard({ goal, real, onEdit, onDelete }) {
  const pct       = Math.min((real / goal.targetValue) * 100, 100);
  const remaining = Math.max(goal.targetValue - real, 0);
  const done      = real >= goal.targetValue;
  const color     = done ? "#4ade80" : pct >= 70 ? "#f59e0b" : "#6366f1";
  const typeIcon  = goal.type === "dividends" ? "💰" : "📈";
  const suffix    = goal.type === "dividends" ? "/mês" : "";

  const R = 44, stroke = 8, size = 104;
  const circ = 2 * Math.PI * R;
  const dash = (pct / 100) * circ;

  return (
    <Card className="relative">
      {/* Actions */}
      <div className="absolute top-3.5 right-3.5 flex gap-1.5">
        <Button variant="secondary" size="sm" onClick={onEdit}>✏</Button>
        <Button variant="danger"    size="sm" onClick={onDelete}>×</Button>
      </div>

      {/* Title */}
      <div className="mb-4 pr-20">
        <div className="text-[15px] font-semibold text-[#e8e6e0]">{typeIcon} {goal.label}</div>
        <div className="text-xs text-[#5a5f78] mt-0.5">
          {goal.type === "invested" ? "Capital investido em carteira" : "Rendimento passivo estimado/mês"} · {goal.currency}
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Arc progress */}
        <div className="relative shrink-0">
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="#2a2d3a" strokeWidth={stroke} />
            <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-[17px] font-extrabold leading-none" style={{ color }}>
              {Math.round(pct)}%
            </div>
            {done && <div className="text-[9px] text-[#4ade80] mt-0.5">✓</div>}
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1">
          <div className="flex justify-between mb-2.5">
            <div>
              <div className="text-[10px] text-[#5a5f78] uppercase tracking-wide mb-1">Real</div>
              <div className="text-lg font-bold tabular-nums" style={{ color }}>
                {formatCurrency(real, goal.currency)}
                <span className="text-xs text-[#5a5f78] font-normal">{suffix}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[#5a5f78] uppercase tracking-wide mb-1">Meta</div>
              <div className="text-lg font-bold text-[#e8e6e0] tabular-nums">
                {formatCurrency(goal.targetValue, goal.currency)}
                <span className="text-xs text-[#5a5f78] font-normal">{suffix}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-[#2a2d3a] rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: pct + "%", background: color }}
            />
          </div>

          {done ? (
            <div className="text-xs font-semibold text-[#4ade80]">🎉 Meta atingida!</div>
          ) : (
            <div className="text-xs text-[#5a5f78]">
              Falta{" "}
              <span className="text-[#e8e6e0] font-semibold">
                {formatCurrency(remaining, goal.currency)}{suffix}
              </span>
              {" · "}
              <span style={{ color }}>+{(100 - pct).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}