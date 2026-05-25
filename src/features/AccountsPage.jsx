import { useState } from "react";
import { useAccountsStore } from "../store/accountsStore.js";
import { useToast } from "../hooks/useToast.js";
import { ACCOUNT_TYPES, CURRENCY_SYMBOLS } from "../data/constants.js";
import { Button, Input, Select, Card, CardTitle } from "../components/ui/index.jsx";
import { Toast } from "../components/ui/Toast.jsx";

function accountIcon(type) {
  return ACCOUNT_TYPES.find(a => a.value === type)?.icon || "💰";
}

function accountLabel(type) {
  return ACCOUNT_TYPES.find(a => a.value === type)?.label || type;
}

function formatCurrency(amount, currency) {
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  return sym + " " + Math.abs(amount).toLocaleString("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AccountsPage() {
  const { accounts, save, delete: deleteAccount } = useAccountsStore();
  const { toast, showToast } = useToast();

  const emptyForm = { name: "", type: "checking", balance: "", currency: "EUR" };
  const [form, setForm]       = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [errors, setErrors]       = useState({});

  function validate() {
    const e = {};
    if (!form.name.trim())              e.name    = "Nome obrigatório";
    if (form.balance === "")            e.balance = "Saldo obrigatório";
    if (isNaN(parseFloat(form.balance)))e.balance = "Valor inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const bal = parseFloat(form.balance);

    try {
      if (editingId !== null) {
        await save({ id: editingId, ...form, balance: bal });
        showToast("Conta actualizada!");
      } else {
        await save({ ...form, balance: bal });
        showToast("Conta criada!");
      }
      handleCancel();
    } catch {
      showToast("Erro ao guardar — verifica a ligação", "error");
    }
  }

  function handleEdit(acc) {
    setForm({
      name:     acc.name,
      type:     acc.type,
      balance:  String(acc.balance),
      currency: acc.currency,
    });
    setEditingId(acc.id);
    setErrors({});
    setShowForm(true);
  }

  async function handleDelete(id) {
    try {
      await deleteAccount(id);
      showToast("Conta removida");
    } catch {
      showToast("Erro ao remover — verifica a ligação", "error");
    }
  }


  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
    setShowForm(false);
  }

  const balanceNum = parseFloat(form.balance);
  const balanceValid = form.balance !== "" && !isNaN(balanceNum);

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
      <Toast toast={toast} />

      {}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-[#f0ede8]">Minhas Contas</h2>
          <Button onClick={() => { handleCancel(); setShowForm(true); }}>
            + Nova Conta
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
              Sem contas. Cria a primeira!
            </Card>
          )}
        </div>
      </div>

      {}
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
  const isPositive = account.balance >= 0;

  return (
    <div className={`
      flex justify-between items-center p-4 rounded-xl
      border transition-colors
      ${isEditing
        ? "bg-[#1e2235] border-[#6366f1]"
        : isPositive
          ? "bg-[#1a1d2e] border-[#1f3a2a]"
          : "bg-[#1a1d2e] border-[#3a1f1f]"}
    `}>
      {}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{accountIcon(account.type)}</span>
        <div>
          <div className="text-[15px] font-semibold text-[#e8e6e0]">{account.name}</div>
          <div className="text-xs text-[#5a5f78]">
            {accountLabel(account.type)} · {account.currency}
          </div>
        </div>
      </div>

      {}
      <div className="flex flex-col items-end gap-1.5">
        <span className={`text-base font-bold tabular-nums ${isPositive ? "text-[#4ade80]" : "text-[#f87171]"}`}>
          {account.balance < 0 ? "-" : ""}{formatCurrency(account.balance, account.currency)}
        </span>
        <div className="flex gap-1.5">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            Editar
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            Remover
          </Button>
        </div>
      </div>
    </div>
  );
}

function AccountForm({ form, setForm, errors, editingId, balanceNum, balanceValid, onSave, onCancel }) {
  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <Card className={editingId ? "border-[#6366f1]" : ""}>
      <div className="text-sm font-semibold text-[#a5b4fc] mb-5">
        {editingId ? "✏ Editar Conta" : "+ Nova Conta"}
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="Nome da Conta"
          placeholder="Ex: Conta BCP"
          value={form.name}
          onChange={set("name")}
          error={errors.name}
        />

        <Select
          label="Tipo"
          value={form.type}
          onChange={set("type")}
        >
          {ACCOUNT_TYPES.map(t => (
            <option key={t.value} value={t.value}>
              {t.icon} {t.label}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Saldo Inicial"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.balance}
            onChange={set("balance")}
            error={errors.balance}
          />
          <Select
            label="Moeda"
            value={form.currency}
            onChange={set("currency")}
          >
            <option value="EUR">€ Euro</option>
            <option value="BRL">R$ Real</option>
            <option value="USD">$ Dólar</option>
          </Select>
        </div>

        {}
        {balanceValid && (
          <div className={`px-3 py-2.5 rounded-lg text-sm font-semibold ${
            balanceNum >= 0
              ? "bg-[#1f3a2a] text-[#4ade80]"
              : "bg-[#3a1f1f] text-[#f87171]"
          }`}>
            {balanceNum >= 0 ? "✓ Saldo positivo" : "⚠ Saldo negativo"}
          </div>
        )}

        <div className="flex gap-2 mt-1">
          <Button onClick={onSave}>Guardar</Button>
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        </div>
      </div>
    </Card>
  );
}
