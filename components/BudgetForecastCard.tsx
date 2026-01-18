"use client";

import { ForecastResult } from "@/lib/forecast/budgetForecast";

interface Props {
  forecast: ForecastResult;
  totalBudget: number;
}

export default function BudgetForecastCard({
  forecast,
  totalBudget,
}: Props) {
  const isExpectedRisk = forecast.expected.totalForecast > totalBudget;
  const isConservativeRisk =
    forecast.conservative.totalForecast > totalBudget;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md space-y-5">
      <h3 className="text-xl font-semibold text-[#001e42]">
        Budget Forecast
      </h3>

      {/* EXPECTED = referencia principal */}
      <div
        className={`border-l-4 pl-4 ${
          isExpectedRisk ? "border-red-500" : "border-green-500"
        }`}
      >
        <p className="font-semibold">Expected outcome</p>
        <p className="text-lg">
          {forecast.expected.totalForecast} €
        </p>
        <p className="text-sm text-gray-600">
          {isExpectedRisk
            ? "⚠️ At this pace, you will exceed your budget"
            : "✅ You are on track"}
        </p>
      </div>

      {/* CONSERVATIVE: solo si hay riesgo */}
      {isConservativeRisk && (
        <div className="border-l-4 border-red-600 pl-4">
          <p className="font-semibold text-red-600">
            Worst case scenario
          </p>
          <p>{forecast.conservative.totalForecast} €</p>
          <p className="text-sm text-red-600">
            Risk: +{forecast.conservative.risk} €
          </p>
        </div>
      )}

      {/* OPTIMISTIC: informativo */}
      <div className="border-l-4 border-blue-400 pl-4">
        <p className="font-semibold">If you adjust spending</p>
        <p>{forecast.optimistic.totalForecast} €</p>
      </div>

      {/* ALERTS */}
      {forecast.conservative.alerts.length > 0 && (
        <div>
          <p className="font-semibold text-red-600 mb-1">
            What you should do
          </p>
          <ul className="text-sm text-red-600 list-disc pl-5 space-y-1">
            {forecast.conservative.alerts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
