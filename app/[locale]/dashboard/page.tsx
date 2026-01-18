"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import FooterBar from "@/components/FooterBar";
import dynamic from "next/dynamic";
/* import "leaflet/dist/leaflet.css"; */
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Ajusta la ruta según tu proyecto
import { Button } from "@/components/ui/button"; // Si ya usas un Button personalizado
import { useParams } from "next/navigation";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";
import { SessionProvider } from "next-auth/react";

/* 
const MapComponent = dynamic(
  () => import("@/components/MapComponent"),
  { ssr: false }
);
 */

export default function DashboardPage() {
  const params = useParams();
  const locale = params?.locale || "en"; // fallback
  const [trips, setTrips] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    travelers: "",
    latitude: "",
    longitude: "",
  });
  const [markerIcon, setMarkerIcon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const typingTimer = useRef<NodeJS.Timeout | null>(null);

const t = locale === "es" ? es : en;


  // 🧭 Debounce estable
  function debounce(callback: Function, delay = 400) {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => callback(), delay);
  }

  // 🌍 Autocompletado de ciudades
  async function fetchCitySuggestions(query: string) {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
      const json = await res.json();

      if (!res.ok || json.error) {
        console.error("API error:", json.error || res.statusText);
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setSuggestions(json.data || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Error fetching cities:", err);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }



  function handleCitySelect(city: any) {
  setForm({
    ...form,
    name: `${city.name}, ${city.country}`,
    latitude: city.latitude,
    longitude: city.longitude,
  });
  setShowSuggestions(false);
}

const [weatherData, setWeatherData] = useState<Record<number, any>>({}); // key = trip.id

async function fetchWeather(lat: number, lon: number, tripId: number) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_KEY; // Tu API key de OpenWeatherMap
    const res = await fetch(
  `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
);
    if (!res.ok) throw new Error("Weather fetch failed");
    const data = await res.json();
    setWeatherData((prev) => ({ ...prev, [tripId]: data }));
  } catch (err) {
    console.error("Error fetching weather:", err);
  }
}

  // 🚀 Cargar viajes al iniciar
  useEffect(() => {
    fetchTrips();
  }, []);

  async function fetchTrips() {
    setLoading(true);
    try {
      const res = await fetch("/api/trips");
      if (res.ok) {
        const data = await res.json();
        setTrips(
  data.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
);

        // ✅ Aquí sí existe `data`, llamamos a fetchWeather
      data.forEach((trip: any) => {
        if (trip.latitude && trip.longitude) {
          fetchWeather(trip.latitude, trip.longitude, trip.id);
        }
      });
    
      } else {
        console.error("Failed to fetch trips");
      }
    } catch (err) {
      console.error("Error fetching trips:", err);
    } finally {
      setLoading(false);
    }
  }

  // ✈️ Crear nuevo viaje
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.startDate || !form.endDate) {
  setError("Start and End dates are required.");
  setSubmitting(false);
  return;
}

    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      setError("End date cannot be earlier than the start date.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          travelers: Number(form.travelers),
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
        }),
      });

      if (res.ok) {
        setForm({ name: "", startDate: "", endDate: "", travelers: "", latitude: "", longitude: "" });
        await fetchTrips();
        setModalOpen(false);
      } else {
        const err = await res.json();
        setError("Error creating trip: " + (err?.error || res.statusText));
      }
    } catch (err) {
      console.error("Create trip error:", err);
      setError("Network error creating trip");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this trip?")) return;
    try {
      const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTrips((prev) => prev.filter((t) => t.id !== id));
      } else {
        const err = await res.json();
        alert("Error deleting trip: " + (err?.error || res.statusText));
      }
    } catch (err) {
      console.error("Delete trip error:", err);
      alert("Network error deleting trip");
    }
  }

  return (
    
    <>
  <SessionProvider>
      <NavBar />
  
      <main className="p-8 space-y-10 bg-gray-50 pt-20">
        <h1 className="text-3xl font-bold mb-4">{t.dashboard}</h1>

        <p className="text-center text-gray-700 text-lg max-w-2xl mx-auto mt-4 mb-8 leading-relaxed">
          Every great adventure begins here.
          Create a new trip or revisit your ongoing journeys.
        </p>
        <div className="text-center">
 <button 
  onClick={() => setModalOpen(true)}
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
  Create New Trip
</button>

</div>

        {/* Lista de viajes */}
        <section>
          <h2 className="text-xl font-semibold mb-3 text-[#001e42]">Your Trips</h2>
          {loading ? (
            <p className="text-gray-500">Loading trips...</p>
          ) : trips.length === 0 ? (
            <p className="text-gray-500 italic">You have not created a trip yet!</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => {
  // Estado según fecha
  const today = new Date();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);

    let shadowColor = "";

     {/* De momento no pongo la sobra de colores
  if (today >= start && today <= end) {
    shadowColor = "shadow-[0_0_10px_rgba(134,239,172,0.4)]"; // Ongoing
  } else if (today < start) {
    shadowColor = "shadow-[0_0_10px_rgba(253,224,71,0.3)]"; // Upcoming
  } else {
    shadowColor = "shadow-md"; // Completed. Para color rojo: "shadow-[0_0_10px_rgba(248,113,113,0.3)]"
  }
 */}
  shadowColor = "shadow-md";

  return (
    <div
      key={trip.id}
      className={`bg-white rounded-xl  p-5 hover:shadow-lg transition relative  ${shadowColor}`}
      /* Para quitar el shadow de colores poner: shadow-md y no ${shadowColor}*/
    >
      <Link href={`/${locale}/dashboard/trip/${trip.id}/main`} className="block">
        <h3 className="text-lg font-semibold text-[#001e42]">{trip.name}</h3>

        {/* Fechas a la izquierda, clima a la derecha */}
        <div className="flex justify-between items-start text-sm text-gray-600">
          <div>
            <p>
              {new Date(trip.startDate).toLocaleDateString()} →{" "}
              {new Date(trip.endDate).toLocaleDateString()}
            </p>
            <p>
              {trip.durationDays} Days | Travelers: {trip.travelers}
            </p>
          </div>

          {/* Clima */}
          <div className="text-right flex flex-col items-end">
            {weatherData[trip.id] && weatherData[trip.id].main && weatherData[trip.id].weather ? (
              <div className="flex flex-col items-end">
                <p className="text-gray-700">
                  {Math.round(weatherData[trip.id].main.temp)}°C | {Math.round(weatherData[trip.id].main.temp_min)}°C
                </p>
                <div className="flex items-center gap-1">
                  <img
                    src={`http://openweathermap.org/img/wn/${weatherData[trip.id].weather[0].icon}@2x.png`}
                    alt={weatherData[trip.id].weather[0].description}
                    className="w-6 h-6"
                  />
                  <p className="capitalize text-gray-700 text-sm">
                    {weatherData[trip.id].weather[0].description}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 italic">Weather not available</p>
            )}
          </div>
        </div>
      </Link>

      <button
        onClick={() => handleDelete(trip.id)}
        className="absolute top-5.5 right-4 text-red-500 hover:text-red-700 transition opacity-80 group-hover:opacity-100"
        title="Delete trip"
      >
        ✕
      </button>
    </div>
  );
})}

