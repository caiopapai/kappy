// src/features/pages/BudgetPage.jsx
import { useState, useEffect } from "react";
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
  income:           "var(--success)",
  investment:       "var(--info)",
  fixed_expense:    "var(--danger)",
  variable_expense: "var(--warning)",
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
  const { budgets, summary, loadSummary } = useBudgetsStore();
  const { transactions, recurringRules }  = useTransactionsStore();
  const { categories, subcategories }     = useCategoriesStore();
  const { toast, showToast }              = useToast();

  const now  = new Date();
  const [year, setYear] = useState(now.getFullYear());

  // Carrega o summary do engine quando o ano muda
  useEffect(() => {
    loadSummary(year);
  }, [year, loadSummary]);

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
    if (rule.endDate && !rule.hasNoEnd) {
      const endMonth = new Date(new Date(rule.endDate).getFullYear(), new Date(rule.endDate).getMonth(), 1);
      if (cellDate > endMonth) return false;
    }
    return true;
  };

  // getActual usa o summary do engine se disponível, senão calcula localmente
  const getActual = (subId, month) => {
    const engineSummary = summary?.[year]?.[month]?.[subId];
    if (engineSummary) {
      return engineSummary.effective || 0;
    }

    // Fallback local (modo demo)
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
    const diffColor = diff >= 0 ? "var(--success)" : "var(--danger)";

    return (
      <td key={month}
        style={{ padding: 0, minWidth: 96, verticalAlign: "top", borderLeft: "1px solid #2a2d3a11" }}
      >
        <div style={{ padding: "4px 10px 2px", textAlign: "right" }}>
          <div style={{ fontSize: 12, color: planned > 0 ? "var(--text-muted)" : "var(--text-ghost)", fontVariantNumeric: "tabular-nums" }}>
            {planned > 0 ? fmt(planned) : "—"}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: actual > 0 ? "var(--text-primary)" : "var(--text-ghost)", fontVariantNumeric: "tabular-nums" }}>
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

  const allCatIds = categories.map(c => c.id);

  const [collapsed, setCollapsed] = useState({});

  // Inicializa todas as categorias como colapsadas quando carregam
  useEffect(() => {
    if (categories.length > 0) {
      setCollapsed(prev => {
        const next = { ...prev };
        categories.forEach(c => {
          if (!(c.id in next)) next[c.id] = true;
        });
        return next;
      });
    }
  }, [categories.length]);

  const toggleCat = (catId) =>
    setCollapsed(prev => ({ ...prev, [catId]: !prev[catId] }));

  const collapseAll = () =>
    setCollapsed(Object.fromEntries(allCatIds.map(id => [id, true])));

  const expandAll = () =>
    setCollapsed(Object.fromEntries(allCatIds.map(id => [id, false])));

  const allCollapsed = allCatIds.length > 0 && allCatIds.every(id => collapsed[id]);
  const allExpanded  = allCatIds.length > 0 && allCatIds.every(id => !collapsed[id]);

  // ── Export helpers ────────────────────────────────────────

  function exportCSV() {
    const rows = [];
    const header = ["Tipo", "Categoria", "Subcategoria", ...MONTHS, "Total Ano"];
    rows.push(header.join(";"));

    orderedCats.forEach(({ type, cats }) => {
      cats.forEach(cat => {
        const subs = subcategories.filter(s => s.categoryId === cat.id);
        subs.forEach(sub => {
          const months = Array.from({ length: 12 }, (_, i) => i + 1);
          const planned = months.map(m => getBudget(sub.id, m));
          const actual  = months.map(m => getActual(sub.id, m));
          const totalP  = planned.reduce((s, v) => s + v, 0);
          const totalA  = actual.reduce((s, v) => s + v, 0);

          rows.push([
            TYPE_SECTION_LABEL[type], cat.name, sub.name,
            ...planned.map(v => v || 0), totalP,
          ].join(";"));
          rows.push([
            "", "", `${sub.name} (Real)`,
            ...actual.map(v => v || 0), totalA,
          ].join(";"));
        });
      });
    });

    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `kappy-budget-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    // Usa o print do browser com estilos dedicados
    const style = document.createElement("style");
    style.id    = "kappy-print-style";
    style.innerHTML = `
      @media print {
        body > * { display: none !important; }
        #kappy-budget-print { display: block !important; }
        @page { size: A3 landscape; margin: 10mm; }
      }
    `;
    document.head.appendChild(style);

    const el   = document.getElementById("budget-table-container");
    const wrap = document.createElement("div");
    wrap.id    = "kappy-budget-print";
    wrap.style.cssText = "display:none;font-family:sans-serif;font-size:11px;color:#000;";
    wrap.innerHTML     = `<h2 style="margin-bottom:8px">Planeamento ${year}</h2>` + el.innerHTML;
    document.body.appendChild(wrap);

    window.print();

    document.head.removeChild(style);
    document.body.removeChild(wrap);
  }

  async function exportPNG() {
    const el = document.getElementById("budget-table-container");
    if (!el) return;

    // Usa html2canvas via CDN
    if (!window.html2canvas) {
      const script = document.createElement("script");
      script.src   = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      document.head.appendChild(script);
      await new Promise(res => { script.onload = res; });
    }

    const canvas = await window.html2canvas(el, {
      backgroundColor: "var(--surface-card)",
      scale:           2,
      useCORS:         true,
    });

    const a    = document.createElement("a");
    a.href     = canvas.toDataURL("image/png");
    a.download = `kappy-budget-${year}.png`;
    a.click();
  }

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
    textAlign: "right", padding: "10px 10px", fontSize: 11, color: "var(--text-faint)",
    textTransform: "uppercase", letterSpacing: 1, fontWeight: 600,
    minWidth: wide ? 96 : 88, borderLeft: "1px solid #2a2d3a22",
  });

  return (
    <div data-testid="budget-page">
      <Toast toast={toast} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            {t("budget.title")}
          </h2>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              onClick={() => setYear(y => y - 1)}
              style={{ background: "var(--surface-raised)", border: "1px solid #2a2d3a", borderRadius: 8, padding: "4px 10px", color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}
            >‹</button>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--brand-light)", minWidth: 44, textAlign: "center" }}>{year}</span>
            <button
              onClick={() => setYear(y => y + 1)}
              style={{ background: "var(--surface-raised)", border: "1px solid #2a2d3a", borderRadius: 8, padding: "4px 10px", color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}
            >›</button>
          </div>
        </div>

        {/* Expand / Collapse all + Export */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={expandAll} disabled={allExpanded}
            style={{ background: "transparent", border: "1px solid #2a2d3a", borderRadius: 8, padding: "4px 12px", fontSize: 11, cursor: allExpanded ? "default" : "pointer", color: allExpanded ? "var(--border-strong)" : "var(--text-muted)" }}>
            ▼ {t("budget.expandAll")}
          </button>
          <button onClick={collapseAll} disabled={allCollapsed}
            style={{ background: "transparent", border: "1px solid #2a2d3a", borderRadius: 8, padding: "4px 12px", fontSize: 11, cursor: allCollapsed ? "default" : "pointer", color: allCollapsed ? "var(--border-strong)" : "var(--text-muted)" }}>
            ▶ {t("budget.collapseAll")}
          </button>

          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />

          {[
            { label: "CSV", fn: exportCSV, icon: "⬇" },
            { label: "PDF", fn: exportPDF, icon: "🖨" },
            { label: "PNG", fn: exportPNG, icon: "🖼" },
          ].map(({ label, fn, icon }) => (
            <button key={label} onClick={fn}
              style={{
                background: "transparent", border: "1px solid #2a2d3a", borderRadius: 8,
                padding: "4px 12px", fontSize: 11, cursor: "pointer", color: "var(--text-muted)",
                display: "flex", alignItems: "center", gap: 4,
                transition: "all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand-light)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 12 }}>
        <span style={{ color: "var(--text-muted)" }}>● {t("budget.legend.planned")}</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>● {t("budget.legend.actual")}</span>
        <span style={{ color: "var(--success)" }}>● {t("budget.legend.diff")}</span>
      </div>

      {/* Table */}
      <div id="budget-table-container" style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #2a2d3a", isolation: "isolate" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 1300, width: "100%", fontSize: 13 }}>
          <thead>
            {/* Main header */}
            <tr style={{ background: "var(--surface-raised)", position: "sticky", top: 0, zIndex: 4 }}>
              <th style={{
                textAlign: "left", padding: "10px 16px", fontSize: 11, color: "var(--text-faint)",
                textTransform: "uppercase", letterSpacing: 1, fontWeight: 600,
                ...stickyTd("var(--surface-raised)"), zIndex: 5, position: "sticky",
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
            <tr style={{ background: "var(--surface-base)", position: "sticky", top: 37, zIndex: 3 }}>
              <th style={{ ...stickyTd("var(--surface-base)"), padding: "3px 16px", fontSize: 10, color: "var(--text-faint)", textAlign: "left", position: "sticky", zIndex: 4 }}>
                <span style={{ color: "var(--text-muted)" }}>Orç.</span>
                {" / "}
                <span style={{ color: "var(--text-primary)" }}>Real</span>
                {" / "}
                <span style={{ color: "var(--success)" }}>Dif.</span>
              </th>
              {Array.from({ length: 13 }).map((_, i) => (
                <th key={i} style={{ padding: "3px 10px", textAlign: "right", borderLeft: "1px solid #2a2d3a11" }}>
                  <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Orç.</span>
                  <span style={{ fontSize: 9, color: "var(--text-primary)", marginLeft: 4 }}>Real</span>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {orderedCats.map(({ type, cats }) => (
              cats.map(cat => {
                // Mostra TODAS as subcategorias — orçamento pode ser zero
                const allSubs = subcategories.filter(s => s.categoryId === cat.id);

                if (allSubs.length === 0) return null;

                const catBudgetMonth = (mi) => allSubs.reduce((s, sub) => s + getBudget(sub.id, mi + 1), 0);
                const catActualMonth = (mi) => allSubs.reduce((s, sub) => s + getActual(sub.id, mi + 1), 0);
                const catBudgetYear  = Array.from({ length: 12 }, (_, i) => i).reduce((s, m) => s + catBudgetMonth(m), 0);
                const catActualYear  = Array.from({ length: 12 }, (_, i) => i).reduce((s, m) => s + catActualMonth(m), 0);

                return [
                  // ── Nível 1: Tipo ─────────────────────────
                  <tr key={`type-${type}-${cat.id}`} style={{ background: "var(--surface-base)" }}>
                    <td style={{ padding: "5px 16px", ...stickyTd("var(--surface-base)") }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                        letterSpacing: 2, color: TYPE_SECTION_COLOR[type],
                      }}>
                        {TYPE_SECTION_LABEL[type]}
                      </span>
                    </td>
                    {Array.from({ length: 14 }).map((_, i) => <td key={i} style={{ background: "var(--surface-base)" }} />)}
                  </tr>,

                  // ── Nível 2: Categoria ────────────────────
                  <tr key={`cat-${cat.id}`} style={{ background: "var(--surface-base)", cursor: "pointer" }}
                    onClick={() => toggleCat(cat.id)}>
                    <td style={{ padding: "4px 16px 4px 24px", ...stickyTd("var(--surface-base)") }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, color: "var(--text-faint)", userSelect: "none" }}>
                          {collapsed[cat.id] ? "▶" : "▼"}
                        </span>
                        {cat.name}
                      </span>
                    </td>
                    {Array.from({ length: 12 }, (_, i) => i).map(mi => {
                      const b    = catBudgetMonth(mi);
                      const a    = catActualMonth(mi);
                      const isPos = type === "income" || type === "investment";
                      const diff  = isPos ? a - b : b - a;
                      return (
                        <td key={mi} style={{ padding: "4px 10px", textAlign: "right", verticalAlign: "top", borderLeft: "1px solid #2a2d3a11", background: "var(--surface-base)" }}>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{b > 0 ? fmt(b) : "—"}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: TYPE_SECTION_COLOR[type], fontVariantNumeric: "tabular-nums" }}>{a > 0 ? fmt(a) : "—"}</div>
                          {(b > 0 || a > 0) && (
                            <div style={{ fontSize: 10, color: diff >= 0 ? "var(--success)" : "var(--danger)", fontVariantNumeric: "tabular-nums" }}>
                              {diff >= 0 ? "+" : ""}{fmt(diff)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ padding: "4px 12px", textAlign: "right", borderLeft: "1px solid #2a2d3a", verticalAlign: "top", background: "var(--surface-base)" }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{catBudgetYear > 0 ? fmt(catBudgetYear) : "—"}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: TYPE_SECTION_COLOR[type], fontVariantNumeric: "tabular-nums" }}>{catActualYear > 0 ? fmt(catActualYear) : "—"}</div>
                    </td>
                    <td style={{ background: "var(--surface-base)" }} />
                  </tr>,

                  // ── Nível 3: Subcategorias ────────────────
                  ...(!collapsed[cat.id] ? allSubs.map(sub => {
                    const budgetYear = Array.from({ length: 12 }, (_, i) => i + 1).reduce((s, m) => s + getBudget(sub.id, m), 0);
                    const actualYear = Array.from({ length: 12 }, (_, i) => i + 1).reduce((s, m) => s + getActual(sub.id, m), 0);
                    const isPos      = sub.type === "income" || sub.type === "investment";
                    const yearDiff   = isPos ? actualYear - budgetYear : budgetYear - actualYear;

                    return (
                      <tr key={`sub-${sub.id}`}
                        style={{ borderTop: "1px solid #2a2d3a22", background: "var(--surface-card)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-overlay)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "var(--surface-card)"; }}
                      >
                        <td style={{ padding: "0 12px 0 36px", ...stickyTd("var(--surface-card)") }}>
                          <div style={{ padding: "6px 0" }}>
                            <div style={{ color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 12 }}>
                              {sub.name}
                            </div>
                          </div>
                        </td>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => renderCell(sub.id, month))}
                        <td style={{ padding: "4px 12px", borderLeft: "1px solid #2a2d3a", verticalAlign: "top", minWidth: 88 }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{budgetYear > 0 ? fmt(budgetYear) : "—"}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: actualYear > 0 ? "var(--text-primary)" : "var(--text-ghost)", fontVariantNumeric: "tabular-nums" }}>{actualYear > 0 ? fmt(actualYear) : "—"}</div>
                            {(budgetYear > 0 || actualYear > 0) && (
                              <div style={{ fontSize: 10, color: yearDiff >= 0 ? "var(--success)" : "var(--danger)", fontVariantNumeric: "tabular-nums" }}>
                                {yearDiff >= 0 ? "+" : ""}{fmt(yearDiff)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "0 6px", textAlign: "center", verticalAlign: "middle" }}>
                          <button
                            data-testid="budget-remove-btn"
                            onClick={async () => { await removeRow(year, sub.id); showToast(t("budget.toast.rowRemoved")); }}
                            style={{ background: "transparent", border: "none", color: "var(--text-ghost)", cursor: "pointer", fontSize: 15, padding: "4px" }}
                          >×</button>
                        </td>
                      </tr>
                    );
                  }) : []),
                ];
              })
            ))}

            {/* Separator */}
            <tr style={{ height: 2, background: "var(--border)" }}>
              {Array.from({ length: 15 }).map((_, i) => <td key={i} style={{ background: "var(--border)", padding: 0 }} />)}
            </tr>

            {/* Total Ganhos + Total Despesas */}
            {["income", "expense"].map(section => {
              const types      = section === "income" ? INCOME_TYPES : EXPENSE_TYPES;
              const color      = section === "income" ? "var(--success)" : "var(--danger)";
              const bg         = section === "income" ? "var(--success-bg)" : "var(--danger-bg)";
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
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{b > 0 ? fmt(b) : "—"}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{a > 0 ? fmt(a) : "—"}</div>
                      </td>
                    );
                  })}
                  <td style={{ padding: "4px 12px", textAlign: "right", borderLeft: "1px solid #2a2d3a", verticalAlign: "top" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{fmt(yearBudget)}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{fmt(yearActual)}</div>
                  </td>
                  <td />
                </tr>
              );
            })}

            {/* Saldo do Mês */}
            <tr style={{ background: "var(--surface-raised)", borderTop: "2px solid #6366f1" }}>
              <td style={{ padding: "8px 16px", fontSize: 13, fontWeight: 700, color: "var(--brand-light)", ...stickyTd("var(--surface-raised)"), whiteSpace: "nowrap", borderRight: "2px solid #6366f1" }}>
                ◈ {t("budget.netBalance")}
              </td>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                const bNet = monthTotal(m, INCOME_TYPES, "budget") - monthTotal(m, EXPENSE_TYPES, "budget");
                const aNet = monthTotal(m, INCOME_TYPES, "actual") - monthTotal(m, EXPENSE_TYPES, "actual");
                return (
                  <td key={m} style={{ padding: "4px 10px", textAlign: "right", verticalAlign: "top" }}>
                    <div style={{ fontSize: 11, color: bNet >= 0 ? "var(--text-muted)" : "var(--danger)", fontVariantNumeric: "tabular-nums" }}>{bNet >= 0 ? "+" : ""}{fmt(bNet)}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: aNet >= 0 ? "var(--success)" : "var(--danger)", fontVariantNumeric: "tabular-nums" }}>{aNet >= 0 ? "+" : ""}{fmt(aNet)}</div>
                  </td>
                );
              })}
              <td style={{ padding: "4px 12px", textAlign: "right", borderLeft: "1px solid #6366f1", verticalAlign: "top" }}>
                {(() => {
                  const bNet = Array.from({ length: 12 }, (_, i) => i + 1).reduce((s, m) => s + monthTotal(m, INCOME_TYPES, "budget") - monthTotal(m, EXPENSE_TYPES, "budget"), 0);
                  const aNet = Array.from({ length: 12 }, (_, i) => i + 1).reduce((s, m) => s + monthTotal(m, INCOME_TYPES, "actual") - monthTotal(m, EXPENSE_TYPES, "actual"), 0);
                  return (
                    <>
                      <div style={{ fontSize: 11, color: bNet >= 0 ? "var(--text-muted)" : "var(--danger)", fontVariantNumeric: "tabular-nums" }}>{bNet >= 0 ? "+" : ""}{fmt(bNet)}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: aNet >= 0 ? "var(--success)" : "var(--danger)", fontVariantNumeric: "tabular-nums" }}>{aNet >= 0 ? "+" : ""}{fmt(aNet)}</div>
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