// src/features/categories/CategoriesPage.jsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCategoriesStore } from "../../store/categoriesStore";
import { useToast } from "../../hooks/useToast";
import { TRANSACTION_TYPES } from "../../data/constants";
import { Button, Input, Select, Card } from "../../components/ui";
import { Toast } from "../../components/ui/Toast";
import { IS_CONFIGURED } from "../../services/sheetsApi";

const TYPE_COLOR = {
  income: "var(--success)", investment: "var(--info)",
  fixed_expense: "var(--danger)", variable_expense: "var(--warning)",
};
const TYPE_COLOR_BG = {
  income: "var(--success-bg)", investment: "var(--surface-raised)",
  fixed_expense: "var(--danger-bg)", variable_expense: "var(--warning-bg)",
};

// ── Pagination component ──────────────────────────────────────

function Pagination({ page, pages, total, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-default">
      <span className="text-xs text-faint">{total} itens · página {page} de {pages}</span>
      <div className="flex gap-1">
        <button
          onClick={() => onPage(page - 1)} disabled={page <= 1}
          className="px-3 py-1 rounded-lg text-xs border border-default bg-raised text-muted
            disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >‹</button>
        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 1)
          .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i-1] > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) => p === "..." ? (
            <span key={`dots-${i}`} className="px-2 py-1 text-xs text-faint">…</span>
          ) : (
            <button key={p} onClick={() => onPage(p)}
              className="px-3 py-1 rounded-lg text-xs border cursor-pointer"
              style={{
                background:   p === page ? "var(--brand)" : "var(--surface-raised)",
                borderColor:  p === page ? "var(--brand)" : "var(--border)",
                color:        p === page ? "#fff" : "var(--text-muted)",
              }}
            >{p}</button>
          ))
        }
        <button
          onClick={() => onPage(page + 1)} disabled={page >= pages}
          className="px-3 py-1 rounded-lg text-xs border border-default bg-raised text-muted
            disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >›</button>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("categories");
  const { toast, showToast } = useToast();

  const tabStyle = (active) => [
    "px-5 py-2 rounded-lg text-sm font-medium transition-all border-0 cursor-pointer",
    active ? "bg-[var(--brand)] text-white" : "bg-transparent text-faint hover:text-secondary",
  ].join(" ");

  return (
    <div data-testid="categories-page">
      <Toast toast={toast} />
      <div className="flex gap-1 mb-6 bg-raised rounded-xl p-1 w-fit">
        <button className={tabStyle(activeTab === "categories")}    onClick={() => setActiveTab("categories")}>
          {t("categories.title")}
        </button>
        <button className={tabStyle(activeTab === "subcategories")} onClick={() => setActiveTab("subcategories")}>
          {t("categories.titleSub")}
        </button>
      </div>
      {activeTab === "categories"    && <CategoriesTab    showToast={showToast} />}
      {activeTab === "subcategories" && <SubcategoriesTab showToast={showToast} />}
    </div>
  );
}

function CategoriesTab({ showToast }) {
  const { t } = useTranslation();
  const {
    categories, subcategories, saveCategory, deleteCategory,
    catPage, catPages, catTotal, loadCatPage, loading,
  } = useCategoriesStore();
  const emptyForm = { name: "", type: "income" };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors]     = useState({});

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = t("common.required");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      if (editingId !== null) {
        await saveCategory({ id: editingId, ...form });
        showToast(t("categories.toast.updated"));
      } else {
        await saveCategory(form);
        showToast(t("categories.toast.created"));
      }
      handleCancel();
    } catch {
      showToast(t("common.connectionError"), "error");
    }
  }

  async function handleDelete(id) {
    const subCount = subcategories.filter(s => s.categoryId === id).length;
    try {
      await deleteCategory(id);
      showToast(subCount > 0
        ? t("categories.toast.deletedWithSubs", { count: subCount })
        : t("categories.toast.deleted")
      );
    } catch {
      showToast(t("common.connectionError"), "error");
    }
  }

  function handleEdit(cat) { setForm({ name: cat.name, type: cat.type }); setEditingId(cat.id); setErrors({}); }
  function handleCancel()   { setForm(emptyForm); setEditingId(null); setErrors({}); }

  // Carrega primeira página ao montar (só com engine configurado)
  useEffect(() => {
    if (IS_CONFIGURED) loadCatPage(1);
  }, []);

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
      <div>
        <h2 className="text-base font-semibold text-primary mb-4">{t("categories.title")}</h2>
        <div className="flex flex-col gap-2">
          {categories.map(cat => (
            <CategoryCard key={cat.id} category={cat}
              subCount={subcategories.filter(s => s.categoryId === cat.id).length}
              isEditing={editingId === cat.id}
              onEdit={() => editingId === cat.id ? handleCancel() : handleEdit(cat)}
              onDelete={() => handleDelete(cat.id)}
            />
          ))}
          {categories.length === 0 && !loading && (
            <Card className="text-center text-faint py-10">{t("categories.empty")}</Card>
          )}
          {loading && (
            <Card className="text-center text-faint py-6">
              <div className="w-5 h-5 border-2 border-[var(--brand-dim)] border-t-[var(--brand)] rounded-full animate-spin mx-auto" />
            </Card>
          )}
        </div>
        <Pagination page={catPage} pages={catPages} total={catTotal}
          onPage={p => loadCatPage(p)} />
      </div>
      <CategoryForm form={form} setForm={setForm} errors={errors} isEditing={editingId !== null} onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}