</div>
 )}
          
        </section>

        {/* 🌍 MAPA DE VIAJES */}
        
        
{/* 🌍 MAPA GENERAL DE VIAJES */}
 <section className="pt-4">
<h2 className="text-xl font-semibold mb-3 text-[#001e42]">Trips Map</h2>

  

{/*
<section className="w-full h-[400px] rounded-xl overflow-hidden shadow">
  <MapComponent trips={trips} />
</section>
*/}



</section>

        

        {/* Crear un nuevo viaje */}
        <Dialog
  open={modalOpen}
  onOpenChange={(open) => {
    setModalOpen(open);
    if (!open) {
      // Si cerramos el modal, reseteamos el formulario y el error
      setForm({ name: "", startDate: "", endDate: "", travelers: "", latitude: "", longitude: "" });
      setError(null);
    }
  }}
>
  <DialogContent className="sm:max-w-md rounded-2xl shadow-xl bg-white">
    <DialogHeader className="text-center space-y-2">
      <DialogTitle className="text-lg font-semibold text-[#001e42]">
        Create a New Trip
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-3 mt-2">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Trip Name */}
        <div className="flex flex-col sm:col-span-2">
          <label className="mb-1">Trip Name</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Rome"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                debounce(() => fetchCitySuggestions(e.target.value));
              }}
              onFocus={() => form.name && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              required
              className="border p-2 border-gray-200 rounded-lg w-full"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border rounded-lg shadow-md w-full mt-1 max-h-40 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    onClick={() => handleCitySelect(s)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {s.name}, {s.country}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Travelers */}
         <div className="flex flex-col sm:col-span-2">
          <label className="mb-1">Number of Travelers</label>
          <input
            type="number"
            placeholder="2"
            value={form.travelers}
            onChange={(e) => setForm({ ...form, travelers: e.target.value })}
            required
            className="border p-2 border-gray-200 rounded-lg w-full"
          />
        </div>
<div className="flex gap-4 sm:col-span-2">
        {/* Start Date */}
        <div className="flex flex-col">
          <label className="mb-1">Start Date</label>
          <DatePicker
            required
            selected={form.startDate ? new Date(form.startDate) : null}
            onChange={(date: Date | null) => {
              if (date) setForm({ ...form, startDate: date.toISOString().split("T")[0] });
              else setForm({ ...form, startDate: "" });
            }}
            className="border p-2 border-gray-200 rounded-lg w-full"
            dateFormat="dd-MM-yyyy"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col">
          <label className="mb-1">End Date</label>
          <DatePicker
            required
            selected={form.endDate ? new Date(form.endDate) : null}
            onChange={(date: Date | null) => {
              if (date) setForm({ ...form, endDate: date.toISOString().split("T")[0] });
              else setForm({ ...form, endDate: "" });
            }}
            className="border p-2 border-gray-200 rounded-lg w-full"
            dateFormat="dd-MM-yyyy"
            minDate={form.startDate ? new Date(form.startDate) : undefined}
          />
        </div>
</div>
<div className="flex gap-4 sm:col-span-2">
        {/* Latitude */}
        <div className="flex flex-col">
          <label className="mb-1">Latitude (Optional)</label>
          <input
            type="number"
            step="any"
            placeholder="41,89"
            value={form.latitude || ""}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            className="border p-2 border-gray-200 rounded-lg w-full"
          />
        </div>

        {/* Longitude */}
        <div className="flex flex-col">
          <label className="mb-1">Longitude (Optional)</label>
          <input
            type="number"
            step="any"
            placeholder="12,48"
            value={form.longitude || ""}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            className="border p-2 border-gray-200 rounded-lg w-full"
          />
        </div>
</div>
        {error && (
          <p className="text-red-600 text-sm mt-3 font-medium text-center sm:col-span-2">
            ⚠️ {error}
          </p>
        )}
      </form>
    </div>

    <DialogFooter className="mt-5 flex justify-center">
      <Button
        onClick={handleSubmit }
        
        disabled={submitting}
        className="w-2/3 bg-[#001e42] text-white font-medium hover:bg-[#DCC9A3] hover:text-[#001e42] transition rounded-xl py-2"
      >
        {submitting ? "Creating..." : "Create Trip"}
        
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      </main>
      </SessionProvider>
    </>
   
  );
}
