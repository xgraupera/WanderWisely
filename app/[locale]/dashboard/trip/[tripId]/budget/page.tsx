"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { useParams } from "next/navigation";

interface BudgetItem {
  id?: number;
  category: string;
  budget: number;
  spent: number;
  overbudget?: number;
  percentage?: number;
}

export default function BudgetPage() {
  const params = useParams();
  const tripIdParam = params?.tripId;
  const tripId = Array.isArray(tripIdParam) ? tripIdParam[0] : tripIdParam;
  const tripIdNum = Number(tripId);

  const [budget, setBudget] = useState<BudgetItem[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("All");

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

  const addCategory = () => {
    if (!newCategory.trim()) return;
    setBudget((prev) => [
      ...prev,
      { category: newCategory.trim(), budget: 0, spent: 0 },
    ]);
    setNewCategory("");
  };

  const filteredBudget =
  filter === "All"
    ? budget
    : budget.filter((b) => b.category === filter);

    const categories = Array.from(new Set(budget.map((b) => b.category)));


  const deleteCategory = (index: number) => {
    setBudget((prev) => prev.filter((_, i) => i !== index));
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
      if (res.ok) alert("✅ Budget saved!");
      else alert("❌ Error saving budget");
    } catch (err) {
      console.error(err);
      alert("❌ Server error");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <>
      <SessionProvider>
        <NavBar tripId={tripId} />
        <main className="p-8 text-center pt-20">
          <p className="text-lg text-gray-600">Loading trip information...</p>
        </main>
        </SessionProvider>
      </>
    );

  return (
    <>
    <SessionProvider>
      <NavBar tripId={tripId} />
      <main className="p-8 space-y-10 bg-gray-50 pt-20">
        <h1 className="text-3xl font-bold mb-4 text-center">💰 Budget Planning</h1>
        <p className="text-center text-gray-700 text-lg max-w-2xl mx-auto mt-4 mb-8 leading-relaxed">
          Travel freely by planning wisely.  
  Set your budget for each category and let Tripilot help you stay on track every step of the journey.
        </p>

        {/* Totales arriba */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <h3 className="text-sm ">Total Budget</h3>
            <p className="text-2xl font-semibold text-[#001e42]">{totalBudget.toFixed(2)} €</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <h3 className="text-sm ">Total Spent</h3>
            <p className="text-2xl font-semibold text-[#001e42]">{totalSpent.toFixed(2)} €</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow text-center">
            <h3 className="text-sm ">Overbudget</h3>
            <p className="text-2xl font-semibold text-red-600">{totalOverbudget.toFixed(2)} €</p>
          </div>
        </section>


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
                    onClick={() => {
  if (item.spent > 0) {
    alert("⚠️ This category cannot be deleted because it already has expenses.");
    return;
  }
  const confirmDelete = window.confirm(`Are you sure you want to delete "${item.category}"?`);
  if (confirmDelete) deleteCategory(i);
}}
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-3">
                  <div>
                    <label>Budget (€)</label>
                    <input
  type="number"
  min="0"
  step="0.01"
  className="w-full border border-gray-200 rounded-lg p-2 mt-1"
  value={item.budget || ""}
  onChange={(e) => {
    const val = e.target.value;
    if (/^\d*\.?\d*$/.test(val)) { // ✅ solo permite dígitos y punto decimal
      setBudget((prev) =>
        prev.map((b, j) =>
          j === i ? { ...b, budget: Number(val) || 0 } : b
        )
      );
    }
  }}
  onBlur={(e) => {
    if (e.target.value === "") {
      setBudget((prev) =>
        prev.map((b, j) => (j === i ? { ...b, budget: 0 } : b))
      );
    }
  }}
/>

                  </div>
                  <div>
                    <label >Spent (€)</label>
                    <input
                      type="number"
                      readOnly
                      className="w-full border border-gray-200 rounded-lg p-2 mt-1 bg-gray-100 cursor-not-allowed"
                      value={item.spent?.toFixed(2) || "0.00"}
                    />
                  </div>
                  <div>
                    <label >Overbudget (€)</label>
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
                    <span>{pct}% used</span>
                    <span>{item.budget ? ((item.budget - item.spent).toFixed(2)) : "0"} € left</span>
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
              </div>
            );
          })}
        </section>

        {/* Añadir nueva categoría */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          
          <input
            type="text"
            placeholder="New Category Name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="border p-2 rounded-lg flex-1"
          />
          <button
            onClick={addCategory}
            className="bg-[#001e42] text-white px-6 py-2 rounded-lg hover:bg-[#DCC9A3] transition"
          >
            + Add Category
          </button>
        </div>

        {/* Botón guardar */}
        <div className="mt-6">
          <button
            onClick={saveBudget}
            disabled={saving}
            className="w-full bg-[#001e42] text-white py-2 rounded-lg hover:bg-[#DCC9A3] transition"
          >
            {saving ? "Saving..." : "Save Budget"}
          </button>
        </div>
      </main>
      </SessionProvider>
    </>
  );
}
