"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { useParams } from "next/navigation";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";

import { calculateForecast } from "@/lib/forecast/budgetForecast";
import BudgetForecastCard from "@/components/BudgetForecastCard";

interface BudgetItem {
  id?: number;
  category: string;
  budget: number;
  spent: number;
  plannedReservations?: number;
  reservationList?: any[];
  type: "fixed" | "variable" | "mixed";
}

export default function BudgetPage() {
  const params = useParams();
  const tripIdParam = params?.tripId;
  const tripId = Array.isArray(tripIdParam) ? tripIdParam[0] : tripIdParam;
  const tripIdNum = Number(tripId);

  const [budget, setBudget] = useState<BudgetItem[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryType, setNewCategoryType] =
  useState<"fixed" | "variable" | "mixed">("mixed");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("All");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const locale = params?.locale || "en";
const t = locale === "es" ? es : en;

  // 🟢 Cargar budgets + gastos desde API
  useEffect(() => {
    async function loadBudgets() {
      try {
        const res = await fetch(`/api/budget?tripId=${tripIdNum}`);
        const data = await res.json();
        if (Array.isArray(data)) setBudget(data);
      } catch (err) {
        console.error("Error loading budgets:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBudgets();
  }, [tripIdNum]);

  const totalBudget = budget.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
  const totalSpent = budget.reduce((sum, c) => sum + (Number(c.spent) || 0), 0);
  const totalOverbudget = budget.reduce(
    (sum, c) => sum + Math.max(0, (c.spent || 0) - (c.budget || 0)),
    0
  );


  const saveBudgetAuto = async (updatedBudget: BudgetItem[]) => {
  try {
    await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: tripIdNum, budgets: updatedBudget }),
    });
  } catch (err) {
    console.error("Error auto-saving budget:", err);
  }
};

  const CATEGORY_TYPE_MAP: Record<string, "fixed" | "mixed" | "variable"> = {
  Flights: "fixed",
  Documentation: "fixed",
  Health: "fixed",

  Accommodation: "mixed",
  "Internal Transport": "mixed",
  Activities: "mixed",
  "Technology/SIM": "mixed",
  Others: "mixed",

  Meals: "variable",
};


const forecast = calculateForecast({
  totalDays: 10,
  daysElapsed: 2,
  budgets: budget.map((b) => ({
    category: b.category,
    budget: b.budget,
    spent: b.spent,
    planned: b.plannedReservations ?? 0,
    reservations: b.reservationList ?? [], 
    type: b.type,
  })),
});





const addCategory = () => {
  if (!newCategory.trim()) return;
  const updated = [
    ...budget,
    {
      category: newCategory.trim(),
      budget: 0,
      spent: 0,
      type: newCategoryType as "fixed" | "variable" | "mixed", // ✅ aquí forzamos TS
    },
  ];
  setBudget(updated);
  saveBudgetAuto(updated);
  setNewCategory("");
};


  const filteredBudget =
  filter === "All"
    ? budget
    : budget.filter((b) => b.category === filter);

    const categories = Array.from(new Set(budget.map((b) => b.category)));


const deleteCategory = (index: number) => {
  const updated = budget.filter((_, i) => i !== index);
  setBudget(updated);
  saveBudgetAuto(updated); // 🟢 guardar inmediatamente
};



