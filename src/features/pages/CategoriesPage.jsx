// src/features/categories/CategoriesPage.jsx
import { useState } from "react";
import { useCategoriesStore } from "../../store/categoriesStore";
import { useToast } from "../../hooks/useToast";
import { TRANSACTION_TYPES } from "../../data/constants";
import { Button, Input, Select, Card } from "../../components/ui";
import { Toast } from "../../components/ui/Toast";

// ── Helpers ───────────────────────────────────────────────────

const TYPE_COLOR = {
  income:           "#4ade80",
  investment:       "#60a5fa",
  fixed_expense:    "#f87171",
  variable_expense: "#fb923c",
};

const TYPE_COLOR_BG = {
  income:           "#1f3a2a",
  investment:       "#1a2a3a",
  fixed_expense:    "#3a1f1f",
  variable_expense: "#3a2a1f",
};

const TYPE_LABEL = {
  income:           "Ganho",
  investment:       "Investimento",
  fixed_expense:    "Despesa Fixa",
  variable_expense: "Despesa Variável",
};

// ── Componente principal ──────────────────────────────────────

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const { toast, showToast } = useToast();

  const tabStyle = (active) => [
    "px-5 py-2 rounded-lg text-sm font-medium transition-all border-0 cursor-pointer",
    active
      ? "bg-[#6366f1] text-white"
      : "bg-transparent text-[#5a5f78] hover:text-[#c4c0b8]",
  ].join(" ");

  return (
    <div>
      <Toast toast={toast} />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#1a1d2e] rounded-xl p-1 w-fit">
        <button className={tabStyle(activeTab === "categories")}    onClick={() => setActiveTab("categories")}>
          Categorias
        </button>
        <button className={tabStyle(activeTab === "subcategories")} onClick={() => setActiveTab("subcategories")}>
          Subcategorias
        </button>
      </div>

      {activeTab === "categories"    && <CategoriesTab    showToast={showToast} />}
      {activeTab === "subcategories" && <SubcategoriesTab showToast={showToast} />}
    </div>
  );
}

// ── CategoriesTab ─────────────────────────────────────────────

function CategoriesTab({ showToast }) {
  const { categories, subcategories, saveCategory, deleteCategory } = useCategoriesStore();

  const emptyForm = { name: "", type: "income" };
  const [form,       setForm]       = useState(emptyForm);
  const [editingId,  setEditingId]  = useState(null);
  const [errors,     setErrors]     = useState({});

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Nome obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      if (editingId !== null) {
        await saveCategory({ id: editingId, ...form });
        showToast("Categoria actualizada!");
      } else {
        await saveCategory(form);
        showToast("Categoria criada!");
      }
      handleCancel();
    } catch {
      showToast("Erro ao guardar — verifica a ligação", "error");
    }
  }

  async function handleDelete(id) {
    const subCount = subcategories.filter(s => s.categoryId === id).length;
    try {
      await deleteCategory(id);
      showToast(
        subCount > 0
          ? `Categoria e ${subCount} subcategoria(s) removidas`
          : "Categoria removida"
      );
    } catch {
      showToast("Erro ao remover — verifica a ligação", "error");
    }
  }

  function handleEdit(cat) {
    setForm({ name: cat.name, type: cat.type });
    setEditingId(cat.id);
    setErrors({});
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
  }

  const isEditing = editingId !== null;

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
      {/* Lista */}
      <div>
        <h2 className="text-base font-semibold text-[#f0ede8] mb-4">Categorias</h2>
        <div className="flex flex-col gap-2">
          {categories.map(cat => (
            <CategoryCard
              key={cat.id}
              category={cat}
              subCount={subcategories.filter(s => s.categoryId === cat.id).length}
              isEditing={editingId === cat.id}
              onEdit={() => editingId === cat.id ? handleCancel() : handleEdit(cat)}
              onDelete={() => handleDelete(cat.id)}
            />
          ))}
          {categories.length === 0 && (
            <Card className="text-center text-[#5a5f78] py-10">
              Sem categorias. Cria a primeira!
            </Card>
          )}
        </div>
      </div>

      {/* Formulário */}
      <CategoryForm
        form={form}
        setForm={setForm}
        errors={errors}
        isEditing={isEditing}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}

// ── SubcategoriesTab ──────────────────────────────────────────

function SubcategoriesTab({ showToast }) {
  const { categories, subcategories, saveSubcategory, deleteSubcategory } = useCategoriesStore();

  const emptyForm = { name: "", type: "income", categoryId: "" };
  const [form,      setForm]      = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [errors,    setErrors]    = useState({});

  function validate() {
    const e = {};
    if (!form.name.trim())    e.name       = "Nome obrigatório";
    if (!form.categoryId)     e.categoryId = "Selecciona uma categoria";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      if (editingId !== null) {
        await saveSubcategory({ id: editingId, ...form, categoryId: parseInt(form.categoryId) });
        showToast("Subcategoria actualizada!");
      } else {
        await saveSubcategory({ ...form, categoryId: parseInt(form.categoryId) });
        showToast("Subcategoria criada!");
      }
      handleCancel();
    } catch {
      showToast("Erro ao guardar — verifica a ligação", "error");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteSubcategory(id);
      showToast("Subcategoria removida");
    } catch {
      showToast("Erro ao remover — verifica a ligação", "error");
    }
  }

  function handleEdit(sub) {
    setForm({ name: sub.name, type: sub.type, categoryId: String(sub.categoryId) });
    setEditingId(sub.id);
    setErrors({});
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
  }

  const isEditing = editingId !== null;

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
      {/* Lista */}
      <div>
        <h2 className="text-base font-semibold text-[#f0ede8] mb-4">Subcategorias</h2>
        <div className="flex flex-col gap-2">
          {subcategories.map(sub => {
            const cat = categories.find(c => c.id === sub.categoryId);
            return (
              <SubcategoryCard
                key={sub.id}
                subcategory={sub}
                categoryName={cat?.name}
                isEditing={editingId === sub.id}
                onEdit={() => editingId === sub.id ? handleCancel() : handleEdit(sub)}
                onDelete={() => handleDelete(sub.id)}
              />
            );
          })}
          {subcategories.length === 0 && (
            <Card className="text-center text-[#5a5f78] py-10">
              Sem subcategorias. Cria a primeira!
            </Card>
          )}
        </div>
      </div>

      {/* Formulário */}
      <SubcategoryForm
        form={form}
        setForm={setForm}
        errors={errors}
        isEditing={isEditing}
        categories={categories}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}

