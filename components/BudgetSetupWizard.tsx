"use client";

import { useEffect, useState } from "react";

interface Props {
  tripId: number;
  onComplete: (totalBudget: number) => void;
}

const MAIN_CATEGORIES = [
  { key: "Flights", label: "Flights ✈️" },
  { key: "Accommodation", label: "Accommodation 🏨" },
  { key: "Meals", label: "Meals 🍽️" },
  { key: "Activities", label: "Activities 🎟️" },
  { key: "Transport", label: "Transport 🚆" },
  { key: "Others", label: "Others 📦" },
];

const EXTRA_CATEGORIES = [
  { key: "Health", label: "Health 🏥" },
  { key: "Documentation", label: "Documentation 📄" },
  { key: "Technology", label: "Technology / SIM 📱" },
];

export default function BudgetSetupWizard({ tripId, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [total, setTotal] = useState(0);
  const [saving, setSaving] = useState(false);

  const [mainCategories, setMainCategories] = useState(
    MAIN_CATEGORIES.map(c => ({ ...c, value: 0 }))
  );

  const [extraCategories, setExtraCategories] = useState(
    EXTRA_CATEGORIES.map(c => ({ ...c, value: 0 }))
  );

  // 🔹 Autocalcular total
  useEffect(() => {
    const sum = [...mainCategories, ...extraCategories].reduce(
      (acc, c) => acc + (Number(c.value) || 0),
      0
    );
    setTotal(sum);
  }, [mainCategories, extraCategories]);

  function updateMainCategory(index: number, value: number) {
    setMainCategories(prev =>
      prev.map((c, i) => (i === index ? { ...c, value } : c))
    );
  }

  function updateExtraCategory(index: number, value: number) {
    setExtraCategories(prev =>
      prev.map((c, i) => (i === index ? { ...c, value } : c))
    );
  }

  async function finish() {
    setSaving(true);

    await fetch("/api/budget/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripId,
        total,
        categories: [...mainCategories, ...extraCategories],
      }),
    });

    onComplete(total);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 w-full max-w-xl space-y-6 animate-fadeIn">

        {/* Progreso */}
        <p className="text-sm text-gray-400 text-center">
          Step {step} of 4
        </p>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold">Set up your trip budget 💰</h2>
            <p className="text-gray-600">
              This helps us give you accurate alerts and spending forecasts.
              You can change everything later.
            </p>
            <button
              className="w-full bg-[#001e42] text-white py-2.5 rounded-lg"
              onClick={() => setStep(2)}
            >
              Start
            </button>
          </>
        )}

        {/* STEP 2 – Main categories */}
        {step === 2 && (
          <>
            <h2 className="text-xl font-semibold">Budget by category</h2>
            <p className="text-gray-500 text-sm">
              Roughly split your budget to get better insights and alerts.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {mainCategories.map((c, i) => (
                <div key={c.key}>
                  <label className="block text-sm mb-1">{c.label}</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg p-2"
                    value={c.value || ""}
                    onChange={(e) =>
                      updateMainCategory(i, Number(e.target.value) || 0)
                    }
                  />
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-600">
              Estimated total: <b>{total.toFixed(2)} €</b>
            </p>

            <div className="flex gap-3">
              <button
                className="flex-1 border border-gray-300 py-2.5 rounded-lg"
                onClick={() => setStep(3)}
              >
                Skip
              </button>
              <button
                className="flex-1 bg-[#001e42] text-white py-2.5 rounded-lg"
                onClick={() => setStep(3)}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* STEP 3 – Extra categories */}
        {step === 3 && (
          <>
            <h2 className="text-xl font-semibold">Extra categories (optional)</h2>
            <p className="text-gray-500 text-sm">
              These are often forgotten, but they add up.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {extraCategories.map((c, i) => (
                <div key={c.key}>
                  <label className="block text-sm mb-1">{c.label}</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg p-2"
                    value={c.value || ""}
                    onChange={(e) =>
                      updateExtraCategory(i, Number(e.target.value) || 0)
                    }
                  />
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-600">
              Estimated total: <b>{total.toFixed(2)} €</b>
            </p>

            <div className="flex gap-3">
              <button
                className="flex-1 border border-gray-300 py-2.5 rounded-lg"
                onClick={() => setStep(4)}
              >
                Skip
              </button>
              <button
                className="flex-1 bg-[#001e42] text-white py-2.5 rounded-lg"
                onClick={() => setStep(4)}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* STEP 4 – Finish */}
        {step === 4 && (
          <>
            <h2 className="text-2xl font-bold">Your initial budget has been set</h2>
            <p className="text-gray-600">
              💡 Tip: Add planned costs in <b>Reservations</b> and real expenses
              in <b>Expenses</b> to get accurate alerts.
            </p>

            <button
              disabled={saving}
              className="w-full bg-[#001e42] text-white py-2.5 rounded-lg mt-4 disabled:opacity-60"
              onClick={finish}
            >
              {saving ? "Saving..." : "Finish setup"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
