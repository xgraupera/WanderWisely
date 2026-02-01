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

  function resetMainCategories() {
    setMainCategories(MAIN_CATEGORIES.map(c => ({ ...c, value: 0 })));
  }

  function resetExtraCategories() {
    setExtraCategories(EXTRA_CATEGORIES.map(c => ({ ...c, value: 0 })));
  }

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

        <p className="text-sm text-gray-400 text-center">
          Step {step} of 5
        </p>

        {/* STEP 1 INTRO */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold text-center">💰 Welcome to Tripilot</h2>
            <p className="text-gray-600 text-justify">
              We’ll be your tip financial copilot to help you avoid overspending on the go.
            </p>

            <button
              className="w-full bg-[#001e42] text-white py-2.5 rounded-lg"
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </>
        )}

        {/* STEP 2 TUTORIAL */}
        {step === 2 && (
          <>
            <h2 className="text-xl font-semibold text-center">🔮 How the Forecast works</h2>

            <ul className="space-y-3 text-sm text-gray-600 text-justify">
              <li><b>Budget Forecast</b> predicts your final trip cost based on your current spending pace.</li>
              <li>• Add <b>Reservations</b> for prepaid costs. Check them as confirmed, when you pay the reservation so it becomes a real expense.</li>
              <li>• Add <b>Expenses</b> during the trip for daily spending.</li>
             
            </ul>

            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <p className="font-medium mb-2 text-justify">Expenses Category Types:</p>
              <p>• Fixed → prepaid before trip (flights, documentation...)</p>
              <p>• Mixed → some prepaid + some daily (activities, transport...)</p>
              <p>• Variable → only daily spending (meals...)</p>
            </div>

            <button
              className="w-full bg-[#001e42] text-white py-2.5 rounded-lg"
              onClick={() => setStep(3)}
            >
              Set Budgets
            </button>
          </>
        )}

        {/* STEP 3 MAIN CATEGORIES */}
        {step === 3 && (
          <>
            <h2 className="text-xl font-semibold text-center">💰 Main Budget Categories</h2>
            <p className="text-gray-500 text-sm">
              Rough estimates are enough. You can edit them later.
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

            <p className="text-sm">Estimated trip Budget: <b>{total.toFixed(2)} €</b></p>

            <div className="flex gap-3">
              <button
                className="flex-1 border py-2.5 rounded-lg"
                onClick={() => {
                  resetMainCategories();
                  setStep(4);
                }}
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

        {/* STEP 4 EXTRA */}
        {step === 4 && (
          <>
            <h2 className="text-xl font-semibold text-center">💰 Extra categories (optional)</h2>
            <p className="text-gray-500 text-sm">
              You can add or remove categories later.
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

            <p className="text-sm">Estimated trip Budget: <b>{total.toFixed(2)} €</b></p>

            <div className="flex gap-3">
              <button
                className="flex-1 border py-2.5 rounded-lg"
                onClick={() => {
                  resetExtraCategories();
                  setStep(5);
                }}
              >
                Skip
              </button>
              <button
                className="flex-1 bg-[#001e42] text-white py-2.5 rounded-lg"
                onClick={() => setStep(5)}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* STEP 5 FINISH */}
        {step === 5 && (
          <>
            <h2 className="text-2xl font-bold text-center">🎉 Budget ready </h2>
            <p className="text-gray-600 text-sm space-y-2 text-justify">
             
              <span >💡 Tip: Add <b>Reservations</b> before and <b>Expenses</b> during the trip for more accurate forecasts.</span>
              <br />
              <p className="text-gray-600 text-sm space-y-2 text-justify">You can edit Budgets and Categories anytime.</p>
            </p>
            

            <button
              disabled={saving}
              className="w-full bg-[#001e42] text-white py-2.5 rounded-lg mt-4"
              onClick={finish}
            >
              {saving ? "Saving..." : "Start Tracking"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
