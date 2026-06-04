// src/features/pages/BudgetPage.jsx
import { useState } from "react";
import { useTranslation }        from "react-i18next";
import { useBudgetsStore }       from "../../store/budgetsStore";
import { useTransactionsStore }  from "../../store/transactionsStore";
import { useCategoriesStore }    from "../../store/categoriesStore";
import { useToast }              from "../../hooks/useToast";
import { Toast }                 from "../../components/ui/Toast";

// ── Constantes ────────────────────────────────────────────────

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const TYPE_ORDER = ["income", "investment", "fixed_expense", "variable_expense"];

const TYPE_SECTION_LABEL = {
  income:           "Ganhos",
  investment:       "Investimentos",
  fixed_expense:    "Despesas Fixas",
  variable_expense: "Despesas Variáveis",
};

const TYPE_SECTION_COLOR = {
  income:           "#4ade80",
  investment:       "#60a5fa",
  fixed_expense:    "#f87171",
  variable_expense: "#fb923c",
};

const INCOME_TYPES  = ["income", "investment"];
const EXPENSE_TYPES = ["fixed_expense", "variable_expense"];

function fmt(v) {
  if (!v && v !== 0) return "—";
  return Math.abs(v).toLocaleString("pt-PT", {
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  });
}

// ── Page ──────────────────────────────────────────────────────

