"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SessionProvider } from "next-auth/react";


interface Expense {
   id?: string;
  date: string;
  place: string;
  category: string;
  description: string;
  amount: number;
  paidBy: string;
  doNotSplit: boolean;
  amountPerTraveler: number;
}

export default function ExpensesPage() {
  const params = useParams();
  const tripIdParam = params?.tripId;
  const tripId = Array.isArray(tripIdParam) ? tripIdParam[0] : tripIdParam;

  const [userId, setUserId] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [numTravelers, setNumTravelers] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [filter, setFilter] = useState<string>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [newExpense, setNewExpense] = useState<Expense>({
    date: new Date().toISOString().split("T")[0],
    place: "",
    category: "Others",
    description: "",
    amount: 0,
    paidBy: "",
    doNotSplit: false,
    amountPerTraveler: 0,
  });
  // ✏️ Estados para editar un gasto existente
const [editModalOpen, setEditModalOpen] = useState(false);
const [editingExpense, setEditingExpense] = useState<Expense | null>(null);


  // 🟢 Load user (NextAuth)
  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data?.user?.email) setUserId(data.user.email);
    };
    fetchUser();
  }, []);

  // 🟢 Load trip info + expenses + budget
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tripRes, expRes, budRes] = await Promise.all([
          fetch(`/api/trips/${tripId}`),
          fetch(`/api/expenses?tripId=${tripId}&userId=${userId || "demo"}`),
          fetch(`/api/budget?tripId=${tripId}`),
        ]);

        const tripData = await tripRes.json();
        const expData = await expRes.json();
        const budData = await budRes.json();

        if (tripData?.travelers) setNumTravelers(tripData.travelers);

        const defaultCats = [
          "Flights",
          "Accommodation",
          "Internal Transport",
          "Insurance",
          "Visa",
          "Activities",
          "Meals",
          "SIM",
          "Others",
        ];

        const budgetCats =
          Array.isArray(budData) && budData.length > 0
            ? budData.map((b) => b.category)
            : defaultCats;

        if (!budgetCats.includes("Others")) budgetCats.push("Others");
        setCategories(budgetCats);

        if (Array.isArray(expData) && expData.length > 0) {
          const formatted = expData.map((e: any) => ({
            ...e,
            id: String(e.id),
            doNotSplit: e.doNotSplit || false,
            date: e.date ? new Date(e.date).toISOString().split("T")[0] : "",
          }));
          setExpenses(formatted);
        } else {
          setExpenses([]);
        }
      } catch (err) {
        console.error("Error loading expenses:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [tripId, userId]);

  // 🧮 Recalculate per traveler
  useEffect(() => {
    setExpenses((prev) =>
      prev.map((e) => ({
        ...e,
        amountPerTraveler: e.doNotSplit
          ? e.amount
          : e.amount / (numTravelers || 1),
      }))
    );
  }, [numTravelers]);

  // 💾 Save
  const saveExpenses = async () => {
    const uniquePaidBy = new Set(
      expenses
        .map((e) => e.paidBy)
        .filter((p) => p && p.toLowerCase() !== "split")
    );
    if (uniquePaidBy.size > numTravelers) {
      alert(
        `❌ Error: More unique "Paid By" names (${uniquePaidBy.size}) than travelers (${numTravelers}).`
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: Number(tripId), userId, expenses }),
      });
      const result = await res.json();
      if (res.ok) alert("✅ Expenses saved successfully!");
      else alert("❌ Error: " + result.error);
    } catch (err) {
      console.error(err);
      alert("❌ Network error");
    } finally {
      setSaving(false);
    }
  };

  // ➕ Add expense (via modal)
