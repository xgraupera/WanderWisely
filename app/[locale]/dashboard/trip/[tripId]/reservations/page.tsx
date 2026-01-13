"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useParams } from "next/navigation";

interface ReservationItem {
  id?: number | string;
  type: string;
  provider: string;
  bookingDate: string;
  date: string;
  cancellationDate?: string;
  amount: number;
  confirmed: boolean;
  link: string;
  category: string;
  expanded?: boolean;
}

interface BudgetCategory {
  id: number;
  category: string;
}

interface ExpenseForm {
  date: string;
  category: string;
  description: string;
  place: string;
  amount: number;
  paidBy: string;
  doNotSplit: boolean;
}

const formatDate = (isoString: string | null | undefined) => {
  if (!isoString) return "-";
  const [year, month, day] = isoString.split("-");
  return `${day}/${month}/${year}`;
};

const predefinedCategories: { type: string; category: string }[] = [
  { type: "Flight 1", category: "Flights" },
  { type: "Hotel 1", category: "Accommodation" },
  { type: "Internal Transport 1", category: "Internal Transport" },
  { type: "Activity 1", category: "Activities" },
  { type: "Insurance", category: "Health" },
  { type: "Visa", category: "Documentation" },
];

export default function ReservationsPage() {
  const params = useParams();
  const tripIdNum = Number(params?.tripId);

  const [rows, setRows] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationForm, setReservationForm] = useState<ReservationItem>({
    type: "",
    provider: "",
    bookingDate: new Date().toISOString().split("T")[0],
    date: "",
    cancellationDate: "",
    amount: 0,
    confirmed: false,
    link: "",
    category: "",
  });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>({
    date: new Date().toISOString().split("T")[0],
    category: "",
    description: "",
    place: "",
    amount: 0,
    paidBy: "",
    doNotSplit: false,
  });
  const [currentReservation, setCurrentReservation] = useState<ReservationItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");

