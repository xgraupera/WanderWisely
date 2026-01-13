"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ItineraryItem {
  id?: number;
  day: number;
  date: string;
  city: string;
  activity: string;
  notes: string;
  expanded?: boolean;
}


interface ItineraryFormProps {
  item?: ItineraryItem; // si viene, es editar
  onSave: (item: ItineraryItem) => void;
  onClose: () => void;
}






export default function ItineraryPage() {
  const params = useParams();
  const tripIdParam = params?.tripId;
  const tripId = Array.isArray(tripIdParam) ? tripIdParam[0] : tripIdParam;
  const [days, setDays] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDay, setEditDay] = useState<ItineraryItem | null>(null);
const [showEditModal, setShowEditModal] = useState(false);


const openEditDayModal = (day: ItineraryItem) => {
  setEditDay(day);
  setShowEditModal(true);
};

  // 🔹 Cargar datos del itinerario
  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const res = await fetch(`/api/itinerary?tripId=${tripId}`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((d: any) => ({
            ...d,
            date: d.date ? new Date(d.date).toISOString().split("T")[0] : "",
            expanded: false,
          }));
          setDays(formatted);
        } else {
          setDays([{ day: 1, date: "", city: "", activity: "", notes: "", expanded: false }]);
        }
      } catch (err) {
        console.error("Error loading itinerary:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItinerary();
  }, [tripId]);

  // ➕ Añadir un nuevo día
  const addDay = () => {
    const last = days[days.length - 1];
    let nextDate = "";

    if (last?.date) {
      const d = new Date(last.date);
      d.setDate(d.getDate() + 1);
      nextDate = d.toISOString().split("T")[0];
    }

    setDays([
      ...days,
      { day: days.length + 1, date: nextDate, city: "", activity: "", notes: "", expanded: false },
    ]);
  };

  // ⬆️⬇️ Mover día
  const moveDay = (index: number, direction: "up" | "down") => {
    const newDays = [...days];
    if (direction === "up" && index > 0) [newDays[index - 1], newDays[index]] = [newDays[index], newDays[index - 1]];
    if (direction === "down" && index < newDays.length - 1) [newDays[index + 1], newDays[index]] = [newDays[index], newDays[index + 1]];
    setDays(newDays.map((d, i) => ({ ...d, day: i + 1 })));
  };

  // 🗑️ Eliminar día


const deleteDay = (index: number) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      const updated = days.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 }));
    setDays(updated);
    }
  };

  const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};


  // 💾 Guardar itinerario
  const saveItinerary = async () => {
    setSaving(true);
    try {
      const cleaned = days.map((d) => ({
        ...d,
        date: d.date || null,
        city: d.city?.trim() || "",
        activity: d.activity?.trim() || "",
        notes: d.notes?.trim() || "",
      }));

      const res = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, itinerary: cleaned }),
      });

      if (res.ok) alert("✅ Itinerary saved!");
      else alert("❌ Error saving itinerary.");
    } catch (err) {
      console.error(err);
      alert("❌ Server error");
    } finally {
      setSaving(false);
    }
  };

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
        <h1 className="text-3xl font-bold mb-4 text-center">🗓️ Trip Itinerary</h1>
        <p className="text-center text-gray-700 text-lg max-w-2xl mx-auto mt-4 mb-8 leading-relaxed">
          Make every day count. Plan your activities, destinations, and personal notes so your trip flows effortlessly.
        </p>

        <section className="space-y-4">
          {days.map((d, i) => (
            <div key={i} className="relative bg-white p-5 rounded-xl shadow-md transition hover:shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1 mt-1">
                  <button onClick={() => moveDay(i, "up")} className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400">↑</button>
                  <button onClick={() => moveDay(i, "down")} className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400">↓</button>
                  
                </div>
                <div>
                  <p className="font-bold text-lg">Day {d.day} - {formatDate(d.date) || "No Date"}</p>
                  <p>City/Place: {d.city || "-"}</p>
                  <p>Activity: {d.activity || "-"}</p>
                </div>
                
              </div>
              <button
                    onClick={() => deleteDay(i)}
                    className="absolute top-3 right-4 text-red-500 hover:text-red-700 transition opacity-80 group-hover:opacity-100"
                    title="Delete trip"
                  >
                    ✕
                  </button>

              {/* Expandir notas */}
             

<div
  className={`absolute right-3 transition-all duration-300 ${
    d.expanded ? "bottom-20" : "bottom-3"
  }`}
>
                              
                              <button
                                onClick={() => setDays((prev) => prev.map((x, j) => j === i ? { ...x, expanded: !x.expanded } : x))}
                                className="text-gray-400 hover:text-gray-700 transition"
                              >
                                {d.expanded ? (
                                  <ChevronUp size={20} />
                                ) : (
                                  <ChevronDown size={20} />
                                )}
                              </button>
                            </div>


              {d.expanded && (
                <div className="break-words mt-2 space-y-2">
                                    <p>
                                  <strong>Notes:</strong> {d.notes || "-"}
                                </p>
                                <Button
          onClick={() => openEditDayModal(d)}
          className="w-full bg-[#001e42] text-white hover:bg-[#DCC9A3] transition"
        >
          Edit Day
        </Button>
                </div>
                
              )}
            </div>
          ))}
        </section>

        {/* Botones */}
        <div className="mt-6 flex flex-col gap-4">
          <button onClick={addDay} className="w-full bg-[#001e42] text-white py-2 rounded-lg hover:bg-[#DCC9A3] transition">+ Add Day</button>
          <button onClick={saveItinerary} disabled={saving} className="w-full bg-[#001e42] text-white py-2 rounded-lg hover:bg-[#DCC9A3] transition">
            {saving ? "Saving..." : "Save Itinerary"}
          </button>
        </div>
      </main>
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
  <DialogContent className="sm:max-w-md rounded-2xl shadow-xl bg-white">
    <DialogHeader>
      <DialogTitle>Edit Day</DialogTitle>
    </DialogHeader>
    {editDay && (
      <div className="space-y-3 mt-2">
        <label className="text-sm">Date</label>
        <Input
          type="date"
          value={editDay.date}
          onChange={(e) =>
            setEditDay({ ...editDay, date: e.target.value })
          }
          className="w-full rounded-xl"
        />
        <label className="text-sm">City / Place</label>
        <Input
          value={editDay.city}
          onChange={(e) =>
            setEditDay({ ...editDay, city: e.target.value })
          }
          className="w-full rounded-xl"
        />
        <label className="text-sm">Activity</label>
        <Input
          value={editDay.activity}
          onChange={(e) =>
            setEditDay({ ...editDay, activity: e.target.value })
          }
          className="w-full rounded-xl"
        />
        <label className="text-sm">Notes</label>
        <textarea
          className="w-full border rounded-xl p-2 resize-y"
          value={editDay.notes}
          onChange={(e) =>
            setEditDay({ ...editDay, notes: e.target.value })
          }
        />
      </div>
    )}
    <DialogFooter className="mt-5 flex justify-center">
      <Button
        onClick={() => {
          if (!editDay) return;
          setDays((prev) =>
            prev.map((d) => (d.id === editDay.id ? editDay : d))
          );
          setShowEditModal(false);
        }}
        className="w-2/3 bg-[#001e42] text-white font-medium hover:bg-[#DCC9A3] hover:text-[#001e42] transition rounded-xl py-2"
      >
        Save Changes
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
</SessionProvider>
    </>
  );
}