const handleAddExpense = () => {
  const tempSet = new Set(
    expenses
      .map((e) => e.paidBy)
      .filter((p) => p && p.toLowerCase() !== "split")
  );

  if (newExpense.paidBy && !tempSet.has(newExpense.paidBy)) {
    tempSet.add(newExpense.paidBy);
  }

  if (tempSet.size > numTravelers) {
    alert(`❌ More unique "Paid By" than travelers (${numTravelers})`);
    return;
  }

  const expense = {
    ...newExpense,
    
    amountPerTraveler: newExpense.doNotSplit
      ? newExpense.amount
      : newExpense.amount / (numTravelers || 1),
  };

  setExpenses((prev) => [...prev, expense]);
  setModalOpen(false);
  setNewExpense({
    date: new Date().toISOString().split("T")[0],
    place: "",
    category: "Others",
    description: "",
    amount: 0,
    paidBy: "",
    doNotSplit: false,
    amountPerTraveler: 0,
  });
};



  const deleteExpense = (index: number) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      setExpenses((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // 🗓️ Group by date
  const grouped = expenses.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {} as Record<string, Expense[]>);

  const filteredExpenses =
    filter === "All"
      ? expenses
      : expenses.filter((e) => e.category === filter);

  const groupedFiltered = filteredExpenses.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {} as Record<string, Expense[]>);

  const colors = [
    "#001e42",
    "#DCC9A3",
    "#025fd1",
    "#EAEAEA",
    "#BF6B63",
    "#F6A89E",
    "#5d6063",
  ];

  const categorySummary = categories
    .map((cat) => {
      const sum = expenses
        .filter((e) => e.category === cat)
        .reduce((s, e) => s + (e.amountPerTraveler || 0), 0);
      return { category: cat, value: sum };
    })
    .filter((c) => c.value > 0);

  const totalByCategory = categorySummary.reduce((s, c) => s + c.value, 0);

  const paidBySummary = Array.from(new Set(expenses.map((e) => e.paidBy)))
    .filter((p) => p)
    .map((p) => ({
      paidBy: p,
      value: expenses
        .filter((e) => e.paidBy === p)
        .reduce((s, e) => s + (e.amountPerTraveler || 0), 0),
    }))
    .filter((p) => p.value > 0);

  const totalByPaid = paidBySummary.reduce((s, c) => s + c.value, 0);

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
        <h1 className="text-3xl font-bold mb-4 text-center">💳 Expenses Log</h1>
        <p className="text-center text-gray-700 text-lg max-w-2xl mx-auto mt-4 mb-8 leading-relaxed">
  Your journey, your numbers.  
  Log your daily expenses and see how they align with your planned budget — because enjoying the trip also means understanding it.