export default function BudgetPage() {
  const { t }                            = useTranslation();
  const { budgets, setCell, removeRow }  = useBudgetsStore();
  const { transactions, recurringRules } = useTransactionsStore();
  const { categories, subcategories }    = useCategoriesStore();
  const { toast, showToast }             = useToast();

  const now  = new Date();
  const [year, setYear] = useState(now.getFullYear());

  // ── Budget helpers ────────────────────────────────────────

  const getBudget = (subId, month) => {
    const b = budgets.find(b => b.year === year && b.subcategoryId === subId);
    return b?.months?.[month] || 0;
  };

  const recurringApplies = (rule, y, m) => {
    if (!rule.active) return false;
    const cellDate   = new Date(y, m - 1, 1);
    const startMonth = new Date(new Date(rule.startDate).getFullYear(), new Date(rule.startDate).getMonth(), 1);
    if (cellDate < startMonth) return false;
    if (rule.endDate) {
      const endMonth = new Date(new Date(rule.endDate).getFullYear(), new Date(rule.endDate).getMonth(), 1);
      if (cellDate > endMonth) return false;
    }
    return true;
  };

  const getActual = (subId, month) => {
    const txTotal = transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.subcategoryId === subId && d.getFullYear() === year && d.getMonth() + 1 === month;
      })
      .reduce((s, t) => s + t.amount, 0);

    const recurringTotal = recurringRules
      .filter(r => r.subcategoryId === subId && recurringApplies(r, year, month))
      .reduce((s, r) => {
        const hasReal = transactions.some(t => {
          const d = new Date(t.date);
          return t.subcategoryId === subId && d.getFullYear() === year && d.getMonth() + 1 === month;
        });
        return hasReal ? s : s + r.amount;
      }, 0);

    return txTotal + recurringTotal;
  };

  // ── Cell renderer (read-only) ────────────────────────────

  const renderCell = (subId, month) => {
    const planned  = getBudget(subId, month);
    const actual   = getActual(subId, month);
    const sub      = subcategories.find(s => s.id === subId);
    const isPos    = sub?.type === "income" || sub?.type === "investment";
    const diff     = isPos ? actual - planned : planned - actual;
    const diffColor = diff >= 0 ? "#4ade80" : "#f87171";

    return (
      <td key={month}
        style={{ padding: 0, minWidth: 96, verticalAlign: "top", borderLeft: "1px solid #2a2d3a11" }}
      >
        <div style={{ padding: "4px 10px 2px", textAlign: "right" }}>
          <div style={{ fontSize: 12, color: planned > 0 ? "#8a8fa8" : "#3a3d50", fontVariantNumeric: "tabular-nums" }}>
            {planned > 0 ? fmt(planned) : "—"}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: actual > 0 ? "#e8e6e0" : "#3a3d50", fontVariantNumeric: "tabular-nums" }}>
            {actual > 0 ? fmt(actual) : "—"}
          </div>
          {(planned > 0 || actual > 0) && (
            <div style={{ fontSize: 10, color: diffColor, fontVariantNumeric: "tabular-nums" }}>
              {diff >= 0 ? "+" : ""}{fmt(diff)}
            </div>
          )}
        </div>
      </td>
    );
  };

  const monthTotal = (month, types, mode) => {
    let sum = 0;
    categories.filter(c => types.includes(c.type)).forEach(cat => {
      subcategories.filter(s => s.categoryId === cat.id).forEach(sub => {
        sum += mode === "actual" ? getActual(sub.id, month) : getBudget(sub.id, month);
      });
    });
    return sum;
  };

  // ── Ordered categories ────────────────────────────────────

  const orderedCats = TYPE_ORDER
    .map(type => ({ type, cats: categories.filter(c => c.type === type) }))
    .filter(g => g.cats.length > 0);

  // Sticky column helper
  const stickyTd = (bg) => ({
    position: "sticky", left: 0, background: bg, zIndex: 2,
    width: 210, minWidth: 210, maxWidth: 210, overflow: "hidden",
    borderRight: "2px solid #3a3d52",
  });

  const colHeader = (wide) => ({
    textAlign: "right", padding: "10px 10px", fontSize: 11, color: "#5a5f78",
    textTransform: "uppercase", letterSpacing: 1, fontWeight: 600,
    minWidth: wide ? 96 : 88, borderLeft: "1px solid #2a2d3a22",
  });

  return (
    <div data-testid="budget-page">
      <Toast toast={toast} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#f0ede8", margin: 0 }}>
            {t("budget.title")}
          </h2>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              onClick={() => setYear(y => y - 1)}
              style={{ background: "#1a1d2e", border: "1px solid #2a2d3a", borderRadius: 8, padding: "4px 10px", color: "#8a8fa8", cursor: "pointer", fontSize: 13 }}
            >‹</button>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#a5b4fc", minWidth: 44, textAlign: "center" }}>{year}</span>
            <button
              onClick={() => setYear(y => y + 1)}
              style={{ background: "#1a1d2e", border: "1px solid #2a2d3a", borderRadius: 8, padding: "4px 10px", color: "#8a8fa8", cursor: "pointer", fontSize: 13 }}
            >›</button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 12 }}>
        <span style={{ color: "#8a8fa8" }}>● {t("budget.legend.planned")}</span>
        <span style={{ color: "#e8e6e0", fontWeight: 600 }}>● {t("budget.legend.actual")}</span>
        <span style={{ color: "#4ade80" }}>● {t("budget.legend.diff")}</span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #2a2d3a", isolation: "isolate" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 1300, width: "100%", fontSize: 13 }}>
          <thead>
            {/* Main header */}
            <tr style={{ background: "#1a1d2e", position: "sticky", top: 0, zIndex: 4 }}>
              <th style={{
                textAlign: "left", padding: "10px 16px", fontSize: 11, color: "#5a5f78",
                textTransform: "uppercase", letterSpacing: 1, fontWeight: 600,
                ...stickyTd("#1a1d2e"), zIndex: 5, position: "sticky",
              }}>
                {t("budget.subcategory")}
              </th>
              {MONTHS.map((m, i) => (
                <th key={i} style={colHeader(true)}>{m}</th>
              ))}
              <th style={{ ...colHeader(false), borderLeft: "1px solid #2a2d3a" }}>{t("budget.total")}</th>
              <th style={{ padding: "10px 8px", minWidth: 32 }} />
            </tr>
            {/* Sub-header */}
            <tr style={{ background: "#13151f", position: "sticky", top: 37, zIndex: 3 }}>
              <th style={{ ...stickyTd("#13151f"), padding: "3px 16px", fontSize: 10, color: "#5a5f78", textAlign: "left", position: "sticky", zIndex: 4 }}>
                <span style={{ color: "#8a8fa8" }}>Orç.</span>
                {" / "}
                <span style={{ color: "#e8e6e0" }}>Real</span>
                {" / "}
                <span style={{ color: "#4ade80" }}>Dif.</span>
              </th>
              {Array.from({ length: 13 }).map((_, i) => (
                <th key={i} style={{ padding: "3px 10px", textAlign: "right", borderLeft: "1px solid #2a2d3a11" }}>
                  <span style={{ fontSize: 9, color: "#8a8fa8" }}>Orç.</span>
                  <span style={{ fontSize: 9, color: "#e8e6e0", marginLeft: 4 }}>Real</span>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {orderedCats.map(({ type, cats }) => (
              cats.map(cat => {
                const budgetedSubs = subcategories
                  .filter(s => s.categoryId === cat.id)
                  .filter(sub => budgets.some(b => b.year === year && b.subcategoryId === sub.id));

                const catBudgetMonth = (mi) => budgetedSubs.reduce((s, sub) => s + getBudget(sub.id, mi + 1), 0);
                const catActualMonth = (mi) => budgetedSubs.reduce((s, sub) => s + getActual(sub.id, mi + 1), 0);
                const catBudgetYear  = Array.from({ length: 12 }, (_, i) => i).reduce((s, m) => s + catBudgetMonth(m), 0);
                const catActualYear  = Array.from({ length: 12 }, (_, i) => i).reduce((s, m) => s + catActualMonth(m), 0);

                if (budgetedSubs.length === 0) return null;

                return [
                  // ── Nível 1: Tipo ─────────────────────────
                  <tr key={`type-${type}-${cat.id}`} style={{ background: "#0a0c14" }}>
                    <td style={{ padding: "5px 16px", ...stickyTd("#0a0c14") }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                        letterSpacing: 2, color: TYPE_SECTION_COLOR[type],
                      }}>
                        {TYPE_SECTION_LABEL[type]}
                      </span>
                    </td>
                    {Array.from({ length: 14 }).map((_, i) => <td key={i} style={{ background: "#0a0c14" }} />)}
                  </tr>,

                  // ── Nível 2: Categoria ────────────────────
                  <tr key={`cat-${cat.id}`} style={{ background: "#0f1117" }}>
                    <td style={{ padding: "4px 16px 4px 24px", ...stickyTd("#0f1117") }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#c4c0b8" }}>
                        {cat.name}
                      </span>
                    </td>
                    {Array.from({ length: 12 }, (_, i) => i).map(mi => {
                      const b    = catBudgetMonth(mi);
                      const a    = catActualMonth(mi);
                      const isPos = type === "income" || type === "investment";
                      const diff  = isPos ? a - b : b - a;
                      return (
                        <td key={mi} style={{ padding: "4px 10px", textAlign: "right", verticalAlign: "top", borderLeft: "1px solid #2a2d3a11", background: "#0f1117" }}>
                          <div style={{ fontSize: 11, color: "#8a8fa8", fontVariantNumeric: "tabular-nums" }}>{b > 0 ? fmt(b) : "—"}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: TYPE_SECTION_COLOR[type], fontVariantNumeric: "tabular-nums" }}>{a > 0 ? fmt(a) : "—"}</div>
                          {(b > 0 || a > 0) && (
                            <div style={{ fontSize: 10, color: diff >= 0 ? "#4ade80" : "#f87171", fontVariantNumeric: "tabular-nums" }}>
                              {diff >= 0 ? "+" : ""}{fmt(diff)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ padding: "4px 12px", textAlign: "right", borderLeft: "1px solid #2a2d3a", verticalAlign: "top", background: "#0f1117" }}>
                      <div style={{ fontSize: 11, color: "#8a8fa8", fontVariantNumeric: "tabular-nums" }}>{catBudgetYear > 0 ? fmt(catBudgetYear) : "—"}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: TYPE_SECTION_COLOR[type], fontVariantNumeric: "tabular-nums" }}>{catActualYear > 0 ? fmt(catActualYear) : "—"}</div>
                    </td>
                    <td style={{ background: "#0f1117" }} />
                  </tr>,

                  // ── Nível 3: Subcategorias ────────────────
                  ...budgetedSubs.map(sub => {
                    const budgetYear = Array.from({ length: 12 }, (_, i) => i + 1).reduce((s, m) => s + getBudget(sub.id, m), 0);
                    const actualYear = Array.from({ length: 12 }, (_, i) => i + 1).reduce((s, m) => s + getActual(sub.id, m), 0);
                    const isPos      = sub.type === "income" || sub.type === "investment";
                    const yearDiff   = isPos ? actualYear - budgetYear : budgetYear - actualYear;

                    return (
                      <tr key={`sub-${sub.id}`}
                        style={{ borderTop: "1px solid #2a2d3a22", background: "#161820" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#1e2235"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#161820"; }}
                      >
                        <td style={{ padding: "0 12px 0 36px", ...stickyTd("#161820") }}>
                          <div style={{ padding: "6px 0" }}>
                            <div style={{ color: "#8a8fa8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 12 }}>
                              {sub.name}
                            </div>
                          </div>
                        </td>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => renderCell(sub.id, month))}
                        <td style={{ padding: "4px 12px", borderLeft: "1px solid #2a2d3a", verticalAlign: "top", minWidth: 88 }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 12, color: "#8a8fa8", fontVariantNumeric: "tabular-nums" }}>{budgetYear > 0 ? fmt(budgetYear) : "—"}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: actualYear > 0 ? "#e8e6e0" : "#3a3d50", fontVariantNumeric: "tabular-nums" }}>{actualYear > 0 ? fmt(actualYear) : "—"}</div>
                            {(budgetYear > 0 || actualYear > 0) && (
                              <div style={{ fontSize: 10, color: yearDiff >= 0 ? "#4ade80" : "#f87171", fontVariantNumeric: "tabular-nums" }}>
                                {yearDiff >= 0 ? "+" : ""}{fmt(yearDiff)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "0 6px", textAlign: "center", verticalAlign: "middle" }}>
                          <button
                            data-testid="budget-remove-btn"
                            onClick={async () => { await removeRow(year, sub.id); showToast(t("budget.toast.rowRemoved")); }}
                            style={{ background: "transparent", border: "none", color: "#3a3d50", cursor: "pointer", fontSize: 15, padding: "4px" }}
                          >×</button>
                        </td>
                      </tr>
                    );
                  }),
                ];
              })
            ))}

            {/* Separator */}
            <tr style={{ height: 2, background: "#2a2d3a" }}>
              {Array.from({ length: 15 }).map((_, i) => <td key={i} style={{ background: "#2a2d3a", padding: 0 }} />)}
            </tr>

            {/* Total Ganhos + Total Despesas */}
            {["income", "expense"].map(section => {
              const types      = section === "income" ? INCOME_TYPES : EXPENSE_TYPES;
              const color      = section === "income" ? "#4ade80" : "#f87171";
              const bg         = section === "income" ? "#162a1f" : "#2a1616";
              const label      = section === "income" ? "↑ Total Ganhos + Invest." : "↓ Total Despesas";
              const yearBudget = Array.from({ length: 12 }, (_, i) => i + 1).reduce((s, m) => s + monthTotal(m, types, "budget"), 0);
              const yearActual = Array.from({ length: 12 }, (_, i) => i + 1).reduce((s, m) => s + monthTotal(m, types, "actual"), 0);
              return (
                <tr key={section} style={{ background: bg + "44", borderTop: "1px solid #2a2d3a" }}>
                  <td style={{ padding: "6px 16px", fontSize: 12, fontWeight: 700, color, ...stickyTd(bg), whiteSpace: "nowrap" }}>{label}</td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                    const b = monthTotal(m, types, "budget");
                    const a = monthTotal(m, types, "actual");
                    return (
                      <td key={m} style={{ padding: "4px 10px", textAlign: "right", verticalAlign: "top" }}>
                        <div style={{ fontSize: 11, color: "#8a8fa8", fontVariantNumeric: "tabular-nums" }}>{b > 0 ? fmt(b) : "—"}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{a > 0 ? fmt(a) : "—"}</div>
                      </td>
                    );
                  })}
                  <td style={{ padding: "4px 12px", textAlign: "right", borderLeft: "1px solid #2a2d3a", verticalAlign: "top" }}>
                    <div style={{ fontSize: 11, color: "#8a8fa8", fontVariantNumeric: "tabular-nums" }}>{fmt(yearBudget)}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{fmt(yearActual)}</div>
                  </td>
                  <td />
                </tr>
              );
            })}

            {/* Saldo do Mês */}
            <tr style={{ background: "#1a1d2e", borderTop: "2px solid #6366f1" }}>
              <td style={{ padding: "8px 16px", fontSize: 13, fontWeight: 700, color: "#a5b4fc", ...stickyTd("#1a1d2e"), whiteSpace: "nowrap", borderRight: "2px solid #6366f1" }}>
                ◈ {t("budget.netBalance")}
              </td>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                const bNet = monthTotal(m, INCOME_TYPES, "budget") - monthTotal(m, EXPENSE_TYPES, "budget");
                const aNet = monthTotal(m, INCOME_TYPES, "actual") - monthTotal(m, EXPENSE_TYPES, "actual");
                return (
                  <td key={m} style={{ padding: "4px 10px", textAlign: "right", verticalAlign: "top" }}>
                    <div style={{ fontSize: 11, color: bNet >= 0 ? "#8a8fa8" : "#a87070", fontVariantNumeric: "tabular-nums" }}>{bNet >= 0 ? "+" : ""}{fmt(bNet)}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: aNet >= 0 ? "#4ade80" : "#f87171", fontVariantNumeric: "tabular-nums" }}>{aNet >= 0 ? "+" : ""}{fmt(aNet)}</div>
                  </td>
                );
              })}
              <td style={{ padding: "4px 12px", textAlign: "right", borderLeft: "1px solid #6366f1", verticalAlign: "top" }}>
                {(() => {
                  const bNet = Array.from({ length: 12 }, (_, i) => i + 1).reduce((s, m) => s + monthTotal(m, INCOME_TYPES, "budget") - monthTotal(m, EXPENSE_TYPES, "budget"), 0);
                  const aNet = Array.from({ length: 12 }, (_, i) => i + 1).reduce((s, m) => s + monthTotal(m, INCOME_TYPES, "actual") - monthTotal(m, EXPENSE_TYPES, "actual"), 0);
                  return (
                    <>
                      <div style={{ fontSize: 11, color: bNet >= 0 ? "#8a8fa8" : "#a87070", fontVariantNumeric: "tabular-nums" }}>{bNet >= 0 ? "+" : ""}{fmt(bNet)}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: aNet >= 0 ? "#4ade80" : "#f87171", fontVariantNumeric: "tabular-nums" }}>{aNet >= 0 ? "+" : ""}{fmt(aNet)}</div>
                    </>
                  );
                })()}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}