function SubcategoriesTab({ showToast }) {
  const { t } = useTranslation();
  const {
    categories, subcategories, saveSubcategory, deleteSubcategory,
    subPage, subPages, subTotal, loadSubPage, loading,
  } = useCategoriesStore();
  const emptyForm = { name: "", type: "income", categoryId: "" };
  const [form, setForm]           = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors]       = useState({});

  useEffect(() => {
    if (IS_CONFIGURED) loadSubPage(1);
  }, []);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name       = t("common.required");
    if (!form.categoryId)  e.categoryId = t("common.required");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      if (editingId !== null) {
        await saveSubcategory({ id: editingId, ...form, categoryId: parseInt(form.categoryId) });
        showToast(t("categories.toast.updatedSub"));
      } else {
        await saveSubcategory({ ...form, categoryId: parseInt(form.categoryId) });
        showToast(t("categories.toast.createdSub"));
      }
      handleCancel();
    } catch {
      showToast(t("common.connectionError"), "error");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteSubcategory(id);
      showToast(t("categories.toast.deletedSub"));
    } catch {
      showToast(t("common.connectionError"), "error");
    }
  }

  function handleEdit(sub) { setForm({ name: sub.name, type: sub.type, categoryId: String(sub.categoryId) }); setEditingId(sub.id); setErrors({}); }
  function handleCancel()   { setForm(emptyForm); setEditingId(null); setErrors({}); }

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
      <div>
        <h2 className="text-base font-semibold text-primary mb-4">{t("categories.titleSub")}</h2>
        <div className="flex flex-col gap-2">
          {subcategories.map(sub => {
            const cat = categories.find(c => c.id === sub.categoryId);
            return (
              <SubcategoryCard key={sub.id} subcategory={sub} categoryName={cat?.name}
                isEditing={editingId === sub.id}
                onEdit={() => editingId === sub.id ? handleCancel() : handleEdit(sub)}
                onDelete={() => handleDelete(sub.id)}
              />
            );
          })}
          {subcategories.length === 0 && !loading && (
            <Card className="text-center text-faint py-10">{t("categories.emptySub")}</Card>
          )}
          {loading && (
            <Card className="text-center text-faint py-6">
              <div className="w-5 h-5 border-2 border-[var(--brand-dim)] border-t-[var(--brand)] rounded-full animate-spin mx-auto" />
            </Card>
          )}
        </div>
        <Pagination page={subPage} pages={subPages} total={subTotal}
          onPage={p => loadSubPage(p)} />
      </div>
      <SubcategoryForm form={form} setForm={setForm} errors={errors} isEditing={editingId !== null} categories={categories} onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}

