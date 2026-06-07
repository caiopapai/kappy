// src/features/accounts/AccountsPage.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccountsStore }    from "../../store/accountsStore";
import { useCreditCardsStore } from "../../store/creditCardsStore";
import { useLoansStore }       from "../../store/loansStore";
import { useCategoriesStore }   from "../../store/categoriesStore";
import { useToast }            from "../../hooks/useToast";
import { ACCOUNT_TYPES, CURRENCY_SYMBOLS } from "../../data/constants";
import { Button, Select, Card } from "../../components/ui";
import { Toast } from "../../components/ui/Toast";

function fmt(amount, currency = "EUR") {
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  return sym + " " + Math.abs(amount || 0).toLocaleString("pt-PT", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

function accountIcon(type) {
  return ACCOUNT_TYPES.find(a => a.value === type)?.icon || "💰";
}

// ── Page ──────────────────────────────────────────────────────

export default function AccountsPage() {
  const { t } = useTranslation();
  const { accounts, save: saveAccount, delete: deleteAccount } = useAccountsStore();
  const { creditCards, save: saveCard, delete: deleteCard }    = useCreditCardsStore();
  const { loans, save: saveLoan, delete: deleteLoan }          = useLoansStore();
  const { toast, showToast } = useToast();

  // form: { type, item, accountId }
  const [form, setForm] = useState(null);

  function openForm(type, accountId, item = null) {
    setForm({ type, accountId, item });
  }
  function closeForm() { setForm(null); }

  async function handleSaveAccount(data) {
    await saveAccount(data);
    showToast(data.id ? t("accounts.toast.updated") : t("accounts.toast.created"));
    closeForm();
  }
  async function handleSaveCard(data) {
    await saveCard(data);
    showToast("Cartão guardado");
    closeForm();
  }
  async function handleSaveLoan(data) {
    await saveLoan(data);
    showToast("Empréstimo guardado");
    closeForm();
  }

  return (
    <div data-testid="accounts-page">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base font-semibold text-primary">{t("accounts.title")}</h2>
        <Button
          data-testid="account-add-btn"
          onClick={() => openForm("account", null)}
        >
          + {t("accounts.add")}
        </Button>
      </div>

      {/* Formulário de nova conta */}
      {form?.type === "account" && !form.accountId && (
        <AccountForm
          item={form.item}
          onSave={handleSaveAccount}
          onCancel={closeForm}
        />
      )}

      {/* Lista de contas — cada uma com filhos */}
      <div data-testid="accounts-list" className="flex flex-col gap-4">
        {accounts.map(acc => {
          const cards = creditCards.filter(c => String(c.accountId) === String(acc.id));
          const accLoans = loans.filter(l => String(l.accountId) === String(acc.id));

          return (
            <AccountCard
              key={acc.id}
              account={acc}
              cards={cards}
              loans={accLoans}
              isFormOpen={form?.accountId === acc.id}
              formType={form?.type}
              formItem={form?.item}
              onEdit={() => openForm("account", null, acc)}
              onDelete={async () => { await deleteAccount(acc.id); showToast(t("accounts.toast.deleted")); }}
              onAddCard={() => openForm("credit_card", acc.id)}
              onAddLoan={() => openForm("loan", acc.id)}
              onEditCard={c => openForm("credit_card", acc.id, c)}
              onEditLoan={l => openForm("loan", acc.id, l)}
              onDeleteCard={async c => { await deleteCard(c.id); showToast("Cartão removido"); }}
              onDeleteLoan={async l => { await deleteLoan(l.id); showToast("Empréstimo removido"); }}
              onSaveCard={d => handleSaveCard({ ...d, accountId: acc.id })}
              onSaveLoan={d => handleSaveLoan({ ...d, accountId: acc.id })}
              onCloseForm={closeForm}
            />
          );
        })}

        {accounts.length === 0 && !form && (
          <Card data-testid="accounts-empty" className="text-center text-faint py-10">
            {t("accounts.empty")}
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Account Card (pai) ────────────────────────────────────────

function AccountCard({
  account, cards, loans,
  isFormOpen, formType, formItem,
  onEdit, onDelete,
  onAddCard, onAddLoan,
  onEditCard, onEditLoan,
  onDeleteCard, onDeleteLoan,
  onSaveCard, onSaveLoan, onCloseForm,
}) {
  const { t }      = useTranslation();
  const [viewing, setViewing] = useState(null); // null | "account" | cardId | loanId
  const isPositive = (parseFloat(account.balance) || 0) >= 0;
  const typeInfo   = ACCOUNT_TYPES.find(a => a.value === account.type);

  return (
    <div
      data-testid={`account-card-${account.id}`}
      data-account-id={account.id}
      className="rounded-xl border border-default overflow-hidden"
      style={{ background: "var(--surface-card)" }}
    >
      {/* Cabeçalho da conta */}
      <div className="flex items-center justify-between p-4 border-b border-default">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{accountIcon(account.type)}</span>
          <div>
            <div data-testid="account-name" className="text-sm font-semibold text-primary">
              {account.name}
            </div>
            <div className="text-xs text-faint">
              {typeInfo ? t("accounts.types." + account.type) : account.type} · {account.currency}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div
            data-testid="account-balance"
            className="text-lg font-bold tabular-nums"
            style={{ color: isPositive ? "var(--success)" : "var(--danger)" }}
          >
            {account.balance < 0 ? "-" : ""}{fmt(account.balance, account.currency)}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setViewing(viewing === "account" ? null : "account")}
              className="px-3 py-1 rounded-lg text-xs border border-default text-muted cursor-pointer"
              style={{ background: viewing === "account" ? "var(--surface-overlay)" : "transparent" }}
            >
              👁 Ver
            </button>
            <button
              data-testid="account-edit-btn"
              onClick={onEdit}
              className="px-3 py-1 rounded-lg text-xs border border-default text-muted cursor-pointer"
              style={{ background: "transparent" }}
            >
              {t("common.edit")}
            </button>
            <button
              data-testid="account-delete-btn"
              onClick={onDelete}
              className="px-3 py-1 rounded-lg text-xs cursor-pointer"
              style={{ background: "transparent", border: "1px solid var(--danger-bg)", color: "var(--danger)" }}
            >
              {t("common.delete")}
            </button>
          </div>
        </div>
      </div>

      {/* Detalhe da conta */}
      {viewing === "account" && (
        <div className="px-4 py-3 border-b border-default" style={{ background: "var(--surface-raised)" }}>
          <div className="grid gap-2 text-xs" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div><span className="text-faint">Nome: </span><span className="text-primary font-medium">{account.name}</span></div>
            <div><span className="text-faint">Tipo: </span><span className="text-primary font-medium">{typeInfo ? t("accounts.types." + account.type) : account.type}</span></div>
            <div><span className="text-faint">Saldo: </span><span className="font-bold tabular-nums" style={{ color: isPositive ? "var(--success)" : "var(--danger)" }}>{fmt(account.balance, account.currency)}</span></div>
            <div><span className="text-faint">Moeda: </span><span className="text-primary font-medium">{account.currency}</span></div>
          </div>
        </div>
      )}

      {/* Cartões filhos */}
      {cards.length > 0 && (
        <div className="px-4 py-2 flex flex-col gap-2">
          {cards.map(card => (
            <React.Fragment key={card.id}>
              <CreditCardRow
                card={card}
                onView={() => setViewing(viewing === card.id ? null : card.id)}
                onEdit={() => onEditCard(card)}
                onDelete={() => onDeleteCard(card)}
              />
              {viewing === card.id && (
                <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "var(--surface-overlay)", border: "1px solid var(--border)" }}>
                  <div className="grid gap-1.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <div><span className="text-faint">Limite: </span><span className="text-primary font-medium tabular-nums">{fmt(card.limit, card.currency)}</span></div>
                    <div><span className="text-faint">Utilizado: </span><span className="font-medium tabular-nums" style={{ color: "var(--warning)" }}>{fmt(card.used, card.currency)}</span></div>
                    <div><span className="text-faint">Disponível: </span><span className="text-success font-medium tabular-nums">{fmt(card.available || (card.limit - card.used), card.currency)}</span></div>
                    <div><span className="text-faint">Vencimento: </span><span className="text-primary font-medium">Dia {card.due_date}</span></div>
                    <div><span className="text-faint">Fecho fatura: </span><span className="text-primary font-medium">Dia {card.close_date}</span></div>
                    <div><span className="text-faint">Moeda: </span><span className="text-primary font-medium">{card.currency}</span></div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Empréstimos filhos */}
      {loans.length > 0 && (
        <div className="px-4 py-2 flex flex-col gap-2">
          {loans.map(loan => (
            <React.Fragment key={loan.id}>
              <LoanRow
                loan={loan}
                onView={() => setViewing(viewing === loan.id ? null : loan.id)}
                onEdit={() => onEditLoan(loan)}
                onDelete={() => onDeleteLoan(loan)}
              />
              {viewing === loan.id && (
                <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "var(--surface-overlay)", border: "1px solid var(--border)" }}>
                  <div className="grid gap-1.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    <div><span className="text-faint">Contratado: </span><span className="text-primary font-medium tabular-nums">{fmt(loan.contracted, loan.currency)}</span></div>
                    <div><span className="text-faint">Pago: </span><span className="text-success font-medium tabular-nums">{fmt(loan.paid, loan.currency)}</span></div>
                    <div><span className="text-faint">Em dívida: </span><span className="text-danger font-medium tabular-nums">{fmt(loan.remaining || (loan.contracted - loan.paid), loan.currency)}</span></div>
                    <div><span className="text-faint">Prestação: </span><span className="text-primary font-medium tabular-nums">{fmt(loan.installment, loan.currency)}/mês</span></div>
                    {loan.start_date && <div><span className="text-faint">Início: </span><span className="text-primary font-medium">{new Date(loan.start_date).toLocaleDateString("pt-PT")}</span></div>}
                    {loan.end_date   && <div><span className="text-faint">Fim: </span><span className="text-primary font-medium">{new Date(loan.end_date).toLocaleDateString("pt-PT")}</span></div>}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Formulário inline */}
      {isFormOpen && formType === "credit_card" && (
        <div className="px-4 pb-4 pt-2 border-t border-default">
          <CreditCardForm
            item={formItem}
            onSave={onSaveCard}
            onCancel={onCloseForm}
          />
        </div>
      )}
      {isFormOpen && formType === "loan" && (
        <div className="px-4 pb-4 pt-2 border-t border-default">
          <LoanForm
            item={formItem}
            onSave={onSaveLoan}
            onCancel={onCloseForm}
          />
        </div>
      )}

      {/* Rodapé com acções */}
      {!isFormOpen && (
        <div
          className="flex gap-2 px-4 py-2 border-t border-default"
          style={{ background: "var(--surface-raised)" }}
        >
          <button
            onClick={onAddCard}
            className="px-3 py-1 rounded-lg text-xs cursor-pointer"
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            + 💳 Cartão
          </button>
          <button
            onClick={onAddLoan}
            className="px-3 py-1 rounded-lg text-xs cursor-pointer"
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            + 🏦 Empréstimo
          </button>
        </div>
      )}
    </div>
  );
}

// ── Credit Card Row (filho) ───────────────────────────────────

function CreditCardRow({ card, onView, onEdit, onDelete }) {
  const used      = parseFloat(card.used)  || 0;
  const limit     = parseFloat(card.limit) || 0;
  const pct       = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const barColor  = pct >= 80 ? "var(--danger)" : pct >= 60 ? "var(--warning)" : "var(--success)";
  const cardColor = card.color || "var(--brand)";
  const available = parseFloat(card.available) || Math.max(limit - used, 0);

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{
        background: "var(--surface-raised)",
        borderLeft: `3px solid ${cardColor}`,
      }}
    >
      <span className="text-lg shrink-0">💳</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-primary">{card.name}</span>
          <span className="text-xs text-faint">Vence dia {card.due_date}</span>
        </div>
        <div className="h-1.5 bg-[var(--surface-overlay)] rounded-full overflow-hidden mb-1">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: pct + "%", background: barColor }}
          />
        </div>
        <div className="flex justify-between text-xs tabular-nums">
          <span style={{ color: barColor }}>{fmt(used, card.currency)}</span>
          <span className="text-faint">/ {fmt(limit, card.currency)}</span>
          <span className="text-secondary">Disp: {fmt(available, card.currency)}</span>
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onView}
          className="px-2 py-1 rounded text-xs cursor-pointer"
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          👁
        </button>
        <button onClick={onEdit}
          className="px-2 py-1 rounded text-xs cursor-pointer"
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          ✏
        </button>
        <button onClick={onDelete}
          className="px-2 py-1 rounded text-xs cursor-pointer"
          style={{ background: "transparent", border: "1px solid var(--danger-bg)", color: "var(--danger)" }}>
          ×
        </button>
      </div>
    </div>
  );
}

// ── Loan Row (filho) ──────────────────────────────────────────

function LoanRow({ loan, onView, onEdit, onDelete }) {
  const contracted = parseFloat(loan.contracted) || 0;
  const paid       = parseFloat(loan.paid)       || 0;
  const remaining  = parseFloat(loan.remaining)  || Math.max(contracted - paid, 0);
  const pct        = contracted > 0 ? Math.min((paid / contracted) * 100, 100) : 0;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{
        background: "var(--surface-raised)",
        borderLeft: "3px solid var(--info)",
      }}
    >
      <span className="text-lg shrink-0">🏦</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-primary">{loan.name}</span>
          <span className="text-xs text-faint">{Math.round(pct)}% pago</span>
        </div>
        <div className="h-1.5 bg-[var(--surface-overlay)] rounded-full overflow-hidden mb-1">
          <div
            className="h-full rounded-full bg-[var(--success)] transition-all"
            style={{ width: pct + "%" }}
          />
        </div>
        <div className="flex justify-between text-xs tabular-nums">
          <span className="text-success">{fmt(paid, loan.currency)} pago</span>
          <span className="text-danger">Em dívida: {fmt(remaining, loan.currency)}</span>
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onView}
          className="px-2 py-1 rounded text-xs cursor-pointer"
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          👁
        </button>
        <button onClick={onEdit}
          className="px-2 py-1 rounded text-xs cursor-pointer"
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          ✏
        </button>
        <button onClick={onDelete}
          className="px-2 py-1 rounded text-xs cursor-pointer"
          style={{ background: "transparent", border: "1px solid var(--danger-bg)", color: "var(--danger)" }}>
          ×
        </button>
      </div>
    </div>
  );
}

// ── Account Form ──────────────────────────────────────────────

function AccountForm({ item, onSave, onCancel }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(
    item || { name: "", type: "checking", balance: "", currency: "EUR" }
  );

  return (
    <Card className="mb-6" style={{ borderColor: "var(--border-focus)" }}>
      <div className="text-sm font-semibold text-brand-light mb-4">
        {item ? "✏ Editar Conta" : "+ Nova Conta"}
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="label-base">{t("accounts.form.name")}</label>
          <input className="input-base"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Nome da conta" />
        </div>
        <Select label={t("accounts.form.type")} value={form.type}
          onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
          {ACCOUNT_TYPES
            .filter(a => !["credit_card", "loan"].includes(a.value))
            .map(a => (
              <option key={a.value} value={a.value}>
                {a.icon} {t("accounts.types." + a.value)}
              </option>
            ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="label-base">{t("accounts.form.balance")}</label>
            <input className="input-base" type="text"
              value={form.balance}
              onChange={e => setForm(p => ({ ...p, balance: e.target.value }))}
              placeholder="0.00" />
          </div>
          <Select label={t("accounts.form.currency")} value={form.currency}
            onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
            <option value="EUR">€ Euro</option>
            <option value="BRL">R$ Real</option>
            <option value="USD">$ Dollar</option>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button data-testid="account-save-btn"
            onClick={() => onSave({ ...form, balance: parseFloat(form.balance) || 0 })}>
            {t("common.save")}
          </Button>
          <Button data-testid="account-cancel-btn" variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Credit Card Form ──────────────────────────────────────────

function CreditCardForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item || {
    name: "", bank: "", limit: "", used: "0", currency: "EUR",
    due_date: "10", close_date: "3", color: "#6366f1",
  });

  return (
    <div>
      <div className="text-xs font-semibold text-brand-light mb-3 uppercase tracking-wide">
        {item ? "✏ Editar Cartão" : "+ Novo Cartão de Crédito"}
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Nome do cartão</label>
          <input className="input-base" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Ex: Visa NuBank" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Limite</label>
          <input className="input-base" type="number" value={form.limit}
            onChange={e => setForm(p => ({ ...p, limit: e.target.value }))}
            placeholder="5000" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Saldo utilizado actual</label>
          <input className="input-base" type="number" value={form.used}
            onChange={e => setForm(p => ({ ...p, used: e.target.value }))}
            placeholder="0" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Dia de vencimento</label>
          <input className="input-base" type="number" min="1" max="31"
            value={form.due_date}
            onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
            placeholder="10" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Dia de fecho da fatura</label>
          <input className="input-base" type="number" min="1" max="31"
            value={form.close_date}
            onChange={e => setForm(p => ({ ...p, close_date: e.target.value }))}
            placeholder="3" />
        </div>
        <Select label="Moeda" value={form.currency}
          onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
          <option value="EUR">€ Euro</option>
          <option value="BRL">R$ Real</option>
          <option value="USD">$ Dollar</option>
        </Select>
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Cor do cartão</label>
          <div className="flex gap-2 flex-wrap mt-1">
            {["#6366f1","#8b5cf6","#ec4899","#f97316","#10b981","#3b82f6","#f59e0b"].map(c => (
              <button key={c}
                onClick={() => setForm(p => ({ ...p, color: c }))}
                style={{
                  width: 24, height: 24, borderRadius: "50%", background: c,
                  cursor: "pointer", border: form.color === c
                    ? "3px solid var(--text-primary)"
                    : "3px solid transparent",
                }} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => onSave({
          ...form,
          limit:      parseFloat(form.limit)    || 0,
          used:       parseFloat(form.used)     || 0,
          due_date:   parseInt(form.due_date)   || 10,
          close_date: parseInt(form.close_date) || 3,
        })}>
          Guardar
        </Button>
        <button onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm cursor-pointer"
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Loan Form ─────────────────────────────────────────────────

function LoanForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item || {
    name: "", contracted: "", paid: "0",
    installment: "", currency: "EUR", start_date: "", end_date: "",
  });

  return (
    <div>
      <div className="text-xs font-semibold text-brand-light mb-3 uppercase tracking-wide">
        {item ? "✏ Editar Empréstimo" : "+ Novo Empréstimo"}
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="flex flex-col gap-1.5" style={{ gridColumn: "1 / -1" }}>
          <label className="label-base">Nome</label>
          <input className="input-base" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Ex: Crédito Habitação" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Valor contratado</label>
          <input className="input-base" type="number" value={form.contracted}
            onChange={e => setForm(p => ({ ...p, contracted: e.target.value }))}
            placeholder="20000" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Já pago</label>
          <input className="input-base" type="number" value={form.paid}
            onChange={e => setForm(p => ({ ...p, paid: e.target.value }))}
            placeholder="0" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Prestação mensal</label>
          <input className="input-base" type="number" value={form.installment}
            onChange={e => setForm(p => ({ ...p, installment: e.target.value }))}
            placeholder="450" />
        </div>
        <Select label="Moeda" value={form.currency}
          onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
          <option value="EUR">€ Euro</option>
          <option value="BRL">R$ Real</option>
          <option value="USD">$ Dollar</option>
        </Select>
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Data de início</label>
          <input className="input-base" type="date" value={form.start_date}
            onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-base">Data de fim</label>
          <input className="input-base" type="date" value={form.end_date}
            onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1.5" style={{ gridColumn: "1 / -1" }}>
          <div className="px-3 py-2 rounded-lg text-xs text-faint"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
            💡 Será criada automaticamente uma categoria <strong>Empréstimos</strong> e uma
            subcategoria com o nome da conta e do empréstimo, e uma regra recorrente
            no orçamento com base na prestação mensal e data de fim.
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => onSave({
          ...form,
          contracted:  parseFloat(form.contracted)  || 0,
          paid:        parseFloat(form.paid)        || 0,
          installment: parseFloat(form.installment) || 0,
        })}>
          Guardar
        </Button>
        <button onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm cursor-pointer"
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}