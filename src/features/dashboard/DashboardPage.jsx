// src/features/pages/DashboardPage.jsx
import { useState, useMemo } from "react";
import { useTranslation }         from "react-i18next";
import { useTransactionsStore }   from "../../store/transactionsStore";
import { useAccountsStore }       from "../../store/accountsStore";
import { useCategoriesStore }     from "../../store/categoriesStore";
import { useInvestmentsStore }    from "../../store/investmentsStore";
import { CURRENCY_SYMBOLS }       from "../../data/constants";
import { ASSET_TYPES, ASSET_COLOR } from "../../data/investmentsData";
import { Card }                   from "../../components/ui";

// ── Helpers ───────────────────────────────────────────────────

function fmt(amount, currency = "EUR") {
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  return sym + " " + Math.abs(amount).toLocaleString("pt-PT", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

function fmtSigned(amount, currency = "EUR") {
  const sym    = CURRENCY_SYMBOLS[currency] || currency;
  const prefix = amount >= 0 ? "+" : "-";
  return prefix + sym + " " + Math.abs(amount).toLocaleString("pt-PT", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

const EXPENSE_TYPES = ["fixed_expense", "variable_expense", "investment"];
const INCOME_TYPES  = ["income"];

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function isSameMonth(dateStr, year, month) {
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() === month;
}

// ── KPI Card ──────────────────────────────────────────────────

function KpiCard({ icon, label, value, color, sub }) {
  return (
    <Card className="py-3 px-4">
      <div className="flex items-start justify-between mb-2">
        <div className="text-[11px] text-[#5a5f78] uppercase tracking-wide leading-tight">{label}</div>
        <span className="text-lg ml-2 shrink-0">{icon}</span>
      </div>
      <div className="text-xl font-bold tabular-nums" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-[#5a5f78] mt-1">{sub}</div>}
    </Card>
  );
}

// ── Month selector ────────────────────────────────────────────

function MonthSelector({ year, month, onPrev, onNext, onSelect, disableNext }) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);

  const now     = new Date();
  const minYear = 2020;
  const maxYear = now.getFullYear() + 10;

  const MONTHS_SHORT = [
    "Jan","Fev","Mar","Abr","Mai","Jun",
    "Jul","Ago","Set","Out","Nov","Dez",
  ];

  function handleSelect(m) {
    onSelect(pickerYear, m);
    setOpen(false);
  }

  function handleOpen() {
    setPickerYear(year);
    setOpen(v => !v);
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Seta esquerda */}
      <button onClick={onPrev}
        className="w-7 h-7 rounded-lg bg-[#1a1d2e] text-[#8a8fa8]
          hover:border-[#6366f1] hover:text-[#a5b4fc] transition-all cursor-pointer
          flex items-center justify-center text-base leading-none"
        style={{ border: "1px solid #2a2d3a" }}>
        ‹
      </button>

      {/* Texto clicável */}
      <button
        onClick={handleOpen}
        className="text-sm font-semibold text-[#e8e6e0] min-w-[130px] text-center
          hover:text-[#a5b4fc] transition-colors cursor-pointer bg-transparent border-0
          px-2 py-1 rounded-lg hover:bg-[#1a1d2e]"
      >
        {MONTH_NAMES[month]} {year}
        <span className="ml-1 text-[#5a5f78] text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {/* Seta direita */}
      <button onClick={onNext} disabled={disableNext}
        className="w-7 h-7 rounded-lg bg-[#1a1d2e] text-[#8a8fa8]
          hover:border-[#6366f1] hover:text-[#a5b4fc] transition-all cursor-pointer
          flex items-center justify-center text-base leading-none
          disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ border: "1px solid #2a2d3a" }}>
        ›
      </button>

      {/* Picker dropdown */}
      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-[#1a1d2e] border border-[#2a2d3a]
          rounded-xl shadow-2xl p-4 w-64">

          {/* Selector de ano */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setPickerYear(y => Math.max(y - 1, minYear))}
              disabled={pickerYear <= minYear}
              className="w-7 h-7 rounded-lg text-[#8a8fa8] hover:text-[#a5b4fc] cursor-pointer
                bg-[#0f1117] border border-[#2a2d3a] flex items-center justify-center
                disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >‹</button>
            <span className="text-sm font-bold text-[#e8e6e0]">{pickerYear}</span>
            <button
              onClick={() => setPickerYear(y => Math.min(y + 1, maxYear))}
              disabled={pickerYear >= maxYear}
              className="w-7 h-7 rounded-lg text-[#8a8fa8] hover:text-[#a5b4fc] cursor-pointer
                bg-[#0f1117] border border-[#2a2d3a] flex items-center justify-center
                disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >›</button>
          </div>

          {/* Grid de meses */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTHS_SHORT.map((m, i) => {
              const isSelected = pickerYear === year && i === month;
              const isToday    = pickerYear === now.getFullYear() && i === now.getMonth();
              return (
                <button
                  key={m}
                  onClick={() => handleSelect(i)}
                  className="py-1.5 rounded-lg text-xs font-medium cursor-pointer
                    transition-all border"
                  style={{
                    background:  isSelected ? "#6366f1" : "transparent",
                    color:       isSelected ? "#fff" : isToday ? "#a5b4fc" : "#8a8fa8",
                    borderColor: isSelected ? "#6366f1" : isToday ? "#6366f133" : "transparent",
                    fontWeight:  isToday ? "700" : undefined,
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Botão "Hoje" */}
          <button
            onClick={() => { onSelect(now.getFullYear(), now.getMonth()); setOpen(false); }}
            className="w-full mt-3 py-1.5 rounded-lg text-xs text-[#6366f1] border border-[#6366f133]
              hover:bg-[#1e2235] transition-colors cursor-pointer bg-transparent font-semibold"
          >
            Hoje — {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Expenses by Category ──────────────────────────────────────

function ExpensesByCategory({ transactions, categories, subcategories, year, month }) {
  const { t } = useTranslation();

  const txMonth = transactions.filter(tx =>
    isSameMonth(tx.date, year, month) && EXPENSE_TYPES.includes(tx.type)
  );

  const byCat = {};
  txMonth.forEach(tx => {
    const sub = subcategories.find(s => s.id === tx.subcategoryId);
    const cat = categories.find(c => c.id === sub?.categoryId);
    if (!cat) { return; }
    if (!byCat[cat.id]) {
      byCat[cat.id] = { name: cat.name, type: cat.type, total: 0 };
    }
    byCat[cat.id].total += tx.amount;
  });

  const sorted = Object.values(byCat).sort((a, b) => b.total - a.total);
  const max    = sorted[0]?.total || 1;

  const TYPE_COLOR = {
    fixed_expense:    "#f87171",
    variable_expense: "#fb923c",
    investment:       "#60a5fa",
  };

  if (sorted.length === 0) {
    return (
      <div className="text-sm text-[#5a5f78] text-center py-8">
        {t("dashboard.expenses.empty")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map(cat => {
        const color = TYPE_COLOR[cat.type] || "#8a8fa8";
        const pct   = (cat.total / max) * 100;
        return (
          <div key={cat.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#c4c0b8]">{cat.name}</span>
              <span className="tabular-nums font-semibold" style={{ color }}>
                {fmt(cat.total)}
              </span>
            </div>
            <div className="h-1.5 bg-[#2a2d3a] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: pct + "%", background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Month Comparison ──────────────────────────────────────────

function MonthComparison({ transactions, year, month }) {
  const { t } = useTranslation();

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear  = month === 0 ? year - 1 : year;

  function monthTotals(y, m) {
    const txs = transactions.filter(tx => isSameMonth(tx.date, y, m));
    return {
      income:  txs.filter(tx => INCOME_TYPES.includes(tx.type)).reduce((s, tx) => s + tx.amount, 0),
      expense: txs.filter(tx => EXPENSE_TYPES.includes(tx.type)).reduce((s, tx) => s + tx.amount, 0),
    };
  }

  const curr = monthTotals(year, month);
  const prev = monthTotals(prevYear, prevMonth);

  const rows = [
    { label: t("dashboard.comparison.income"),  curr: curr.income,  prev: prev.income,  invert: false },
    { label: t("dashboard.comparison.expense"),  curr: curr.expense, prev: prev.expense, invert: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      {rows.map(row => {
        const diff   = row.curr - row.prev;
        const pct    = row.prev > 0 ? Math.abs(diff / row.prev * 100).toFixed(0) : null;
        const isUp   = diff > 0;
        const isGood = row.invert ? !isUp : isUp;
        const color  = diff === 0 ? "#5a5f78" : isGood ? "#4ade80" : "#f87171";
        const arrow  = diff === 0 ? "—" : isUp ? "↑" : "↓";

        return (
          <div key={row.label} className="bg-[#1a1d2e] rounded-xl p-4 border border-[#2a2d3a]">
            <div className="text-xs text-[#5a5f78] mb-3">{row.label}</div>
            <div className="grid grid-cols-3 gap-2 items-end">
              <div>
                <div className="text-[10px] text-[#5a5f78] mb-1">
                  {MONTH_NAMES[prevMonth].slice(0, 3)}
                </div>
                <div className="text-sm font-semibold text-[#8a8fa8] tabular-nums">
                  {fmt(row.prev)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold" style={{ color }}>{arrow}</div>
                {pct && <div className="text-[10px]" style={{ color }}>{pct}%</div>}
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#5a5f78] mb-1">
                  {MONTH_NAMES[month].slice(0, 3)}
                </div>
                <div className="text-sm font-bold tabular-nums" style={{ color }}>
                  {fmt(row.curr)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Investments Donut ─────────────────────────────────────────

function buildPortfolio(investments) {
  const byTickerCurrency = {};

  investments.forEach(op => {
    const key = op.ticker + "_" + op.currency;
    if (!byTickerCurrency[key]) {
      byTickerCurrency[key] = {
        ticker:    op.ticker,
        assetType: op.assetType,
        currency:  op.currency,
        qty:       0,
        invested:  0,
      };
    }
    const p = byTickerCurrency[key];
    if (op.opType === "buy") {
      p.qty      += op.quantity;
      p.invested += op.quantity * op.unitPrice + (op.otherCosts || 0);
    } else {
      p.qty      -= op.quantity;
      p.invested -= op.quantity * op.unitPrice;
    }
  });

  // Agrupa por tipo de ativo e moeda
  const byTypeCurrency = {};
  Object.values(byTickerCurrency)
    .filter(p => p.qty > 0 && p.invested > 0)
    .forEach(p => {
      const key = p.assetType + "_" + p.currency;
      if (!byTypeCurrency[key]) {
        byTypeCurrency[key] = {
          assetType: p.assetType,
          currency:  p.currency,
          total:     0,
        };
      }
      byTypeCurrency[key].total += p.invested;
    });

  // Agrupa por moeda para o selector
  const byCurrency = {};
  Object.values(byTypeCurrency).forEach(item => {
    if (!byCurrency[item.currency]) {
      byCurrency[item.currency] = [];
    }
    byCurrency[item.currency].push(item);
  });

  return byCurrency;
}

function DonutChart({ slices, size = 140 }) {
  const cx = size / 2;
  const cy = size / 2;
  const R  = size * 0.38;
  const r  = size * 0.22;

  let cumAngle = -Math.PI / 2;
  const total  = slices.reduce((s, sl) => s + sl.value, 0);

  if (total === 0) { return null; }

  const paths = slices.map(sl => {
    const angle    = (sl.value / total) * 2 * Math.PI;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;

    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle);
    const y2 = cy + R * Math.sin(endAngle);
    const x3 = cx + r * Math.cos(endAngle);
    const y3 = cy + r * Math.sin(endAngle);
    const x4 = cx + r * Math.cos(startAngle);
    const y4 = cy + r * Math.sin(startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;
    const d = [
      `M ${x1} ${y1}`,
      `A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${r} ${r} 0 ${largeArc} 0 ${x4} ${y4}`,
      "Z",
    ].join(" ");

    return { d, color: sl.color, pct: ((sl.value / total) * 100).toFixed(1) };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="#161820" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function InvestmentsDonut({ investments }) {
  const { t } = useTranslation();

  const portfolio   = useMemo(() => buildPortfolio(investments), [investments]);
  const currencies  = Object.keys(portfolio);
  const [currency, setCurrency] = useState(currencies[0] || "EUR");

  if (currencies.length === 0) {
    return (
      <div className="text-sm text-[#5a5f78] text-center py-8">
        {t("dashboard.investments.empty")}
      </div>
    );
  }

  const activeCurrency = portfolio[currency] || portfolio[currencies[0]] || [];
  const total          = activeCurrency.reduce((s, item) => s + item.total, 0);

  const slices = activeCurrency.map(item => ({
    label: ASSET_TYPES.find(a => a.value === item.assetType)?.label || item.assetType,
    value: item.total,
    color: ASSET_COLOR[item.assetType] || "#8a8fa8",
    icon:  ASSET_TYPES.find(a => a.value === item.assetType)?.icon || "💹",
  })).sort((a, b) => b.value - a.value);

  const sym = CURRENCY_SYMBOLS[currency] || currency;

  return (
    <div>
      {/* Currency selector */}
      {currencies.length > 1 && (
        <div className="flex gap-1 mb-4">
          {currencies.map(c => (
            <button key={c}
              onClick={() => setCurrency(c)}
              className="px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-all"
              style={{
                borderColor: currency === c ? "#6366f1" : "#2a2d3a",
                background:  currency === c ? "#1e2235" : "transparent",
                color:       currency === c ? "#a5b4fc" : "#5a5f78",
              }}>
              {CURRENCY_SYMBOLS[c]} {c}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-5">
        {/* Donut */}
        <div className="relative shrink-0">
          <DonutChart slices={slices} size={140} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-[10px] text-[#5a5f78] uppercase tracking-wide">Total</div>
            <div className="text-xs font-bold text-[#e8e6e0] tabular-nums">
              {sym} {total.toLocaleString("pt-PT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {slices.map(sl => {
            const pct = ((sl.value / total) * 100).toFixed(1);
            return (
              <div key={sl.label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: sl.color }} />
                <span className="text-xs text-[#8a8fa8] truncate flex-1">{sl.icon} {sl.label}</span>
                <span className="text-xs tabular-nums font-semibold shrink-0" style={{ color: sl.color }}>
                  {pct}%
                </span>
                <span className="text-xs tabular-nums text-[#5a5f78] shrink-0">
                  {sym} {sl.value.toLocaleString("pt-PT", { maximumFractionDigits: 0 })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Burndown Chart (SVG) ──────────────────────────────────────

function buildBurndown(transactions, recurringRules, year, month) {
  const days    = daysInMonth(year, month);
  const txMonth = transactions.filter(tx => isSameMonth(tx.date, year, month));

  // Projecta regras recorrentes activas para o mês seleccionado
  const monthStart = new Date(year, month, 1);
  const monthEnd   = new Date(year, month + 1, 0);

  const projected = (recurringRules || [])
    .filter(r => {
      if (!r.active) { return false; }
      const start = new Date(r.startDate);
      const end   = r.hasNoEnd ? null : r.endDate ? new Date(r.endDate) : null;
      if (start > monthEnd) { return false; }
      if (end && end < monthStart) { return false; }
      return true;
    })
    .map(r => ({
      amount:        r.amount,
      type:          r.type,
      subcategoryId: r.subcategoryId,
      date:          new Date(year, month, 1).toISOString().slice(0, 10), // dia 1 do mês
    }));

  const allTx = [...txMonth, ...projected];

  const totalIncome = allTx
    .filter(tx => INCOME_TYPES.includes(tx.type))
    .reduce((s, tx) => s + tx.amount, 0);

  if (totalIncome === 0) {
    return { days: [], budget: [], real: [], totalIncome: 0 };
  }

  const dailyBurn = totalIncome / days;
  const budget    = Array.from({ length: days }, (_, i) =>
    parseFloat((totalIncome - dailyBurn * (i + 1)).toFixed(2))
  );

  const expByDay = Array(days + 1).fill(0);
  allTx
    .filter(tx => EXPENSE_TYPES.includes(tx.type))
    .forEach(tx => {
      const day = new Date(tx.date).getDate();
      expByDay[day] += tx.amount;
    });

  const real = [];
  let remaining = totalIncome;
  for (let d = 1; d <= days; d++) {
    remaining -= expByDay[d];
    real.push(parseFloat(remaining.toFixed(2)));
  }

  return {
    days:    Array.from({ length: days }, (_, i) => i + 1),
    budget,
    real,
    totalIncome,
  };
}

function BurndownChart({ data, today }) {
  const { t } = useTranslation();
  const { days, budget, real, totalIncome } = data;

  if (!days.length || totalIncome === 0) {
    return (
      <div className="flex items-center justify-center h-44 text-[#5a5f78] text-sm">
        {t("dashboard.burndown.noIncome")}
      </div>
    );
  }

  const W  = 660, H = 220;
  const PL = 58, PR = 16, PT = 16, PB = 32;
  const cW = W - PL - PR;
  const cH = H - PT - PB;

  const all    = [...budget, ...real];
  const minVal = Math.min(...all, 0);
  const maxVal = Math.max(...all, totalIncome);
  const range  = maxVal - minVal || 1;

  const xPos = (i)   => PL + (i / (days.length - 1)) * cW;
  const yPos = (val) => PT + cH - ((val - minVal) / range) * cH;

  const budgetPath = budget
    .map((v, i) => `${i === 0 ? "M" : "L"}${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`)
    .join(" ");

  let realPath = `M${xPos(0).toFixed(1)},${yPos(totalIncome).toFixed(1)}`;
  real.forEach((v, i) => {
    realPath += ` H${xPos(i).toFixed(1)} V${yPos(v).toFixed(1)}`;
  });

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const val = minVal + range * f;
    return { val, y: yPos(val) };
  });

  const todayX = today > 0 && today <= days.length ? xPos(today - 1) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
      {gridLines.map(({ val, y }) => (
        <g key={val}>
          <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#2a2d3a" strokeWidth="1" />
          <text x={PL - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#5a5f78">
            {Math.round(val)}
          </text>
        </g>
      ))}

      {minVal < 0 && (
        <line x1={PL} y1={yPos(0)} x2={W - PR} y2={yPos(0)}
          stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
      )}

      {days.filter(d => d === 1 || d % 5 === 0 || d === days.length).map(d => (
        <text key={d} x={xPos(d - 1)} y={H - PB + 14}
          textAnchor="middle" fontSize="9" fill="#5a5f78">
          {d}
        </text>
      ))}

      {todayX && (
        <>
          <line x1={todayX} y1={PT} x2={todayX} y2={H - PB}
            stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
          <text x={todayX} y={PT - 4} textAnchor="middle" fontSize="8" fill="#6366f1">
            {t("dashboard.burndown.today")}
          </text>
        </>
      )}

      <path d={budgetPath} fill="none" stroke="#4ade80" strokeWidth="1.5"
        strokeDasharray="6 3" opacity="0.7" />
      <path d={realPath}   fill="none" stroke="#60a5fa" strokeWidth="2.5" />

      <line x1={PL + 8}  y1={H - 6} x2={PL + 22} y2={H - 6}
        stroke="#4ade80" strokeWidth="1.5" strokeDasharray="6 3" />
      <text x={PL + 26} y={H - 2} fontSize="9" fill="#4ade80">
        {t("dashboard.burndown.budget")}
      </text>
      <line x1={PL + 100} y1={H - 6} x2={PL + 114} y2={H - 6}
        stroke="#60a5fa" strokeWidth="2.5" />
      <text x={PL + 118} y={H - 2} fontSize="9" fill="#60a5fa">
        {t("dashboard.burndown.real")}
      </text>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t }                                = useTranslation();
  const { transactions, recurringRules }     = useTransactionsStore();
  const { accounts }                         = useAccountsStore();
  const { categories, subcategories }        = useCategoriesStore();
  const { investments }                      = useInvestmentsStore();

  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const today          = isCurrentMonth ? now.getDate() : -1;

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else             { setMonth(m => m - 1); }
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else              { setMonth(m => m + 1); }
  }

  function selectMonth(y, m) {
    setYear(y);
    setMonth(m);
  }

  const maxYear    = now.getFullYear() + 10;
  const isMaxMonth = year >= maxYear && month === 11;

  // ── KPI data ────────────────────────────────────────────────

  const txMonth = useMemo(() =>
    transactions.filter(tx => isSameMonth(tx.date, year, month)),
  [transactions, year, month]);

  const totalIncome  = txMonth.filter(tx => INCOME_TYPES.includes(tx.type)).reduce((s, tx) => s + tx.amount, 0);
  const totalExpense = txMonth.filter(tx => EXPENSE_TYPES.includes(tx.type)).reduce((s, tx) => s + tx.amount, 0);
  const netBalance   = totalIncome - totalExpense;
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const burndown = useMemo(() =>
    buildBurndown(transactions, recurringRules, year, month),
  [transactions, recurringRules, year, month]);

  return (
    <div className="flex flex-col gap-5">

      {/* Header com selector de mês */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#f0ede8] m-0">{t("nav.dashboard")}</h2>
          <div className="text-xs text-[#5a5f78] mt-0.5">{MONTH_NAMES[month]} {year}</div>
        </div>
        <MonthSelector year={year} month={month}
          onPrev={prevMonth} onNext={nextMonth}
          onSelect={selectMonth} disableNext={isMaxMonth} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard icon="🏦" label={t("dashboard.kpi.totalBalance")}
          value={fmt(totalBalance)}
          color={totalBalance >= 0 ? "#4ade80" : "#f87171"}
          sub={`${accounts.length} ${t("dashboard.kpi.accounts")}`} />
        <KpiCard icon="💰" label={t("dashboard.kpi.monthlyIncome")}
          value={fmt(totalIncome)} color="#4ade80"
          sub={t("dashboard.kpi.incomeNote")} />
        <KpiCard icon="💸" label={t("dashboard.kpi.monthlyExpense")}
          value={fmt(totalExpense)} color="#f87171"
          sub={totalIncome > 0
            ? ((totalExpense / totalIncome) * 100).toFixed(0) + "% " + t("dashboard.kpi.ofIncome")
            : null} />
        <KpiCard icon="📊" label={t("dashboard.kpi.netBalance")}
          value={fmtSigned(netBalance)}
          color={netBalance >= 0 ? "#4ade80" : "#f87171"}
          sub={t("dashboard.kpi.remaining") + " " + fmt(Math.max(totalIncome - totalExpense, 0))} />
      </div>

      {/* Row 1: Gastos por categoria | Comparação mês */}
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <div className="text-sm font-semibold text-[#e8e6e0] mb-4">
            {t("dashboard.expenses.title")}
          </div>
          <ExpensesByCategory
            transactions={transactions} categories={categories}
            subcategories={subcategories} year={year} month={month} />
        </Card>

        <Card>
          <div className="text-sm font-semibold text-[#e8e6e0] mb-4">
            {t("dashboard.comparison.title")}
          </div>
          <MonthComparison transactions={transactions} year={year} month={month} />
        </Card>
      </div>

      {/* Row 2: Distribuição investimentos | Burndown */}
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <div className="text-sm font-semibold text-[#e8e6e0] mb-4">
            {t("dashboard.investments.title")}
          </div>
          <InvestmentsDonut investments={investments} />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-[#e8e6e0]">
                {t("dashboard.burndown.title")}
              </div>
              <div className="text-xs text-[#5a5f78] mt-0.5">
                {t("dashboard.burndown.subtitle")}
              </div>
            </div>
          </div>

          {totalIncome > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: t("dashboard.burndown.startBudget"), value: fmt(totalIncome),  color: "#4ade80" },
                { label: t("dashboard.burndown.spent"),       value: fmt(totalExpense), color: "#f87171" },
                { label: t("dashboard.burndown.remaining"),
                  value: fmt(Math.max(totalIncome - totalExpense, 0)),
                  color: (totalIncome - totalExpense) >= 0 ? "#60a5fa" : "#f87171" },
              ].map(s => (
                <div key={s.label} className="bg-[#1a1d2e] rounded-lg px-3 py-2 border border-[#2a2d3a]">
                  <div className="text-[10px] text-[#5a5f78] uppercase tracking-wide mb-1">{s.label}</div>
                  <div className="text-sm font-bold tabular-nums" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          <BurndownChart data={burndown} today={today} />
        </Card>
      </div>

    </div>
  );
}