// ── CategoryCard ──────────────────────────────────────────────

function CategoryCard({ category, subCount, isEditing, onEdit, onDelete }) {
  const color   = TYPE_COLOR[category.type]    || "#8a8fa8";
  const colorBg = TYPE_COLOR_BG[category.type] || "#2a2d3a";
  const label   = TYPE_LABEL[category.type]    || category.type;

  return (
    <div
      className="flex justify-between items-center px-4 py-3 rounded-xl transition-all"
      style={{
        background:  isEditing ? "#1e2235" : "#1a1d2e",
        border:      `1px solid ${isEditing ? "#6366f1" : colorBg}`,
        borderLeft:  `3px solid ${isEditing ? "#6366f1" : color}`,
      }}
    >
      <div>
        <div className="text-[15px] font-medium text-[#e8e6e0]">{category.name}</div>
        <div className="text-xs mt-0.5" style={{ color }}>{label}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#5a5f78]">{subCount} sub.</span>
        <Button
          variant="secondary" size="sm"
          onClick={onEdit}
          className={isEditing ? "text-[#a5b4fc] border-[#6366f1]" : ""}
        >
          {isEditing ? "Cancelar" : "Editar"}
        </Button>
        <Button variant="danger" size="sm" onClick={onDelete}>×</Button>
      </div>
    </div>
  );
}

// ── SubcategoryCard ───────────────────────────────────────────

function SubcategoryCard({ subcategory, categoryName, isEditing, onEdit, onDelete }) {
  const color   = TYPE_COLOR[subcategory.type]    || "#8a8fa8";
  const colorBg = TYPE_COLOR_BG[subcategory.type] || "#2a2d3a";
  const label   = TYPE_LABEL[subcategory.type]    || subcategory.type;

  return (
    <div
      className="flex justify-between items-center px-4 py-3 rounded-xl transition-all"
      style={{
        background: isEditing ? "#1e2235" : "#1a1d2e",
        border:     `1px solid ${isEditing ? "#6366f1" : colorBg}`,
        borderLeft: `3px solid ${isEditing ? "#6366f1" : color}`,
      }}
    >
      <div>
        <div className="text-[15px] font-medium text-[#e8e6e0]">{subcategory.name}</div>
        <div className="text-xs mt-0.5 text-[#5a5f78]">
          {categoryName || "—"} · <span style={{ color }}>{label}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary" size="sm"
          onClick={onEdit}
          className={isEditing ? "text-[#a5b4fc] border-[#6366f1]" : ""}
        >
          {isEditing ? "Cancelar" : "Editar"}
        </Button>
        <Button variant="danger" size="sm" onClick={onDelete}>×</Button>
      </div>
    </div>
  );
}

// ── CategoryForm ──────────────────────────────────────────────

function CategoryForm({ form, setForm, errors, isEditing, onSave, onCancel }) {
  return (
    <Card className={isEditing ? "border-[#6366f1]" : ""}>
      <div className="text-sm font-semibold text-[#a5b4fc] mb-5">
        {isEditing ? "✏ Editar Categoria" : "+ Nova Categoria"}
      </div>
      <div className="flex flex-col gap-4">
        <Input
          label="Nome"
          placeholder="Ex: Alimentação"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          error={errors.name}
        />
        <Select
          label="Tipo"
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
        >
          {TRANSACTION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>
        <div className="flex gap-2 mt-1">
          <Button onClick={onSave}>
            {isEditing ? "Guardar" : "Criar Categoria"}
          </Button>
          {isEditing && (
            <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── SubcategoryForm ───────────────────────────────────────────

function SubcategoryForm({ form, setForm, errors, isEditing, categories, onSave, onCancel }) {
  function handleCategoryChange(e) {
    const cat = categories.find(c => c.id === parseInt(e.target.value));
    setForm(f => ({
      ...f,
      categoryId: e.target.value,
      type: cat?.type || "income",  // herda o tipo da categoria pai
    }));
  }

  return (
    <Card className={isEditing ? "border-[#6366f1]" : ""}>
      <div className="text-sm font-semibold text-[#a5b4fc] mb-5">
        {isEditing ? "✏ Editar Subcategoria" : "+ Nova Subcategoria"}
      </div>
      <div className="flex flex-col gap-4">
        <Input
          label="Nome"
          placeholder="Ex: Supermercado"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          error={errors.name}
        />
        <Select
          label="Categoria Pai"
          value={form.categoryId}
          onChange={handleCategoryChange}
          error={errors.categoryId}
        >
          <option value="">Seleccionar categoria...</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select
          label="Tipo"
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
        >
          {TRANSACTION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>
        <div className="flex gap-2 mt-1">
          <Button onClick={onSave}>
            {isEditing ? "Guardar" : "Criar Subcategoria"}
          </Button>
          {isEditing && (
            <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          )}
        </div>
      </div>
    </Card>
  );
}