</p>

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

        {/* Add Expense Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-[#001e42] text-white hover:bg-[#DCC9A3] transition"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>

        {/* Expense Cards by Date */}
        <div className="space-y-8 mt-8">
          {Object.entries(groupedFiltered)
            .sort(([a], [b]) => (a < b ? 1 : -1))
            .map(([date, list]) => {
              const total = list.reduce((s, e) => s + e.amount, 0);
              return (
                <div key={date}>
                  <h3 className="text-xl font-semibold mb-3 text-[#001e42]">
                    {new Date(date).toDateString()} — {total.toFixed(2)}€
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map((e, i) => {
                      const index = expenses.indexOf(e);
                      const isExpanded = expanded === index;
                      return (
                        <div
                          key={index}
                          className="relative bg-white p-5 rounded-xl shadow-md transition hover:shadow-lg"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-lg">
                                
                                {e.description || "No description"}
                              </h4>
                              <p>
                                {e.amount}€ | {e.category}
                              </p>
                            </div>
                            <button
                    onClick={() => deleteExpense(index)}
                    className="absolute top-3 right-3.5 text-red-500 hover:text-red-700 transition opacity-80 group-hover:opacity-100"
                    title="Delete Expense"
                  >
                    ✕
                  </button>
                  
                            <div
  className={`absolute right-3 transition-all duration-300 ${
    isExpanded ? "bottom-20" : "bottom-3"
  }`}
>
  <button
    onClick={() => setExpanded(isExpanded ? null : index)}
    className="text-gray-400 hover:text-gray-700 transition"
  >
    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
  </button>
</div>
                          </div>

                          
                            {isExpanded && (
                              <div
                                
                                className="mt-3 text-sm space-y-1"
                              >
                                <p>
                                  <strong>City/Place:</strong> {e.place || "-"}
                                </p>
                                <p>
                                  <strong>Paid by:</strong> {e.paidBy || "-"}
                                </p>
                                <p>
                                  <strong>Split:</strong>{" "}
                                  {e.doNotSplit
                                    ? "No (individual)"
                                    : `Yes (${numTravelers} travelers)`}
                                </p>
                                <p>
                                  <strong>Per traveler:</strong>{" "}
                                  {e.amountPerTraveler.toFixed(2)}€
                                </p>
                                      <div className="pt-3">
        <Button
          onClick={() => {
            setEditingExpense(e);
            setEditModalOpen(true);
          }}
          className="w-full bg-[#001e42] text-white hover:bg-[#DCC9A3] transition"
        >
          Edit Expense
        </Button>
      </div>
                              </div>
                            )}
                          
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Save Button */}
        <div className="mt-6 flex flex-col gap-4">
          <Button
            onClick={saveExpenses}
            disabled={saving}
            className="w-full bg-[#001e42] text-white py-2 rounded-lg hover:bg-[#DCC9A3] transition"
          >
            {saving ? "Saving..." : "Save Expenses"}
          </Button>
        </div>

        {/* Modal for Adding Expense */}
<Dialog open={modalOpen} onOpenChange={setModalOpen}>
  <DialogContent className="sm:max-w-md rounded-2xl shadow-xl bg-white">
    <DialogHeader className="text-center space-y-2">
      <DialogTitle className="text-lg font-semibold text-[#001e42]">
        Add New Expense
      </DialogTitle>
      
    </DialogHeader>

    <div className="space-y-3 mt-2">
      <select
        className="w-full border rounded-xl p-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#DCC9A3]"
        value={newExpense.category}
        onChange={(e) =>
          setNewExpense({ ...newExpense, category: e.target.value })
        }
      >
        {categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <label className="text-sm">Expense Date</label>
      <Input
        type="date"
        value={newExpense.date}
        onChange={(e) =>
          setNewExpense({ ...newExpense, date: e.target.value })
        }
        className="rounded-xl"
      />
      <label className="text-sm">Description</label>
      <Input
        placeholder="Description"
        value={newExpense.description}
        onChange={(e) =>
          setNewExpense({ ...newExpense, description: e.target.value })
        }
        className="rounded-xl"
      />
      <label className="text-sm">Amount (€)</label>
      <Input
        type="number"
        placeholder="Amount (€)"
        value={newExpense.amount || ""}
        onChange={(e) =>
          setNewExpense({
            ...newExpense,
            amount: Number(e.target.value) || 0,
          })
        }
        className="rounded-xl"
      />
      <label className="text-sm">City/Place</label>
      <Input
        placeholder="City / Place"
        value={newExpense.place}
        onChange={(e) =>
          setNewExpense({ ...newExpense, place: e.target.value })
        }
        className="rounded-xl"
      />
      <label className="text-sm">Paid by</label>
      <Input
        placeholder="Paid By"
        value={newExpense.paidBy}
        onChange={(e) =>
          setNewExpense({ ...newExpense, paidBy: e.target.value })
        }
        className="rounded-xl"
      />
      <label className="flex items-center gap-2 text-sm text-gray-600 pt-1">
        <input
          type="checkbox"
          checked={newExpense.doNotSplit}
          onChange={(e) =>
            setNewExpense({
              ...newExpense,
              doNotSplit: e.target.checked,
            })
          }
          className="accent-[#001e42] w-4 h-4"
        />
        Do not split this expense
      </label>
    </div>

    <DialogFooter className="mt-5 flex justify-center">
      <Button
        onClick={handleAddExpense}
        className="w-2/3 bg-[#001e42] text-white font-medium hover:bg-[#DCC9A3] hover:text-[#001e42] transition rounded-xl py-2"
      >
        Add Expense
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

        {/* Modal for Editing Expense */}
<Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>

  <DialogContent className="sm:max-w-md rounded-2xl shadow-xl bg-white">
    <DialogHeader className="text-center space-y-2">
      <DialogTitle className="text-lg font-semibold text-[#001e42]">Edit Expense</DialogTitle>
    </DialogHeader>
    {editingExpense && (
      <div className="space-y-3 mt-2">

<select
        className="w-full border rounded-xl p-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#DCC9A3]"
        value={editingExpense.category}
        onChange={(e) =>
            setEditingExpense({
              ...editingExpense,
              category: e.target.value,
            })
          }
      >
        {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
      </select>

<label className="text-sm">Expense Date</label>
        <Input
          type="date"
          value={editingExpense.date}
          onChange={(e) =>
            setEditingExpense({ ...editingExpense, date: e.target.value })
          }
          className="rounded-xl"
        />

        <label className="text-sm">Description</label>
        <Input
          placeholder="Description"
          value={editingExpense.description}
          onChange={(e) =>
            setEditingExpense({
              ...editingExpense,
              description: e.target.value,
            })
          }
          className="rounded-xl"
        />

<label className="text-sm">Amount (€)</label>
        <Input
          type="number"
          placeholder="Amount (€)"
          value={editingExpense.amount}
          onChange={(e) =>
            setEditingExpense({
              ...editingExpense,
              amount: Number(e.target.value) || 0,
            })
          }
          className="rounded-xl"
        />
        <label className="text-sm">City/Place</label>
                <Input
          placeholder="City / Place"
          value={editingExpense.place}
          onChange={(e) =>
            setEditingExpense({ ...editingExpense, place: e.target.value })
          }
          className="rounded-xl"
        />
        <label className="text-sm">Paid By</label>
        <Input
          placeholder="Paid By"
          value={editingExpense.paidBy}
          onChange={(e) =>
            setEditingExpense({ ...editingExpense, paidBy: e.target.value })
          }
          className="rounded-xl"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 pt-1">
          <input
            type="checkbox"
            checked={editingExpense.doNotSplit}
            onChange={(e) =>
              setEditingExpense({
                ...editingExpense,
                doNotSplit: e.target.checked,
              })
            }
            className="accent-[#001e42] w-4 h-4"
          />
          Do not split this expense
        </label>
      </div>
    )}
    <DialogFooter className="mt-5 flex justify-center">
      <Button
        onClick={() => {
          if (!editingExpense) return;
          const tempSet = new Set(
      expenses
        .filter((e) => e.id !== editingExpense.id)
        .map((e) => e.paidBy)
        .filter((p) => p && p.toLowerCase() !== "split")
    );

    if (editingExpense.paidBy && !tempSet.has(editingExpense.paidBy)) {
      tempSet.add(editingExpense.paidBy);
    }

    if (tempSet.size > numTravelers) {
      alert(
        `❌ Error: More unique "Paid By" names than travelers (${numTravelers})`
      );
      return;
    }
          const updated = expenses.map((exp) =>
            exp.id === editingExpense.id ? { ...editingExpense } : exp
          );
          setExpenses(updated);
          setEditModalOpen(false);
        }}
        className="w-2/3 bg-[#001e42] text-white font-medium hover:bg-[#DCC9A3] hover:text-[#001e42] transition rounded-xl py-2"
      >
        Save Changes
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

        {/* Resumen por categoría */}
        <section className="bg-white p-6 rounded-2xl shadow-md text-center">
          <h2 className="text-xl font-bold mb-6">
            Summary by Category
          </h2>
          <div className="flex flex-col items-center">
          <table className="w-full border border-gray-300 text-sm mb-6 text-center">
              <thead className="bg-[#001e42] text-white">
                <tr>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Amount (€)</th>
                </tr>
              </thead>
              <tbody>
                {categorySummary.map((c, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-3">{c.category}</td>
                  <td className="py-3">{c.value.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-bold border-t bg-gray-100">
                  <td className="py-3">Total</td>
                  <td className="py-3">{totalByCategory.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          
            <PieChart width={400} height={320}>
              <Pie
                data={categorySummary}
                dataKey="value"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
               label={({ category, value }) =>
  `${category}: €${Number(value || 0).toFixed(2)}`
}
              >
                {categorySummary.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, name, entry) => {
  const value = Number(val) || 0;
  const percent = totalByCategory > 0 ? ((value / totalByCategory) * 100).toFixed(1) : "0.0";
  return `${entry.payload.category}: €${value.toFixed(2)} (${percent}%)`;
}}
              />
              <Legend />
            </PieChart>
          </div>
        </section>

        {/* Resumen por Paid By */}
        <section className="bg-white p-6 rounded-2xl shadow-md text-center">
          <h2 className="text-xl font-bold mb-6">
            Summary by Paid By
          </h2>
          <div className="flex flex-col items-center">
            <table className="w-full border border-gray-300 text-sm mb-6 text-center">
              <thead className="bg-[#001e42] text-white">
                <tr>
                  <th className="py-2 px-3">Paid By</th>
                  <th className="py-2 px-3">Amount (€)</th>
                </tr>
              </thead>
              <tbody>
                {paidBySummary.map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-3">{p.paidBy}</td>
                    <td className="py-3">{p.value.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-bold border-t bg-gray-100">
                  <td className="py-3">Total</td>
                  <td className="py-3">{totalByPaid.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <PieChart width={400} height={320}>
              <Pie
                data={paidBySummary}
                dataKey="value"
                nameKey="paidBy"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ paidBy, value }) => {
  const val = Number(value) || 0;
  return `${paidBy}: €${val.toFixed(2)}`;
}}
              >
                {paidBySummary.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip
               formatter={(val, name, entry) => {
  const valueNum = Number(val) || 0;
  const percent = totalByPaid > 0 ? (valueNum / totalByPaid) * 100 : 0;
  return `${entry.payload.paidBy}: €${valueNum.toFixed(2)} (${percent.toFixed(1)}%)`;
}}
              />
              <Legend />
            </PieChart>
          </div>
        </section>
      </main>
      </SessionProvider>
    </>
  );
}