const [userId, setUserId] = useState<string>("");
  const today = new Date().toISOString().split("T")[0];

  /** Cargar reservas y categorías */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resReservations, resBudget] = await Promise.all([
          fetch(`/api/reservations?tripId=${tripIdNum}`),
          fetch(`/api/budget?tripId=${tripIdNum}`),
        ]);
        const { reservations } = await resReservations.json();
        const budgetData = await resBudget.json();

        const fetchUser = async () => {
    const res = await fetch("/api/auth/session");
    const data = await res.json();
    if (data?.user?.email) setUserId(data.user.email);
  };
  fetchUser();
  
        if (Array.isArray(budgetData)) setBudgetCategories(budgetData);

        if (Array.isArray(reservations) && reservations.length > 0) {
          setRows(
            reservations.map((r: any) => ({
              ...r,
              bookingDate: r.bookingDate ? new Date(r.bookingDate).toISOString().split("T")[0] : today,
              date: r.date ? new Date(r.date).toISOString().split("T")[0] : "",
              cancellationDate: r.cancellationDate ? new Date(r.cancellationDate).toISOString().split("T")[0] : "",
              category: r.category || predefinedCategories.find(pc => pc.type === r.type)?.category || "Others",
              type: r.type || "Unknown",
              amount: r.amount || 0,
              confirmed: r.confirmed || false,
              expanded: false,
            }))
          );
        } else {
         setRows(
  predefinedCategories.map((pc, index) => ({
    id: `temp-${index}`, // 🔹 id temporal único
    type: pc.type,
    provider: "",
    bookingDate: today,
    date: "",
    cancellationDate: "",
    amount: 0,
    confirmed: false,
    link: "",
    category: pc.category,
    expanded: false,
  }))
);
        }
      } catch (err) {
        console.error("Error loading reservations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tripIdNum]);

  /** Guardar todas las reservas */
  const saveReservations = async () => {
    setSaving(true);
    try {
      const cleaned = rows.map(r => ({
        ...(typeof r.id === "number" ? { id: r.id } : {}),
        tripId: tripIdNum,
        type: r.type || "Unknown",
        category: r.category || "Others",
        provider: r.provider || "",
        bookingDate: r.bookingDate ? new Date(r.bookingDate).toISOString() : null,
        date: r.date ? new Date(r.date).toISOString() : null,
        cancellationDate: r.cancellationDate ? new Date(r.cancellationDate).toISOString() : null,
        amount: Number(r.amount) || 0,
        confirmed: r.confirmed || false,
        link: r.link || "",
      }));

const res = await fetch("/api/reservations", { // 🔹 sin /save
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ tripId: tripIdNum, reservations: cleaned, userEmail: userId}),
});

const response = await res.json();

      if (res.ok) {
      alert("✅ Reservations saved!");

      // 🔹 mover esto DENTRO del try
      if (response.reservations) {
        setRows(
          response.reservations.map((r: ReservationItem) => ({
            ...r,
            expanded: false
          }))
        );
      }

    } else {
      alert("❌ Error saving reservations");
    }
  } catch (err) {
    console.error(err);
    alert("❌ Server error");
  } finally {
    setSaving(false);
  }
};



  /** Abrir modal de Expense */
  const openExpenseForm = (reservation: ReservationItem) => {
    setCurrentReservation(reservation);
    setExpenseForm({
      date: reservation.bookingDate || today,
      category: reservation.category,
      description: reservation.provider || reservation.type,
      place: reservation.link || "",
      amount: reservation.amount || 0,
      paidBy: "",
      doNotSplit: false,
    });
    setShowExpenseForm(true);
  };

  /** Submit Expense */
  const submitExpense = async () => {
    try {
      const payload = {
  tripId: tripIdNum,
  userId: userId, // 🔹 añade esto
  expenses: [{
    ...expenseForm,
    date: new Date(expenseForm.date).toISOString(),
  }],
};
const res = await fetch("/api/expenses", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

      if (res.ok) {
        alert("✅ Expense added");
        setShowExpenseForm(false);
      } else alert("❌ Error adding expense");
    } catch (err) {
      console.error(err);
      alert("⚠️ Server error adding expense");
    }
  };

  /** Abrir modal de Add/Edit Reservation */
  const openReservationForm = (reservation?: ReservationItem) => {
  if (reservation) {
    // 🔹 Clonamos para evitar editar el estado directamente
    setReservationForm({ ...reservation });
  } else {
    setReservationForm({
      id: undefined,
      type: "",
      provider: "",
      bookingDate: today,
      date: "",
      cancellationDate: "",
      amount: 0,
      confirmed: false,
      link: "",
      category: budgetCategories[0]?.category || "Others",
    });
  }
  setShowReservationForm(true);
};


  /** Submit Reservation */
const submitReservation = () => {
  if (!reservationForm.type) return alert("Description is required");

  setRows((prev) => {
    // 🔹 Si ya existe una reserva con ese id → actualizar
    const existingIndex = prev.findIndex((r) => r.id === reservationForm.id);

    if (existingIndex !== -1) {
      const updated = [...prev];
      updated[existingIndex] = { ...reservationForm };
      return updated;
    }

    // 🔹 Si no tiene id → crear nueva reserva
    const newReservation = {
      ...reservationForm,
      id: `temp-${Date.now()}`, // id temporal único
      expanded: false,
    };
    return [...prev, newReservation];
  });

  setShowReservationForm(false);
};


  if (loading)
    return (
      <>
      <SessionProvider>
       <NavBar tripId={String(tripIdNum)} />
        <main className="p-8 text-center pt-20">
          <p className="text-lg text-gray-600">Loading trip information...</p>
        </main>
        </SessionProvider>
      </>
    );

  const categories = Array.from(new Set(rows.map(r => r.category)));
  const filteredRows = categoryFilter === "All" ? rows : rows.filter(r => r.category === categoryFilter);

  

  return (
    <>
    <SessionProvider>
      <NavBar tripId={String(tripIdNum)} />
      <main className="p-8 space-y-10 bg-gray-50 pt-20">
        <h1 className="text-3xl font-bold mb-4 text-center">✈️ Reservations Tracker</h1>
        <p className="text-center text-gray-700 text-lg max-w-2xl mx-auto mt-4 mb-8 leading-relaxed">
      Never lose a confirmation again. Store your flights, hotels, transports, and tickets — always accessible, even on the go.
    </p>

        {/* Filtro */}
        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          {["All", ...categories].map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-full border text-sm transition ${categoryFilter === cat ? "bg-[#001e42] text-white border-[#001e42]" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={()=>openReservationForm()} 
            className="bg-[#001e42] text-white hover:bg-[#DCC9A3] transition"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Reservation
          </Button>
        </div>

        {/* Reservas */}
        <section className="space-y-4">
        {categories.filter(cat => categoryFilter === "All" || cat === categoryFilter).map(cat => {
          const items = filteredRows.filter(r => r.category === cat);
          return (
            <div key={cat} className="p-4 space-y-4">
              <h2 className="font-bold text-xl">{cat}</h2>
              <div className="space-y-3">
                {items.map((r, i) => {
                  const globalIndex = rows.findIndex(x => x === r);
                  return (
                    <div key={globalIndex} className="bg-white p-5 rounded-xl shadow-md transition hover:shadow-lg relative">
                      <div className="flex items-center gap-4">
                        <input type="checkbox" className="w-5 h-5 accent-[#025fd1]" checked={r.confirmed} onChange={e => {
                          const checked = e.target.checked;
                          setRows(prev => prev.map((x,j) => j===globalIndex ? {...x, confirmed:checked}:x));
                          if (checked) {
  setTimeout(() => openExpenseForm(r), 100);
}
                          
                        }}/>
                        <div className="flex flex-col gap-1">
                          <p className="font-bold text-lg">{r.type}</p>
                          <p>Amount: {r.amount || 0}€</p>
                          <p>Booking Date: {formatDate(r.bookingDate) || "-"} | Reservation Date: {formatDate(r.date) || "-"} | Cancellation Deadline: {formatDate(r.cancellationDate) || "-"}</p>
                        </div>
                        <button
                          onClick={async () => {
  if (window.confirm("Are you sure you want to delete this reservation?")) {
    const r = rows[globalIndex];
    setRows(prev => prev.filter((_, j) => j !== globalIndex));
    if (r.id) {
      await fetch("/api/reservations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id }),
      });
    }
  }
}}
                          className="absolute top-3 right-4 text-red-500 hover:text-red-700 transition"
                        >
                          ✕
                        </button>
                        <div
  className={`absolute right-3 transition-all duration-300 ${
    r.expanded ? "bottom-20" : "bottom-3"
  }`}
>
                        <button className="text-gray-400 hover:text-gray-700 transition" onClick={()=>setRows(prev=>prev.map((x,j)=>j===globalIndex ? {...x, expanded:!x.expanded}:x))}>
                          {r.expanded ? <ChevronUp /> : <ChevronDown />}
                        </button>
                        </div>
                      </div>
                      
                      {r.expanded && (
                        <div className="mt-3 text-sm space-y-1">
                          <p>
                                  <strong>Provider:</strong> {r.provider || "-"}
                                </p>
                                <p>
                                  <strong>Booking Link:</strong> {r.link || "-"}
                                </p>
                                
                          <div className="mt-3">
        <Button
          onClick={() => openReservationForm(r)}
          className="w-full bg-[#001e42] text-white hover:bg-[#DCC9A3] transition"
        >
          Edit Reservation
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
        </section>

        <div className="flex gap-3 mt-6">
          
          <Button onClick={saveReservations} disabled={saving} className="flex-1 bg-[#001e42] text-white hover:bg-[#DCC9A3]">{saving?"Saving...":"Save Reservations"}</Button>
        </div>
      </main>

    {/* Modal para añadir/editar reserva */}
<Dialog open={showReservationForm} onOpenChange={setShowReservationForm}>
  <DialogContent className="sm:max-w-md rounded-2xl shadow-xl bg-white">
    <DialogHeader className="text-center space-y-2">
      <DialogTitle className="text-lg font-semibold text-[#001e42]">
        {reservationForm.id ? "Edit Reservation" : "Add Reservation"}
      </DialogTitle>
          </DialogHeader>

    <div className="space-y-3 mt-2">
      
      <select
        className="w-full border rounded-xl p-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#DCC9A3]"
        value={reservationForm.category}
        onChange={(e) =>
          setReservationForm({ ...reservationForm, category: e.target.value })
        }
      >
        {budgetCategories.map((b) => (
          <option key={b.id} value={b.category}>
            {b.category}
          </option>
        ))}
      </select>

      <label className="text-sm">Description</label>
      <Input
        placeholder="Description"
        className="rounded-xl"
        value={reservationForm.type}
        onChange={(e) =>
          setReservationForm({ ...reservationForm, type: e.target.value })
        }
      />

      <label className="text-sm">Provider</label>
      <Input
        placeholder="Provider"
        className="rounded-xl"
        value={reservationForm.provider}
        onChange={(e) =>
          setReservationForm({ ...reservationForm, provider: e.target.value })
        }
      />

      <label className="text-sm">Booking Date</label>
      <Input
        type="date"
        className="rounded-xl"
        value={reservationForm.bookingDate}
        onChange={(e) =>
          setReservationForm({ ...reservationForm, bookingDate: e.target.value })
        }
      />

  

      <label className="text-sm">Reservation Date</label>
      <Input
        type="date"
        className="rounded-xl"
        value={reservationForm.date}
        onChange={(e) =>
          setReservationForm({ ...reservationForm, date: e.target.value })
        }
      />

    <label className="text-sm">Cancellation Deadline*</label>
      <Input
        type="date"
        className="rounded-xl"
        value={reservationForm.cancellationDate}
        onChange={(e) =>
          setReservationForm({
            ...reservationForm,
            cancellationDate: e.target.value,
          })
        }
      />
      <label className="text-sm">Amount (€)</label>
   <Input
  type="number"
  className="rounded-xl"
  placeholder="Amount (€)"
  value={reservationForm.amount || ""}
  onChange={(e) =>
    setReservationForm({
      ...reservationForm,
      amount: Number(e.target.value) || 0,
    })
  }
/>

      <label className="text-sm ">Booking Link</label>
      <Input
        placeholder="Link"
        className="rounded-xl"
        value={reservationForm.link}
        onChange={(e) =>
          setReservationForm({ ...reservationForm, link: e.target.value })
        }
      />
      <label className="text-sm flex items-center gap-2 text-sm text-gray-600 pt-1">* If the Cancellation Deadline attribute is not empty, a reminder email will be sent on the specified date.</label>
    </div>

    <DialogFooter className="mt-5 flex justify-center">
      <Button
        onClick={submitReservation}
        className="w-2/3 bg-[#001e42] text-white font-medium hover:bg-[#DCC9A3] hover:text-[#001e42] transition rounded-xl py-2"
      >
        {reservationForm.id ? "Save Changes" : "Add Reservation"}
      </Button>
     
    </DialogFooter>
  </DialogContent>
</Dialog>
<Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
  <DialogContent className="sm:max-w-md rounded-2xl shadow-xl bg-white">
    <DialogHeader className="text-center space-y-2">
      <DialogTitle className="text-lg font-semibold text-[#001e42]">
        Add New Expense
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-3 mt-2">
      <select
        className="w-full border rounded-xl p-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#DCC9A3]"
        value={expenseForm.category}
        onChange={(e) =>
          setExpenseForm({ ...expenseForm, category: e.target.value })
        }
      >
        {budgetCategories.map((b) => (
          <option key={b.id} value={b.category}>
            {b.category}
          </option>
        ))}
      </select>

      <label className="text-sm">Expense Date</label>
      <Input
        type="date"
        value={expenseForm.date}
        onChange={(e) =>
          setExpenseForm({ ...expenseForm, date: e.target.value })
        }
        className="rounded-xl"
      />

      <label className="text-sm">Description</label>
      <Input
        placeholder="Description"
        value={expenseForm.description}
        onChange={(e) =>
          setExpenseForm({ ...expenseForm, description: e.target.value })
        }
        className="rounded-xl"
      />

      <label className="text-sm">Amount (€)</label>
      <Input
        type="number"
        placeholder="Amount (€)"
        value={expenseForm.amount || ""}
        onChange={(e) =>
          setExpenseForm({
            ...expenseForm,
            amount: Number(e.target.value) || 0,
          })
        }
        className="rounded-xl"
      />

      <label className="text-sm">City/Place</label>
      <Input
        placeholder="City / Place"
        value={expenseForm.place}
        onChange={(e) =>
          setExpenseForm({ ...expenseForm, place: e.target.value })
        }
        className="rounded-xl"
      />

      <label className="text-sm">Paid by</label>
      <Input
        placeholder="Paid By"
        value={expenseForm.paidBy}
        onChange={(e) =>
          setExpenseForm({ ...expenseForm, paidBy: e.target.value })
        }
        className="rounded-xl"
      />

      <label className="flex items-center gap-2 text-sm text-gray-600 pt-1">
        <input
          type="checkbox"
          checked={expenseForm.doNotSplit}
          onChange={(e) =>
            setExpenseForm({
              ...expenseForm,
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
        onClick={submitExpense}
        className="w-2/3 bg-[#001e42] text-white font-medium hover:bg-[#DCC9A3] hover:text-[#001e42] transition rounded-xl py-2"
      >
        Add Expense
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
</SessionProvider>
    </>
  );
}