const handleDeleteCategory = (index: number, spent: number, category: string) => {
  if (spent > 0) {
    alert("⚠️ This category cannot be deleted because it already has expenses.");
    return;
  }
  const confirmDelete = window.confirm(`Delete category "${category}"?`);
  if (!confirmDelete) return;

  const updated = budget.filter((_, i) => i !== index);
  setBudget(updated);
  saveBudgetAuto(updated);
};

  async function saveBudget() {
    setSaving(true);
    const prepared = budget.map((b) => ({
      ...b,
      overbudget: Math.max(0, (b.spent || 0) - (b.budget || 0)),
      percentage: b.budget ? ((b.spent || 0) / b.budget) * 100 : 0,
    }));

    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: tripIdNum, budgets: prepared }),
      });
      if (res.ok) alert(t.budgetpage.savedOk);
      else alert(t.budgetpage.savedError);
    } catch (err) {
      console.error(err);
      alert(t.budgetpage.serverError);
    } finally {
      setSaving(false);
    }
  }

  const handleAddCategory = () => {
  if (!newCategory.trim()) return;

  const updated = [
    ...budget,
    {
      category: newCategory.trim(),
      budget: 0,
      spent: 0,
      type: newCategoryType,
    },
  ];

  setBudget(updated);
  saveBudgetAuto(updated);

  setNewCategory("");
  setNewCategoryType("mixed");
  setCategoryModalOpen(false);
};


  if (loading)
    return (
      <>
      <SessionProvider>
        <NavBar tripId={tripId} />
        <main className="p-8 text-center bg-gray-50 pt-20">
          <p className="text-lg text-gray-600">{t.budgetpage.loading}</p>
        </main>
        </SessionProvider>
      </>
    );

  return (
    <>
    <SessionProvider>
      <NavBar tripId={tripId} />
      <main className="p-8 space-y-10 bg-gray-50 pt-20">
        <h1 className="text-3xl font-bold mb-4 text-center">{t.budgetpage.title}</h1>
        <p className="text-center text-gray-700 text-lg max-w-2xl mx-auto mt-4 mb-8 leading-relaxed">
          {t.budgetpage.intro}
        </p>

        {/* Totales arriba */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <h3 className="text-sm ">{t.budgetpage.totalBudget}</h3>
            <p className="text-2xl font-semibold text-[#001e42]">{totalBudget.toFixed(2)} €</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <h3 className="text-sm ">{t.budgetpage.totalSpent}</h3>
            <p className="text-2xl font-semibold text-[#001e42]">{totalSpent.toFixed(2)} €</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <h3 className="text-sm ">{t.budgetpage.overbudget}</h3>
            <p className="text-2xl font-semibold text-red-600">{totalOverbudget.toFixed(2)} €</p>
          </div>
        </section>

<BudgetForecastCard
  forecast={forecast}
  totalBudget={totalBudget}
  tripId={tripIdNum}
/>


{/* Category Filter */}
<div className="flex flex-wrap justify-center gap-3 mb-6">
  {["All", ...categories].map((cat) => (
    <button
      key={cat}
      onClick={() => setFilter(cat)}
      className={`px-4 py-2 rounded-full border text-sm transition ${
        filter === cat
          ? "bg-[#001e42] text-white border-[#001e42]"
          : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
      }`}
    >
      {cat}
    </button>
  ))}
</div>
<div className="flex justify-center">
<button
  onClick={() => setCategoryModalOpen(true)}
  className="
    bg-[#001e42] 
    text-white 
    px-10 py-4 
    rounded-xl 
    leading-none 
    inline-flex items-center justify-center
    hover:bg-[#DCC9A3] 
    transition 
    shadow-lg 
    hover:scale-105 
    hover:bg-[#e6d6b3]
  "
>
  <Plus className="mr-2 h-4 w-4" /> Add Category
</button>
</div>

        {/* Lista de presupuestos */}
        <section className="space-y-4">
          {filteredBudget.map((item, i) => {
            const over = Math.max(0, (item.spent || 0) - (item.budget || 0));
            const pct = item.budget ? ((item.spent / item.budget) * 100).toFixed(1) : "0";

            return (
              <div
                key={i}
                className="bg-white p-5 rounded-xl shadow-md transition hover:shadow-lg"
              >
                <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                  <h2 className="font-semibold text-lg">{item.category}</h2> 
                 
                  <button
                    onClick={() => handleDeleteCategory(i, item.spent, item.category)}

                    disabled={item.spent > 0}
                    className={` ${
                      item.spent > 0
                        ? "text-gray-400 opacity-80 group-hover:opacity-100 cursor-not-allowed"
                        : "text-red-500 hover:text-red-600 opacity-80 group-hover:opacity-100"
                    }`}
                  >
                    ✕
                  </button>

                  
                </div>
 <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
<p className="text-xs text-gray-500">
  {item.type === "fixed" && "Fixed cost"}
  {item.type === "variable" && "Variable cost"}
  {item.type === "mixed" && "Mixed cost"}
</p>
</div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-3">
                  <div>
                    <label>{t.budgetpage.budgetLabel}</label>
                    <input
  type="number"
  min="0"
  step="0.01"
  className="w-full border border-gray-200 rounded-lg p-2 mt-1"
  value={item.budget || ""}
  onChange={(e) => {
  const val = e.target.value;
  if (/^\d*\.?\d*$/.test(val)) {
    setBudget((prev) =>
      prev.map((b, j) =>
        j === i ? { ...b, budget: Number(val) || 0 } : b
      )
    );
  }
}}


  onBlur={(e) => {
  if (e.target.value === "") {
    const updated = budget.map((b, j) => (j === i ? { ...b, budget: 0 } : b));
    setBudget(updated);
    
  }
}}

/>

                  </div>
                  <div>
                    <label >{t.budgetpage.spentLabel}</label>
                    <input
                      type="number"
                      readOnly
                      className="w-full border border-gray-200 rounded-lg p-2 mt-1 bg-gray-100 cursor-not-allowed"
                      value={item.spent?.toFixed(2) || "0.00"}
                    />
                  </div>
                  <div>
                    <label >{t.budgetpage.overbudgetLabel}</label>
                    <input
                      type="number"
                      readOnly
                  
                      className={`w-full border border-gray-200 rounded-lg p-2 mt-1 bg-gray-100 cursor-not-allowed ${
                        over > 0 ? "text-red-600" : "text-gray-700"
                      }`}
                      value={over.toFixed(2) || "0.00"}
                    />

                    
      
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="mt-2">
                  <div className="flex justify-between text-sm  mb-1">
                    <span>{pct}% {t.budgetpage.used}</span>
                    <span>{item.budget ? ((item.budget - item.spent).toFixed(2)) : "0"} € {t.budgetpage.left}</span>
                  </div>
                  <div className="w-full border border-gray-200 bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        Number(pct) > 100 ? "bg-red-500" : "bg-[#001e42]"
                      }`}
                      style={{ width: `${Math.min(Number(pct), 100)}%` }}
                    ></div>
                  </div>
                </div>

                {forecast.categories.find(c => c.category === item.category)?.dailyAllowance && (
  <p className="text-xs text-blue-600 mt-2">
    You can spend up to{" "}
    {forecast.categories.find(c => c.category === item.category)?.dailyAllowance?.toFixed(2)} €
    per day
  </p>
)}

              </div>
            );
          })}
        </section>

        {/* Añadir nueva categoría */}
        
  {/*
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          
          <input
            type="text"
            placeholder={t.budgetpage.newCategoryPlaceholder}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="border p-2 rounded-lg flex-1"
          />
          <button
            onClick={addCategory}
            className="bg-[#001e42] text-white px-6 py-2 rounded-lg hover:bg-[#DCC9A3] transition"
          >
            {t.budgetpage.addCategory}
          </button>
        </div>
 */}
        {/* Botón guardar */}
        <div className="mt-6">
          <button
            onClick={saveBudget}
            disabled={saving}
            className="w-full bg-[#001e42] text-white py-2 rounded-lg hover:bg-[#DCC9A3] transition"
          >
            {saving ? t.budgetpage.saving : t.budgetpage.save}
          </button>
        </div>

        <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
  <DialogContent className="sm:max-w-md rounded-2xl bg-white">
    <DialogHeader className="text-center">
      <DialogTitle className="text-lg font-semibold text-[#001e42]">
        Add Category
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4 mt-3">
      {/* Category name */}
      <div>
        <label className="text-sm">Category name</label>
        <Input
          placeholder="e.g. Flights"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="rounded-xl"
        />
      </div>

      {/* Category type */}
      <div>
        <label className="text-sm mb-1 block">Category type</label>
        <select
          value={newCategoryType}
          onChange={(e) =>
            setNewCategoryType(e.target.value as any)
          }
          className="w-full border rounded-xl p-2 bg-gray-50"
        >
          <option value="fixed">
            Fixed — known cost, won’t change
          </option>
          <option value="variable">
            Variable — depends on daily spending
          </option>
          <option value="mixed">
            Mixed — fixed + variable
          </option>
        </select>
      </div>
    </div>

    <DialogFooter className="mt-6 flex justify-center">
      <Button
        onClick={handleAddCategory}
        className="
    w-full
    bg-[#001e42]
    text-white
    py-2.5
    rounded-lg
    font-medium
    hover:bg-[#DCC9A3]
    hover:text-[#001e42]
    transition
  "
      >
        Add Category
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


      </main>
      </SessionProvider>
    </>
  );
}
