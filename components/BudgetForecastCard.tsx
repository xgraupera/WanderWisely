// components/BudgetForecastCard.tsx
"use client";

import { AlertTriangle, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  forecast: any;
  totalBudget: number;
  tripId: number;
}

export default function BudgetForecastCard({ forecast, totalBudget, tripId }: Props) {
   
  if (!forecast) return null;

  const { categories, totalForecast, alerts } = forecast;

  const [access, setAccess] = useState<{premium:boolean, tripPaid:boolean}>();

  const unlockTrip = async () => {
  const res = await fetch("/api/pay/trip", {
    method: "POST",
    body: JSON.stringify({ tripId }),
  });
  const { url } = await res.json();
  window.location.href = url;
};

const goPremium = async () => {
  const res = await fetch("/api/pay/subscription", { method: "POST" });
  const { url } = await res.json();
  window.location.href = url;
};


useEffect(() => {
  fetch(`/api/trip-access?tripId=${tripId}`)
    .then(r => r.json())
    .then(setAccess);
}, []);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-[#001e42]" />
        Budget Forecast
      </h2>

      {/* TOTAL SUMMARY */}
      <div className=" gap-4 text-sm">
        

        <div
          className={`p-3 rounded-lg ${
            totalForecast > totalBudget
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          <p className="text-gray-500">Forecast of Total Budget</p>
          <p className="text-lg font-semibold">{totalForecast.toFixed(2)} €</p>
          
        </div>
        
      </div>
      <p className="text-sm">
        { totalBudget-totalForecast < 0
          ? `⚠️ You are expected to exceed your budget by ${totalForecast-totalBudget} €`
          : "✅ You are on track with your budget"}
      </p>

      {totalForecast == 0 && (
        <div >
      
            <p className="text-gray-600">
              💡 Tip: Start adding planned costs in <b>Reservations</b> and real expenses
              in <b>Expenses</b> to get accurate alerts.
              Also, don't forget to check the paied reservations to add them as an expense!
            </p>
            
      
        </div>
      )}


{alerts.length > 0 && !access?.premium && !access?.tripPaid && (
  <div className="border-l-4 border-red-600 pl-4 space-y-3">
    <p className="font-semibold text-red-600 mb-1 font-semibold text-red-600 flex items-center gap-2">
      🔒 Budget alerts are locked
    </p>

    <button
      onClick={unlockTrip}
      className="w-full flex-1 bg-[#001e42] text-white py-2.5 rounded-lg hover:bg-[#DCC9A3] transition disabled:opacity-60"
      
    >
      Unlock alerts for this trip
    </button>

    <button
      onClick={goPremium}
      className="w-full flex-1 bg-[#001e42] text-white py-2.5 rounded-lg hover:bg-[#DCC9A3] transition disabled:opacity-60"
    >
      Go Premium (monthly)
    </button>
  </div>
)}


      {/* ALERTS */}
      {alerts.length > 0 && (access?.premium || access?.tripPaid) && (
        <div className="border-l-4 border-red-600 pl-4">
          <h3 className="font-semibold text-red-600 mb-1 font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Budget Alerts
          </h3>
          <ul className="text-sm text-red-600 list-disc pl-5 space-y-1">
            {alerts.map((a: string, i: number) => (
              <li key={i}> {a}</li>
            ))}
          </ul>
        </div>
      )}

{/* 
  {Recomendations.length > 0 && (
        <div className="border-l-4 border-yellow-500 pl-4">
          <p className="font-semibold text-yellow-600 mb-1">
            Daily spending suggestions
          </p>
          <ul className="text-sm text-yellow-600 list-disc pl-5 space-y-1">
            {Recomendations.map((a: string, i: number) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      */}
      {/* CATEGORY FORECAST LIST */}
        {/* 
      <div className="space-y-2 text-sm">
        {categories.map((c: any) => (
          <div
            key={c.category}
            className="flex justify-between border-b py-2"
          >
            <span className="font-medium">{c.category}</span>
            <span
              className={
                c.alert ? "text-red-600 font-semibold" : "text-gray-700"
              }
            >
              {c.forecast.toFixed(2)} € / {c.budget.toFixed(2)} €
            </span>
          </div>
        ))}
      </div>
      */}
    </div>
  );
}