function CategoryCard({ category, subCount, isEditing, onEdit, onDelete }) {
  const { t } = useTranslation();
  const color   = TYPE_COLOR[category.type]    || "var(--text-muted)";
  const colorBg = TYPE_COLOR_BG[category.type] || "var(--border)";

  return (
    <div className="flex justify-between items-center px-4 py-3 rounded-xl transition-all"
      style={{ background: isEditing ? "var(--surface-overlay)" : "var(--surface-raised)", border: `1px solid ${isEditing ? "var(--brand)" : colorBg}`, borderLeft: `3px solid ${isEditing ? "var(--brand)" : color}` }}>
      <div>
        <div className="text-[15px] font-medium text-primary">{category.name}</div>
        <div className="text-xs mt-0.5" style={{ color }}>{t("categories.types." + category.type)}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-faint">{t("categories.subcountLabel", { count: subCount })}</span>
        <Button variant="secondary" size="sm" onClick={onEdit} className={isEditing ? "text-brand-light border-[var(--border-focus)]" : ""}>
          {isEditing ? t("common.cancel") : t("common.edit")}
        </Button>
        <Button variant="danger" size="sm" onClick={onDelete}>×</Button>
      </div>
    </div>
  );
}

function SubcategoryCard({ subcategory, categoryName, isEditing, onEdit, onDelete }) {
  const { t } = useTranslation();
  const color   = TYPE_COLOR[subcategory.type]    || "var(--text-muted)";
  const colorBg = TYPE_COLOR_BG[subcategory.type] || "var(--border)";

  return (
    <div className="flex justify-between items-center px-4 py-3 rounded-xl transition-all"
      style={{ background: isEditing ? "var(--surface-overlay)" : "var(--surface-raised)", border: `1px solid ${isEditing ? "var(--brand)" : colorBg}`, borderLeft: `3px solid ${isEditing ? "var(--brand)" : color}` }}>
      <div>
        <div className="text-[15px] font-medium text-primary">{subcategory.name}</div>
        <div className="text-xs mt-0.5 text-faint">
          {categoryName || "—"} · <span style={{ color }}>{t("categories.types." + subcategory.type)}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onEdit} className={isEditing ? "text-brand-light border-[var(--border-focus)]" : ""}>
          {isEditing ? t("common.cancel") : t("common.edit")}
        </Button>
        <Button variant="danger" size="sm" onClick={onDelete}>×</Button>
      </div>
    </div>
  );
}

function CategoryForm({ form, setForm, errors, isEditing, onSave, onCancel }) {
  const { t } = useTranslation();
  return (
    <Card className={isEditing ? "border-[var(--border-focus)]" : ""}>
      <div className="text-sm font-semibold text-brand-light mb-5">
        {isEditing ? "✏ " + t("categories.edit") : "+ " + t("categories.add")}
      </div>
      <div className="flex flex-col gap-4">
        <Input label={t("categories.form.name")} placeholder={t("categories.form.namePlaceholder")}
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
        <Select label={t("categories.form.type")} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          {TRANSACTION_TYPES.map(type => (
            <option key={type.value} value={type.value}>{t("categories.types." + type.value)}</option>
          ))}
        </Select>
        <div className="flex gap-2 mt-1">
          <Button onClick={onSave}>{isEditing ? t("common.save") : t("categories.add")}</Button>
          {isEditing && <Button variant="secondary" onClick={onCancel}>{t("common.cancel")}</Button>}
        </div>
      </div>
    </Card>
  );
}

function SubcategoryForm({ form, setForm, errors, isEditing, categories, onSave, onCancel }) {
  const { t } = useTranslation();

  function handleCategoryChange(e) {
    const cat = categories.find(c => c.id === parseInt(e.target.value));
    setForm(f => ({ ...f, categoryId: e.target.value, type: cat?.type || "income" }));
  }

  return (
    <Card className={isEditing ? "border-[var(--border-focus)]" : ""}>
      <div className="text-sm font-semibold text-brand-light mb-5">
        {isEditing ? "✏ " + t("categories.editSub") : "+ " + t("categories.addSub")}
      </div>
      <div className="flex flex-col gap-4">
        <Input label={t("categories.form.name")} placeholder={t("categories.form.namePlaceholderSub")}
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
        <Select label={t("categories.form.parentCategory")} value={form.categoryId} onChange={handleCategoryChange} error={errors.categoryId}>
          <option value="">{t("categories.form.selectCategory")}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select label={t("categories.form.type")} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          {TRANSACTION_TYPES.map(type => (
            <option key={type.value} value={type.value}>{t("categories.types." + type.value)}</option>
          ))}
        </Select>
        <div className="flex gap-2 mt-1">
          <Button onClick={onSave}>{isEditing ? t("common.save") : t("categories.addSub")}</Button>
          {isEditing && <Button variant="secondary" onClick={onCancel}>{t("common.cancel")}</Button>}
        </div>
      </div>
    </Card>
  );
}