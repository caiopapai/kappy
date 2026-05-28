// src/features/pages/InvestmentsPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useInvestmentsStore } from "../../store/investmentsStore";
import { useToast } from "../../hooks/useToast";
import { CURRENCY_SYMBOLS } from "../../data/constants";
import { ASSET_TYPES, ASSET_COLOR, EXCHANGES } from "../../data/investmentsData";
import { stocksApi } from "../../services/engineApi";
import { Button, Card } from "../../components/ui";
import { Toast } from "../../components/ui/Toast";

// ── Helpers ───────────────────────────────────────────────────

function fmt(amount, currency) {
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  return sym + " " + Math.abs(amount).toLocaleString("pt-PT", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

function assetInfo(v) {
  return ASSET_TYPES.find(a => a.value === v) || { label: v, icon: "💹" };
}

function calcTotal(f) {
  return (parseFloat(f.quantity) || 0) * (parseFloat(f.unitPrice) || 0) + (parseFloat(f.otherCosts) || 0);
}

// ── Hook: pesquisa dinâmica de ações ─────────────────────────

function useStockSearch(assetType, exchange) {
  const [query,      setQuery]      = useState("");
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);

  // Decide qual tipo passar à API com base no assetType
  const apiType = assetType === "fii" ? "fund"
    : assetType === "bdr" ? "bdr"
    : "stock";

  const search = useCallback(async (q) => {
    if (!q || q.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    try {
      const data = await stocksApi.search(q, apiType);
      setResults(data || []);
      setShowDropdown(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [apiType]);

  const handleQueryChange = (value) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (value.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => search(value), 400);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  return { query, setQuery, results, loading, showDropdown, setShowDropdown, handleQueryChange, clearSearch };
}

// ── Hook: cotação automática ──────────────────────────────────

function useQuote() {
  const [state, setState] = useState({ loading: false, price: null, error: null, source: null });

  const fetch_ = useCallback(async (ticker) => {
    if (!ticker) return;
    setState({ loading: true, price: null, error: null, source: null });
    try {
      const data = await stocksApi.quote(ticker);
      if (data?.price) {
        setState({ loading: false, price: data.price, error: null, source: data.source });
      } else {
        setState({ loading: false, price: null, error: "Cotação não encontrada", source: null });
      }
    } catch (err) {
      setState({ loading: false, price: null, error: err.message, source: null });
    }
  }, []);

  const clear = () => setState({ loading: false, price: null, error: null, source: null });

  return { quoteState: state, fetchQuote: fetch_, clearQuote: clear };
}

// ── Page ──────────────────────────────────────────────────────

export default function InvestmentsPage() {
  const { t } = useTranslation();
  const { investments, save, delete: deleteInvestment } = useInvestmentsStore();
  const { toast, showToast } = useToast();

  const emptyForm = {
    opType: "buy", assetType: "etf", exchange: "", ticker: "", name: "",
    date: new Date().toISOString().slice(0, 10),
    quantity: "", unitPrice: "", otherCosts: "0", currency: "EUR", dyAnnual: "0",
  };

  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(emptyForm);
  const [editingId,   setEditingId]   = useState(null);
  const [activeTab,   setActiveTab]   = useState("portfolio");
  const [filterAsset, setFilterAsset] = useState("all");

  const isB3 = (form.assetType === "acoes" || form.assetType === "fii" || form.assetType === "bdr") && form.exchange === "B3";
  const isStockWithExchange = (form.assetType === "acoes" || form.assetType === "stocks") && form.exchange && form.exchange !== "B3";

  const stockSearch = useStockSearch(form.assetType, form.exchange);
  const { quoteState, fetchQuote, clearQuote } = useQuote();

  // ── Handlers ─────────────────────────────────────────────────

  function handleSelectStock(stock) {
    const exInfo = EXCHANGES.find(e => e.value === form.exchange);
    setForm(f => ({
      ...f,
      ticker:   stock.ticker,
      name:     stock.name,
      currency: exInfo?.currency || "BRL",
      unitPrice: stock.price ? String(stock.price) : "",
    }));
    stockSearch.setQuery(stock.ticker + " – " + stock.name);
    stockSearch.setShowDropdown(false);
    // Busca cotação actualizada
    fetchQuote(stock.ticker);
  }

  function handleAssetTypeChange(newType) {
    const needsExchange = newType === "acoes" || newType === "stocks" || newType === "fii" || newType === "bdr";
    setForm(f => ({ ...f, assetType: newType, exchange: needsExchange ? f.exchange : "", ticker: "", name: "" }));
    stockSearch.clearSearch();
    clearQuote();
  }

  function handleExchangeChange(ex) {
    const exInfo = EXCHANGES.find(e => e.value === ex);
    setForm(f => ({ ...f, exchange: ex, ticker: "", name: "", currency: exInfo?.currency || f.currency }));
    stockSearch.clearSearch();
    clearQuote();
  }

  async function handleSave() {
    if (!form.ticker || !form.date || !form.quantity || !form.unitPrice)
      return showToast(t("investments.toast.fillRequired"), "error");
    const qty   = parseFloat(form.quantity);
    const price = parseFloat(form.unitPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0)
      return showToast(t("investments.toast.invalidValues"), "error");

    const op = {
      ...form,
      id:         editingId || Date.now(),
      quantity:   qty, unitPrice: price,
      otherCosts: parseFloat(form.otherCosts) || 0,
      dyAnnual:   parseFloat(form.dyAnnual)   || 0,
      totalValue: calcTotal(form),
      ticker:     form.ticker.toUpperCase(),
    };
    try {
      await save(op);
      showToast(editingId ? t("investments.toast.updated")
        : form.opType === "buy" ? t("investments.toast.buyRegistered")
        : t("investments.toast.sellRegistered"));
      handleCancel();
    } catch {
      showToast(t("common.connectionError"), "error");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteInvestment(id);
      showToast(t("investments.toast.deleted"));
    } catch {
      showToast(t("common.connectionError"), "error");
    }
  }

  function handleEdit(op) {
    setForm({ ...op, quantity: String(op.quantity), unitPrice: String(op.unitPrice), otherCosts: String(op.otherCosts), dyAnnual: String(op.dyAnnual || 0) });
    setEditingId(op.id);
    setShowForm(true);
    stockSearch.clearSearch();
    clearQuote();
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    stockSearch.clearSearch();
    clearQuote();
  }

  // ── Derived ───────────────────────────────────────────────────

  const portfolio = Object.values(
    investments.reduce((acc, op) => {
      if (!acc[op.ticker]) acc[op.ticker] = {
        ticker: op.ticker, name: op.name, assetType: op.assetType,
        currency: op.currency, qty: 0, totalBought: 0, totalSold: 0,
        buyOps: 0, sellOps: 0, costs: 0, dyAnnual: op.dyAnnual || 0,
      };
      const p = acc[op.ticker];
      if (op.opType === "buy") {
        p.qty += op.quantity; p.totalBought += op.quantity * op.unitPrice;
        p.costs += op.otherCosts; p.buyOps++;
        if (op.dyAnnual != null) p.dyAnnual = op.dyAnnual;
      } else {
        p.qty -= op.quantity; p.totalSold += op.quantity * op.unitPrice;
        p.costs += op.otherCosts; p.sellOps++;
      }
      return acc;
    }, {})
  ).filter(p => p.qty > 0);

  const filtered    = filterAsset === "all" ? investments : investments.filter(i => i.assetType === filterAsset);
  const sorted      = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalBought = investments.filter(i => i.opType === "buy").reduce((s, i)  => s + i.totalValue, 0);
  const totalSold   = investments.filter(i => i.opType === "sell").reduce((s, i) => s + i.totalValue, 0);
  const liveTotal   = calcTotal(form);

  const tabStyle = (active) => [
    "px-5 py-2 rounded-lg text-sm font-medium transition-all border-0 cursor-pointer",
    active ? "bg-[#6366f1] text-white" : "bg-transparent text-[#5a5f78] hover:text-[#c4c0b8]",
  ].join(" ");

  const inp = "w-full bg-[#1a1d2e] border border-[#2a2d3a] rounded-lg px-3 py-2.5 text-sm text-[#e8e6e0] outline-none focus:border-[#6366f1] transition-colors";
  const lbl = "block text-[11px] text-[#5a5f78] uppercase tracking-wide font-medium mb-1.5";

  return (
    <div>
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex gap-1 bg-[#1a1d2e] rounded-xl p-1">
          <button className={tabStyle(activeTab === "portfolio")} onClick={() => setActiveTab("portfolio")}>
            {t("investments.tabs.portfolio")}
          </button>
          <button className={tabStyle(activeTab === "history")} onClick={() => setActiveTab("history")}>
            {t("investments.tabs.history")}
          </button>
        </div>
        <Button onClick={() => { handleCancel(); setShowForm(!showForm); }}>
          {showForm ? t("common.close") : "+ " + t("investments.addOperation")}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: t("investments.kpi.totalBought"),     value: fmt(totalBought, "EUR"), color: "#60a5fa" },
          { label: t("investments.kpi.totalSold"),       value: fmt(totalSold,   "EUR"), color: "#4ade80" },
          { label: t("investments.kpi.openPositions"),   value: portfolio.length,        color: "#a5b4fc" },
          { label: t("investments.kpi.totalOperations"), value: investments.length,      color: "#fb923c" },
        ].map(s => (
          <Card key={s.label} className="py-3 px-4">
            <div className="text-[11px] text-[#5a5f78] uppercase tracking-wide mb-1">{s.label}</div>
            <div className="text-xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <Card className={`mb-5 ${form.opType === "buy" ? "border-[#166534]" : "border-[#991b1b]"}`}>
          {/* Toggle compra/venda */}
          <div className="flex items-center gap-4 mb-5 flex-wrap">
            <div className="text-sm font-semibold text-[#a5b4fc]">
              {editingId ? "✏ " + t("investments.editOperation") : "+ " + t("investments.addOperation")}
            </div>
            <div className="flex gap-0.5 bg-[#0f1117] rounded-lg p-0.5">
              {[["buy", "🟢 " + t("investments.buy")], ["sell", "🔴 " + t("investments.sell")]].map(([v, l]) => (
                <button key={v} onClick={() => setForm(f => ({ ...f, opType: v }))}
                  className="px-4 py-1.5 rounded-md text-sm font-semibold transition-all border-0 cursor-pointer"
                  style={{
                    background: form.opType === v ? (v === "buy" ? "#1f3a2a" : "#3a1f1f") : "transparent",
                    color:      form.opType === v ? (v === "buy" ? "#4ade80" : "#f87171") : "#5a5f78",
                  }}
                >{l}</button>
              ))}
            </div>
          </div>

          {/* Row 1: tipo + exchange + pesquisa/ticker + data */}
          <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "1.5fr 1.5fr 1.5fr 1fr" }}>
            {/* Tipo de ativo */}
            <div>
              <label className={lbl}>{t("investments.form.assetType")}</label>
              <select className={inp} value={form.assetType} onChange={e => handleAssetTypeChange(e.target.value)}>
                {ASSET_TYPES.map(a => (
                  <option key={a.value} value={a.value}>{a.icon} {a.label}</option>
                ))}
              </select>
            </div>

            {/* Exchange */}
            <div>
              <label className={lbl}>{t("investments.form.exchange")}</label>
              <select className={inp} value={form.exchange} onChange={e => handleExchangeChange(e.target.value)}>
                <option value="">{t("investments.form.selectExchange")}</option>
                {EXCHANGES.map(e => <option key={e.value} value={e.value}>{e.flag} {e.label}</option>)}
              </select>
            </div>

            {/* Pesquisa dinâmica (B3 e FII) ou input manual */}
            <div className="relative">
              {isB3 ? (
                <>
                  <label className={lbl}>{t("investments.form.stock")}</label>
                  <div className="relative">
                    <input
                      className={inp + " pr-8"}
                      placeholder="Pesquisar por ticker ou nome..."
                      value={stockSearch.query}
                      onChange={e => stockSearch.handleQueryChange(e.target.value)}
                      onFocus={() => stockSearch.results.length > 0 && stockSearch.setShowDropdown(true)}
                      autoComplete="off"
                    />
                    {stockSearch.loading && (
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <div className="w-3.5 h-3.5 border-2 border-[#6366f133] border-t-[#6366f1] rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Dropdown de resultados */}
                  {stockSearch.showDropdown && stockSearch.results.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1a1d2e] border border-[#2a2d3a] rounded-xl shadow-2xl max-h-64 overflow-auto">
                      {stockSearch.results.map(stock => (
                        <button
                          key={stock.ticker}
                          onClick={() => handleSelectStock(stock)}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#1e2235] transition-colors cursor-pointer border-0 bg-transparent text-left"
                        >
                          <div>
                            <span className="text-sm font-bold text-[#e8e6e0]">{stock.ticker}</span>
                            <span className="text-xs text-[#5a5f78] ml-2 max-w-[180px] truncate">{stock.name}</span>
                          </div>
                          {stock.price && (
                            <span className="text-sm font-semibold text-[#4ade80] tabular-nums ml-2 shrink-0">
                              R$ {stock.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <label className={lbl}>{t("investments.form.ticker")}</label>
                  <input className={inp} placeholder="Ex: VWCE, BTC" value={form.ticker}
                    onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} />
                </>
              )}
            </div>

            {/* Data */}
            <div>
              <label className={lbl}>{t("investments.form.date")}</label>
              <input className={inp} type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>

          {/* Nome do ativo (quando não é B3) */}
          {!isB3 && (
            <div className="mb-3">
              <label className={lbl}>{t("investments.form.assetName")}</label>
              <input className={inp} placeholder="Ex: Vanguard All-World" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
          )}

          {/* Ativo seleccionado + cotação */}
          {form.ticker && form.name && (
            <div className="flex items-center justify-between bg-[#1a1d2e] border border-[#2a2d3a] rounded-xl px-4 py-3 mb-3 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                  style={{ background: (ASSET_COLOR[form.assetType] || "#60a5fa") + "22" }}>
                  {assetInfo(form.assetType).icon}
                </div>
                <div>
                  <div className="text-[15px] font-bold text-[#e8e6e0]">{form.ticker}</div>
                  <div className="text-xs text-[#5a5f78] max-w-[240px] truncate">{form.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {quoteState.loading && (
                  <div className="flex items-center gap-2 text-xs text-[#5a5f78]">
                    <div className="w-3.5 h-3.5 border-2 border-[#6366f133] border-t-[#6366f1] rounded-full animate-spin" />
                    {t("investments.quote.loading")}
                  </div>
                )}
                {quoteState.price && !quoteState.loading && (
                  <div className="flex items-center gap-3">
                    <div className="bg-[#1f3a2a] border border-[#4ade8044] rounded-lg px-3 py-1.5 text-center">
                      <div className="text-[10px] text-[#5a5f78] uppercase tracking-wide">{t("investments.quote.current")}</div>
                      <div className="text-base font-bold text-[#4ade80] tabular-nums">
                        {fmt(quoteState.price, form.currency)}
                      </div>
                      {quoteState.source && <div className="text-[10px] text-[#5a5f78]">{quoteState.source}</div>}
                    </div>
                    <Button size="sm" onClick={() => setForm(f => ({ ...f, unitPrice: String(quoteState.price) }))}>
                      {t("investments.quote.apply")}
                    </Button>
                  </div>
                )}
                {quoteState.error && !quoteState.loading && (
                  <div className="text-xs text-[#f87171]">{quoteState.error}</div>
                )}
                {!quoteState.loading && !quoteState.price && !quoteState.error && form.ticker && isB3 && (
                  <Button size="sm" variant="secondary" onClick={() => fetchQuote(form.ticker)}>
                    🔄 {t("investments.quote.current")}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Row 2: números */}
          <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr" }}>
            <div>
              <label className={lbl}>{t("investments.form.quantity")}</label>
              <input className={inp} type="number" step="any" min="0" placeholder="0"
                value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>{t("investments.form.unitPrice")}</label>
              <input className={inp} type="number" step="any" min="0" placeholder="0.00"
                value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>{t("investments.form.otherCosts")}</label>
              <input className={inp} type="number" step="any" min="0" placeholder="0.00"
                value={form.otherCosts} onChange={e => setForm(f => ({ ...f, otherCosts: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>{t("investments.form.dyAnnual")}</label>
              <input className={inp} type="number" step="any" min="0" placeholder="0.0"
                value={form.dyAnnual} onChange={e => setForm(f => ({ ...f, dyAnnual: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>{t("common.currency")}</label>
              <select className={inp} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option value="EUR">€ Euro</option>
                <option value="BRL">R$ Real</option>
                <option value="USD">$ Dólar</option>
                <option value="GBP">£ Libra</option>
              </select>
            </div>
          </div>

          {/* Total preview */}
          {liveTotal > 0 && (
            <div className="flex items-center justify-between bg-[#1a1d2e] border border-[#2a2d3a] rounded-lg px-4 py-2.5 mb-4">
              <span className="text-sm text-[#5a5f78]">{t("investments.form.total")}</span>
              <span className={`text-base font-bold tabular-nums ${form.opType === "buy" ? "text-[#60a5fa]" : "text-[#4ade80]"}`}>
                {form.opType === "buy" ? "-" : "+"}{fmt(liveTotal, form.currency)}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave}>{editingId ? t("common.save") : t("investments.addOperation")}</Button>
            <Button variant="secondary" onClick={handleCancel}>{t("common.cancel")}</Button>
          </div>
        </Card>
      )}

      {/* Portfolio Tab */}
      {activeTab === "portfolio" && <PortfolioTab portfolio={portfolio} investments={investments} />}

      {/* History Tab */}
      {activeTab === "history" && (
        <HistoryTab sorted={sorted} investments={investments}
          filterAsset={filterAsset} setFilterAsset={setFilterAsset}
          onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  );
}

// ── PortfolioTab ──────────────────────────────────────────────

function PortfolioTab({ portfolio, investments }) {
  const { t } = useTranslation();

  if (portfolio.length === 0) {
    return (
      <Card className="text-center py-16">
        <div className="text-4xl mb-4">📈</div>
        <div className="text-[15px] text-[#c4c0b8] mb-2">{t("investments.portfolio.empty")}</div>
        <div className="text-sm text-[#5a5f78]">{t("investments.portfolio.emptyDesc")}</div>
      </Card>
    );
  }

  const headers = [
    t("investments.table.asset"), t("investments.table.type"),
    t("investments.table.quantity"), t("investments.table.avgPrice"),
    t("investments.table.totalBought"), t("investments.table.totalSold"),
    t("investments.table.dy"), t("investments.table.ops"),
  ];

  return (
    <Card className="overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-[11px] text-[#5a5f78] uppercase tracking-wide">
            {headers.map((h, i) => (
              <th key={h} className={`pb-3 font-semibold ${i >= 2 ? "text-right" : "text-left"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {portfolio.map(p => {
            const ai        = assetInfo(p.assetType);
            const color     = ASSET_COLOR[p.assetType] || "#60a5fa";
            const allBuyQty = investments.filter(i => i.ticker === p.ticker && i.opType === "buy").reduce((s, i) => s + i.quantity, 0);
            const avgPrice  = allBuyQty > 0 ? p.totalBought / allBuyQty : 0;
            return (
              <tr key={p.ticker} className="border-t border-[#2a2d3a]">
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ background: color + "22" }}>
                      {ai.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#e8e6e0]">{p.ticker}</div>
                      <div className="text-xs text-[#5a5f78] max-w-[160px] truncate">{p.name}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: color + "22", color }}>
                    {ai.label}
                  </span>
                </td>
                <td className="py-3 text-right tabular-nums text-[#e8e6e0] font-semibold">
                  {p.qty % 1 === 0 ? p.qty : p.qty.toFixed(6)}
                </td>
                <td className="py-3 text-right tabular-nums text-[#c4c0b8]">{fmt(avgPrice, p.currency)}</td>
                <td className="py-3 text-right tabular-nums text-[#60a5fa] font-semibold">{fmt(p.totalBought + p.costs, p.currency)}</td>
                <td className="py-3 text-right tabular-nums" style={{ color: p.totalSold > 0 ? "#4ade80" : "#5a5f78" }}>
                  {p.totalSold > 0 ? fmt(p.totalSold, p.currency) : "—"}
                </td>
                <td className="py-3 text-right tabular-nums text-[#f59e0b] text-sm">
                  {p.dyAnnual > 0 ? p.dyAnnual.toFixed(1) + "%" : "—"}
                </td>
                <td className="py-3 text-right text-xs">
                  <span className="text-[#4ade80]">{p.buyOps}C</span>
                  {p.sellOps > 0 && <span className="text-[#f87171]"> · {p.sellOps}V</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

// ── HistoryTab ────────────────────────────────────────────────

function HistoryTab({ sorted, investments, filterAsset, setFilterAsset, onEdit, onDelete }) {
  const { t } = useTranslation();

  const headers = [
    t("investments.table.operation"), t("investments.table.date"),
    t("investments.table.asset"), t("investments.table.type"),
    t("investments.table.quantity"), t("investments.table.unitPrice"),
    t("investments.table.costs"), t("investments.table.total"), "",
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <span className="text-xs text-[#5a5f78]">{t("investments.filter")}:</span>
        <button onClick={() => setFilterAsset("all")}
          className="px-3 py-1 rounded-lg text-xs border cursor-pointer transition-all"
          style={{ borderColor: filterAsset === "all" ? "#6366f1" : "#2a2d3a", color: filterAsset === "all" ? "#a5b4fc" : "#5a5f78", background: "transparent" }}>
          {t("investments.filterAll")}
        </button>
        {ASSET_TYPES.filter(a => investments.some(i => i.assetType === a.value)).map(a => (
          <button key={a.value} onClick={() => setFilterAsset(a.value)}
            className="px-3 py-1 rounded-lg text-xs border cursor-pointer transition-all"
            style={{
              borderColor: filterAsset === a.value ? (ASSET_COLOR[a.value] || "#6366f1") : "#2a2d3a",
              color: filterAsset === a.value ? (ASSET_COLOR[a.value] || "#a5b4fc") : "#5a5f78",
              background: "transparent",
            }}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      <Card className="overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[11px] text-[#5a5f78] uppercase tracking-wide">
              {headers.map((h, i) => (
                <th key={i} className={`pb-3 pr-2 font-semibold ${i >= 4 && i <= 7 ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(op => {
              const ai    = assetInfo(op.assetType);
              const isBuy = op.opType === "buy";
              const color = ASSET_COLOR[op.assetType] || "#60a5fa";
              return (
                <tr key={op.id} className="border-t border-[#2a2d3a]">
                  <td className="py-2.5 pr-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: isBuy ? "#1f3a2a" : "#3a1f1f", color: isBuy ? "#4ade80" : "#f87171" }}>
                      {isBuy ? "🟢 " + t("investments.buy") : "🔴 " + t("investments.sell")}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-sm text-[#8a8fa8] whitespace-nowrap">
                    {new Date(op.date).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="py-2.5 pr-2">
                    <div className="text-sm font-bold text-[#e8e6e0]">{op.ticker}</div>
                    <div className="text-xs text-[#5a5f78] max-w-[130px] truncate">{op.name}</div>
                  </td>
                  <td className="py-2.5 pr-2">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: color + "22", color }}>
                      {ai.icon} {ai.label}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums text-[#e8e6e0]">
                    {op.quantity % 1 === 0 ? op.quantity : op.quantity.toFixed(6)}
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums text-[#c4c0b8]">{fmt(op.unitPrice, op.currency)}</td>
                  <td className="py-2.5 pr-2 text-right tabular-nums" style={{ color: op.otherCosts > 0 ? "#fb923c" : "#3a3d50" }}>
                    {op.otherCosts > 0 ? fmt(op.otherCosts, op.currency) : "—"}
                  </td>
                  <td className="py-2.5 pr-2 text-right text-sm font-bold tabular-nums" style={{ color: isBuy ? "#60a5fa" : "#4ade80" }}>
                    {isBuy ? "-" : "+"}{fmt(op.totalValue, op.currency)}
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <Button variant="secondary" size="sm" onClick={() => onEdit(op)} className="mr-1">✏</Button>
                    <Button variant="danger"    size="sm" onClick={() => onDelete(op.id)}>×</Button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-[#5a5f78]">
                  {t("investments.history.empty")}
                  {filterAsset !== "all" && " " + t("investments.history.emptyFilter")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}