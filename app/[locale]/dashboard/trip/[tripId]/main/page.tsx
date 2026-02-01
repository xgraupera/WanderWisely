"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { Plus } from "lucide-react";
import BudgetSetupWizard from "@/components/BudgetSetupWizard";

interface Props {
  params: { tripId: string };
}

interface Trip {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  travelers: number;
  longitude: number;
  latitude: number;
}


export default function TripMainPage() {
  const params = useParams(); // ✅ obtiene el tripId del path
  const router = useRouter();
  const tripIdParam = params?.tripId;
  const tripId = Array.isArray(tripIdParam) ? tripIdParam[0] : tripIdParam;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [spent, setSpent] = useState(0);
  const [budget, setBudget] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
const [description, setDescription] = useState("");
const [cities, setCities] = useState<{ name: string; country?: string; latitude?: number | null; longitude?: number | null }[]>([]);
const locale = params?.locale || "en"; // 🔹 fallback

const [showBudgetSetup, setShowBudgetSetup] = useState(false);

const [cityInput, setCityInput] = useState("");
const [citiesWeather, setCitiesWeather] = useState<
  { city: string; temp: number; tempMin: number; desc: string }[]
>([]);
const [mainWeather, setMainWeather] = useState<{ temp: number; tempMin: number; desc: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<
  { name: string; country?: string; latitude?: number | null; longitude?: number | null }[]
>([]);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

function debounce(callback: Function, delay = 400) {
  if (typingTimer.current) clearTimeout(typingTimer.current);
  typingTimer.current = setTimeout(() => callback(), delay);
}



useEffect(() => {
  async function fetchMainWeather() {
    if (!trip?.latitude || !trip?.longitude) return;
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${trip.latitude}&lon=${trip.longitude}&units=metric&appid=${apiKey}`
    );
    if (!res.ok) return;
    const data = await res.json();
    setMainWeather({
  temp: Math.round(data.main.temp),
  tempMin: Math.round(data.main.temp_min),
  desc: data.weather[0].description
});
  }
  fetchMainWeather();
}, [trip?.latitude, trip?.longitude]);

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

async function addCity(cityName: string) {
  if (!cityName) return;

  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${apiKey}`
  );
  if (!res.ok) return;
  const data = await res.json();

  const cityObj = {
    name: cityName,
    country: data.sys.country || "",
    latitude: data.coord?.lat ?? null,
    longitude: data.coord?.lon ?? null,
  };

  setCities((prev) => [...prev, cityObj]);
setCitiesWeather(prev => [
  ...prev,
  {
    city: cityName,
    temp: Math.round(data.main.temp),
    tempMin: Math.round(data.main.temp_min),
    desc: data.weather[0].description
  }
]);
  setHasChanges(true); // ✅ cambios
}



useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasChanges) return;
      e.preventDefault();
      e.returnValue = ""; // obligatorio para Chrome
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  useEffect(() => {
    if (tripId) fetchTrip();
  }, [tripId]);

  // 🔹 Cuando cambien las ciudades, cargar su clima
useEffect(() => {
  async function fetchCitiesWeather() {
    if (!cities.length) return;
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;
    const results = [];

    for (const city of cities) {
      const query = city.name.includes(",")
        ? city.name.split(",")[0]
        : city.name;

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&units=metric&appid=${apiKey}`
      );

      if (!res.ok) continue;
      const data = await res.json();
results.push({
  city: `${city.name}, ${city.country || data.sys.country || ""}`,
  temp: Math.round(data.main.temp),
  tempMin: Math.round(data.main.temp_min),
  desc: data.weather[0].description,
});
    }

    setCitiesWeather(results);
  }

  fetchCitiesWeather();
}, [cities]);


  async function fetchTrip() {
    const res = await fetch(`/api/trips/${tripId}`);
    if (res.ok) {
      const data = await res.json();
      setTrip({
        id: data.id,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        durationDays: data.durationDays || 0,
        travelers: data.travelers || 1,
        latitude:data.latitude || 0,
        longitude:data.longitude || 0,
      });
      if (data.hasCompletedBudgetSetup === false) {
  setShowBudgetSetup(true);
}

      setBudget(data.totalBudget || 0);
      setSpent(data.spentSoFar || 0);
      setDescription(data.description || "");
setCities(
  Array.isArray(data.cities)
    ? data.cities.map((c: any) => ({
        name: c.name || c,
        country: c.country || "",
        latitude: c.latitude ?? null,
        longitude: c.longitude ?? null,
      }))
    : []
);

    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!trip) return;
    const { name, value } = e.target;
    let updatedTrip = { ...trip, [name]: value };

    if (name === "startDate" || name === "endDate") {
      const start = new Date(updatedTrip.startDate);
      const end = new Date(updatedTrip.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        updatedTrip.durationDays = diff > 0 ? diff : 0;
      }
    }

    setTrip(updatedTrip);
    setHasChanges(true); // ✅ marca cambios
  }

 

function removeCity(index: number) {
  const cityName = cities[index]?.name || "this city";
  if (!confirm(`Are you sure you want to remove ${cityName}?`)) return;

  setCities(prev => prev.filter((_, i) => i !== index));
  setCitiesWeather(prev => prev.filter((_, i) => i !== index));
  setHasChanges(true);
}

  async function handleSave() {
    if (!trip) return;

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (start > end) {
      alert("Start date cannot be later than end date.");
      return;
       
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  name: trip.name,
  startDate: trip.startDate,
  endDate: trip.endDate,
  durationDays: trip.durationDays,
  travelers: trip.travelers,
  latitude: trip.latitude,
  longitude: trip.longitude,
  description,
  cities,
}),

    
      });
      if (res.ok) {
        alert("Trip details updated successfully!");
        setHasChanges(false);
      } else {
        alert("Error saving trip data.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save trip changes.");
    } finally {
      setIsSaving(false);
    }
  }

function handleBudgetSetupComplete(totalBudget: number) {
  setBudget(totalBudget);
  setShowBudgetSetup(false);
}




  if (!trip) {
    return (
      <>
      <SessionProvider>
        <NavBar tripId={tripId}  /> 
        <main className="p-8 text-center bg-gray-50 pt-20">
          <p className="text-lg text-gray-600">Loading trip information...</p>
        </main>
        </SessionProvider>
      </>
    );
  }

  const percentage = budget ? ((spent / budget) * 100).toFixed(1) : "0";
  const remaining = (budget - spent).toFixed(2);

  



  return (
  <>
  <SessionProvider>

     {showBudgetSetup && trip && (
        <BudgetSetupWizard
          tripId={trip.id}
          onComplete={handleBudgetSetupComplete}
        />
      )}


    {/* ✅ Navbar fija arriba */}
    <NavBar tripId={tripId}  />

    {/* ✅ Contenido principal */}
    <main className="p-8 space-y-10 bg-gray-50 pt-20">
  {/* Encabezado */}
  <section className="text-center max-w-3xl mx-auto mb-12">
    <h1 className="text-3xl font-bold mb-4 text-center">
      {trip.name} — Main Overview
    </h1>
    <p className="mt-3 text-gray-600 text-lg leading-relaxed">
      Welcome to your travel journal. See your trip at a glance — key dates, destinations, and travelers, all organized in one place.
    </p>
  </section>

  {/* Contenedor principal */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
    
    {/* Datos del viaje */}
    <section className="lg:col-span-2 bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-sm border border-gray-100 space-y-6 transition hover:shadow-md">
      <h2 className="text-2xl font-semibold text-[#001e42] mb-4">
        Trip Details
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block  mb-1">Trip Name</label>
          <input
            name="name"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#DCC9A3] focus:border-transparent"
            value={trip.name} 
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block  mb-1">Travelers</label>
          <input
            name="travelers"
            type="number"
            min={1}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#DCC9A3] focus:border-transparent"
            value={trip.travelers}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block  mb-1">Start Date</label>
          <input
            name="startDate"
            type="date"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#DCC9A3] focus:border-transparent"
            value={trip.startDate?.split("T")[0] || ""}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block  mb-1">End Date</label>
          <input
            name="endDate"
            type="date"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#DCC9A3] focus:border-transparent"
            value={trip.endDate?.split("T")[0] || ""}
            onChange={handleChange}
          />
        </div>

<div>
          <label className="block  mb-1">Latitude</label>
          <input
            name="latitude"
            type="number"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#DCC9A3] focus:border-transparent"
            value={trip.latitude}
            onChange={handleChange}
          />
        </div>
<div>
                  <label className="block  mb-1">Longitude</label>
          <input
            name="longitude"
            type="number"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#DCC9A3] focus:border-transparent"
            value={trip.longitude}
            onChange={handleChange}
          />
        </div>
     <div>
          <label className="block  mb-1">Total Budget (€)</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100"
            value={budget.toFixed(2)}
            readOnly
          />
        </div>
            <div>
          <label className="block   mb-1">Remaining Budget (€)</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100"
            value={remaining}
            readOnly
          />
        </div>

            <div>
          <label className="block  mb-1">Spent So Far (€)</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100"
            value={spent.toFixed(2)}
            readOnly
          />
        </div>

        <div>
          <label className="block  mb-1">Spent (%)</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100"
            value={percentage}
            readOnly
          />
        </div>

            <div>
          <label className="block  mb-1">Duration (days)</label>
          <input
            name="durationDays"
            type="number"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100"
            value={trip.durationDays}
            readOnly
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between mt-8 gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-[#001e42] text-white py-2.5 rounded-lg hover:bg-[#DCC9A3] transition disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
        <button
              onClick={() => router.push(`/${locale}/dashboard`)}


          className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg hover:bg-gray-300 transition"
        >
          ← Back to Dashboard
        </button>
      </div>
    </section>

{/* Accesos rápidos */}
    <aside className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-100 h-fit space-y-4 transition hover:shadow-md">
      <h3 className="text-xl font-semibold text-[#001e42] mb-3">Quick Access</h3>
      <ul className="space-y-3">
        {[
          { href: "budget", icon: "💰", text: "Budget Planning" },

          { href: "reservations", icon: "✈️", text: "Reservations Tracker" },

          { href: "expenses", icon: "💳", text: "Expense Log" },
         ].map((item) => (
          <li key={item.href}>
            <a
              href={`/${locale}/dashboard/trip/${tripId}/${item.href}`}
              className="block w-full text-center bg-[#001e42] text-white px-4 py-2.5 rounded-lg hover:bg-[#DCC9A3] transition"
            >
              {item.icon} {item.text}
            </a>
          </li>
        ))}
      </ul>
       {/*{ href: "itinerary", icon: "🗓️", text: "Trip Itinerary" },
          { href: "checklist", icon: "🧾", text: "Travel Checklist" },
           */}
    </aside>
</div>

{/*
<section className="w-full bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-sm border border-gray-100 space-y-6 mt-8">
  <h2 className="text-2xl font-semibold text-[#001e42] mb-4">Trip Info</h2>
*/}
  {/* Descripción */}
  {/*
  <div>
    <label className="block mb-1">Brief Description</label>
    <textarea
    placeholder="Description of the Trip..."
      className="w-full border border-gray-200  rounded-lg p-3 focus:ring-2 focus:ring-[#DCC9A3]"
      value={description}
      onChange={(e) => {
  setDescription(e.target.value);
  setHasChanges(true);
}}
      
    />
  </div>
  */}

  {/* Clima principal (pais del viaje) */}
  {/*
  <div className="mt-4">
    <h3 className="font-semibold mb-2">Main Destination Weather</h3>
    <div className="p-4 bg-white rounded-lg shadow-sm">
      
      {mainWeather ? (
  <>
  
    <p>
      {mainWeather.temp}°C | {mainWeather.tempMin}°C
    </p>

    <p className="capitalize">
      {mainWeather.desc}
    </p>
  </>
) : (
  <p>No coordinates found for this trip.</p>
)}

    </div>
  </div>
  */}

  {/* Ciudades adicionales */}
  {/*
  <div className="mt-4">
    <label className="block mb-2">Add Cities to Track Weather</label>
    <div className="flex gap-2 mb-3">
      <div className="relative flex-1">
        
  <input
    type="text"
    placeholder="Rome"
    value={cityInput}
    onChange={(e) => {
      setCityInput(e.target.value);
      debounce(() => fetchCitySuggestions(e.target.value));
    }}
    onFocus={() => cityInput && setShowSuggestions(true)}
    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
    className="border p-2  border-gray-200 rounded-lg w-full"
  />

*/}
{/*
  {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 bg-white border rounded-lg shadow-md w-full mt-1 max-h-40 overflow-y-auto">
      {suggestions.map((c, i) => (
        <li
          key={i}
          onClick={() => {
            addCity(c.name);
            setCityInput("");
            setSuggestions([]);
          }}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
        >
          {c.name}
        </li>
      ))}
    </ul>
  )}
</div>


      <button
        type="button"
        
        onClick={() => { addCity(cityInput); setCityInput(""); }}
      className="bg-[#001e42] text-white px-6 py-2 rounded-lg hover:bg-[#DCC9A3] transition"
          >
            + Add City
      </button>
    </div>
    
  </div>
</section>
*/}
{/*
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {citiesWeather.map((c, i) => (
  <div key={i} className="p-4 bg-white rounded-lg shadow-sm relative">
    <button
      onClick={() => removeCity(i)}
      className="absolute top-3 right-4 text-red-500 hover:text-red-700 transition opacity-80 group-hover:opacity-100"
      title="Remove city"
    >
      ✕
    </button>
    <h4 className="font-semibold">{c.city}</h4>
    <p>{c.temp}°C | {c.tempMin}°C</p>
    <p className="capitalize">{c.desc}</p>
  </div>
))}
    </div>

*/}

    
  
</main>
</SessionProvider>
  </>
);

}
