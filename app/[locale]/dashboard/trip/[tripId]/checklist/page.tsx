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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChecklistItem {
  id?: number;
  category: string;
  task: string;
  notes: string;
  done: boolean;
  expanded?: boolean;
}

export default function ChecklistPage() {
  const params = useParams();
  const tripIdParam = params?.tripId;
  const tripId = Array.isArray(tripIdParam) ? tripIdParam[0] : tripIdParam;
const locale = params?.locale || "en"; // 🔹 fallback

  const [rows, setRows] = useState<ChecklistItem[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [editItem, setEditItem] = useState<ChecklistItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
   const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<ChecklistItem>({
    category: budgetCategories[0] || "Others",
    task: "",
    notes: "",
    done: false,
  });

  // 🟢 Cargar categorías desde Budget
  useEffect(() => {
    async function fetchBudgetCategories() {
      try {
        const res = await fetch(`/api/budget?tripId=${tripId}`);
        const data = await res.json();
        const cats = Array.from(
  new Set(data.map((b: any) => String(b.category)).filter(Boolean))
) as string[];
setBudgetCategories(cats);
        
      } catch (err) {
        console.error("Error loading budget categories:", err);
      }
    }
    fetchBudgetCategories();
  }, [tripId]);

  // 🟢 Cargar checklist
  useEffect(() => {
    async function fetchChecklist() {
      try {
        const res = await fetch(`/api/checklist?tripId=${tripId}`);
        const data = await res.json();

        // Ajustar categorías a las del Budget
        const adjusted = data.map((item: any) => {
          const matchCat =
            budgetCategories.find(
              (b) =>
                b.toLowerCase().includes(item.category.toLowerCase()) ||
                item.category.toLowerCase().includes(b.toLowerCase())
            ) || "Others";
          return { ...item, category: matchCat, expanded: false };
        });

        setRows(adjusted);
      } catch (err) {
        console.error("Error loading checklist:", err);
      } finally {
        setLoading(false);
      }
    }
    if (budgetCategories.length > 0) fetchChecklist();
  }, [tripId, budgetCategories]);

  // 🔹 Filtrar por categoría (solo las que tengan items)
  const filteredCategories = Array.from(
    new Set(rows.map((r) => r.category).filter(Boolean))
  ).filter((cat) =>
    rows.some((r) => r.category === cat && (r.task || r.notes))
  );

  const filteredRows =
    categoryFilter === "All"
      ? rows
      : rows.filter((r) => r.category === categoryFilter);

  // 🟠 Guardar checklist
  const saveChecklist = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: Number(tripId), checklist: rows }),
      });
      if (res.ok) alert("✅ Checklist saved!");
      else alert("❌ Error saving checklist.");
    } catch {
      alert("❌ Network or server error");
    } finally {
      setSaving(false);
    }
  };

  // 🟡 Añadir item
  const addRow = () => {
    const firstCategory = budgetCategories[0] || "Others";
    setRows((prev) => [
      ...prev,
      {
        category: firstCategory,
        task: "",
        notes: "",
        done: false,
        expanded: true,
      },
    ]);
  };

  // 🟣 Actualizar item editado
   const handleEditSave = () => {
    if (!editItem) return;
    setRows((prev) =>
      prev.map((x, i) =>
        i === prev.findIndex((r) => r.id === editItem.id || r === editItem)
          ? { ...editItem }
          : x
      )
    );
    setShowEditModal(false);
  };
    const deleteItem = (index: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) return;

    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading)
    return (
  
      <><SessionProvider>
        <NavBar tripId={tripId} />
        <main className="p-8 text-center bg-gray-50  pt-20">
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
        <h1 className="text-3xl font-bold text-center">🧾 Travel Checklist</h1>
        <p className="text-center text-gray-700 text-lg max-w-2xl mx-auto mt-4 mb-8 leading-relaxed">
           Don’t leave anything behind. Create your packing list, check off what’s ready, and travel knowing you have everything you need.
        </p>

        {/* Filtro por categoría */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          {["All", ...filteredCategories].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-full border text-sm transition ${
                categoryFilter === cat
                  ? "bg-[#001e42] text-white border-[#001e42]"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Botón para añadir item */}
        <div className="flex justify-center mt-4">
  <Button
    onClick={() => setShowAddModal(true)}
    className="bg-[#001e42] text-white hover:bg-[#DCC9A3]"
  >
    <Plus className="mr-2 h-4 w-4" /> Add Item
  </Button>
</div>

        {/* Checklist */}
        <section className="space-y-8 mt-8">
          {filteredCategories.map((cat) => {
            const items = filteredRows.filter((r) => r.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="space-y-3">
                <h2 className="text-xl font-semibold mb-3 text-[#001e42]">{cat}</h2>
                {items.map((item, idx) => {
                  const globalIndex = rows.findIndex((r) => r === item);
                  return (
                    <div
                      key={globalIndex}
                      className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition relative"
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((x, j) =>
                                j === globalIndex
                                  ? { ...x, done: e.target.checked }
                                  : x
                              )
                            )
                          }
                          className="w-5 h-5 accent-[#025fd1]"
                        />
                        <div className="flex flex-col gap-1">
                          <p className="font-bold text-lg">
                            {item.task || "No Task"}
                          </p>
                          
                        </div>
                      </div>
<button
                    onClick={() => deleteItem(globalIndex)}
                    className="absolute top-3 right-3.5 text-red-500 hover:text-red-700 transition opacity-80 group-hover:opacity-100"
                    title="Delete Item"
                  >
                    ✕
                  </button>
                  <div
  className={`absolute top-3.5 right-10 transition-all duration-300 ${
    item.expanded ? "bottom-20" : "bottom-3"
  }`}
>
                      <button
                        onClick={() =>
                          setRows((prev) =>
                            prev.map((x, j) =>
                              j === globalIndex
                                ? { ...x, expanded: !x.expanded }
                                : x
                            )
                          )
                        }
                        className="text-gray-400 hover:text-gray-700 transition"
                      >
                        {item.expanded ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
</div>
                      {item.expanded && (
                        <div className="mt-3 break-words text-sm space-y-1">
                          
                          <p>
                                  <strong>Notes:</strong> {item.notes || "-"}
                                </p>
                          <div className="mt-3">
                          <Button
                            onClick={() => {
                              setEditItem(item);
                              setShowEditModal(true);
                            }}
                           className="w-full bg-[#001e42] text-white hover:bg-[#DCC9A3] transition"
                          >
                            Edit Item
                          </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>

        {/* Guardar */}
        <div className="mt-8">
          <Button
            onClick={saveChecklist}
            disabled={saving}
            className="w-full bg-[#001e42] text-white py-3 rounded-xl hover:bg-[#DCC9A3]"
          >
            {saving ? "Saving..." : "Save Checklist"}
          </Button>
        </div>
      </main>

      {/* 🔵 Modal Editar Item */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-xl bg-white">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-3 mt-2">
              <select
                className="w-full border rounded-xl p-2 bg-gray-50 focus:ring-2 focus:ring-[#DCC9A3]"
                value={editItem.category}
                onChange={(e) =>
                  setEditItem({ ...editItem, category: e.target.value })
                }
              >
                {budgetCategories.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <label className="text-sm">Task</label>
              <Input
                placeholder="Task"
                className="rounded-xl"
                value={editItem.task}
                onChange={(e) =>
                  setEditItem({ ...editItem, task: e.target.value })
                }
              />
              <label className="text-sm">Notes</label>
              <textarea
                className="w-full border rounded-xl p-2 resize-y"
                placeholder="Notes"
                value={editItem.notes}
                onChange={(e) =>
                  setEditItem({ ...editItem, notes: e.target.value })
                }
              />
            </div>
          )}
          <DialogFooter className="mt-5 flex justify-center">
            <Button
              onClick={handleEditSave}
        className="w-2/3 bg-[#001e42] text-white font-medium hover:bg-[#DCC9A3] hover:text-[#001e42] transition rounded-xl py-2"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 🔵 Modal Añadir Nuevo Item */}
<Dialog open={showAddModal} onOpenChange={setShowAddModal}>
  <DialogContent className="sm:max-w-md rounded-2xl shadow-xl bg-white">
    <DialogHeader>
      <DialogTitle>Add New Item</DialogTitle>
    </DialogHeader>
    <div className="space-y-3 mt-2">
      <select
        className="w-full border rounded-xl p-2 bg-gray-50 focus:ring-2 focus:ring-[#DCC9A3]"
        value={newItem.category}
        onChange={(e) =>
          setNewItem({ ...newItem, category: e.target.value })
        }
      >
        {budgetCategories.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
<label className="text-sm">Task</label>
      <Input
        placeholder="Task"
        className="rounded-xl"
        value={newItem.task}
        onChange={(e) => setNewItem({ ...newItem, task: e.target.value })}
      />
      <label className="text-sm">Notes</label>
      <textarea
        className="w-full border rounded-xl p-2 resize-y"
        placeholder="Notes"
        value={newItem.notes}
        onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
      />
    </div>

    <DialogFooter className="mt-4 flex gap-3">
      <Button
        onClick={() => {
          if (!newItem.task.trim()) {
            alert("Please enter a task name.");
            return;
          }
          setRows((prev) => [...prev, { ...newItem, expanded: false }]);
          setNewItem({
            category: budgetCategories[0] || "Others",
            task: "",
            notes: "",
            done: false,
          });
          setShowAddModal(false);
        }}
        className="w-2/3 bg-[#001e42] text-white font-medium hover:bg-[#DCC9A3] hover:text-[#001e42] transition rounded-xl py-2"
      >
        Add
      </Button>
     
    </DialogFooter>
  </DialogContent>
</Dialog>
</SessionProvider>
    </>
  );
}
