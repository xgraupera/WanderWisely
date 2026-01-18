export interface ForecastInput {
  totalDays: number;
  daysElapsed: number;
  budgets: {
    category: string;
    budget: number;
    spent: number;
    type: "fixed" | "variable" | "mixed";
  }[];
}

export interface ForecastResult {
  conservative: {
    totalForecast: number;
    risk: number;
    alerts: string[];
  };
  expected: {
    totalForecast: number;
    alerts: string[];
  };
  optimistic: {
    totalForecast: number;
  };
}

export function calculateForecast(input: ForecastInput): ForecastResult {
  const { totalDays, daysElapsed, budgets } = input;

  const D_elapsed = Math.max(daysElapsed, 1);
  const D_left = Math.max(totalDays - daysElapsed, 0);

  const B_total = budgets.reduce((s, b) => s + b.budget, 0);
  const BUFFER = B_total * 0.1;

  let expectedTotal = 0;
  let conservativeTotal = 0;
  let optimisticTotal = 0;

  const alerts: string[] = [];

  budgets.forEach((b) => {
    const B = b.budget;
    const S = b.spent;
    const B_left = B - S;

    // ---------------- FIXED ----------------
    if (b.type === "fixed") {
      const forecast = Math.max(B, S);

      expectedTotal += forecast;
      conservativeTotal += forecast;
      optimisticTotal += forecast;

      if (S > B) {
        alerts.push(`${b.category}: fixed budget exceeded`);
      }
      return;
    }

    // -------- VARIABLE & MIXED (variable part) --------
    const burnRate = S / D_elapsed;

    // EXPECTED
    const expected = S + burnRate * D_left;

    // CONSERVATIVE (+15%)
    const conservative = S + burnRate * D_left * 1.15;

    // OPTIMISTIC (adjusted burn rate)
    const adjustedBurnRate = Math.min(
      B_left / Math.max(D_left, 1),
      burnRate
    );
    const optimistic = S + adjustedBurnRate * D_left;

    expectedTotal += expected;
    conservativeTotal += conservative;
    optimisticTotal += optimistic;

    // Category alert (solo variable real)
    if (burnRate > B / totalDays) {
      alerts.push(
        `${b.category}: reduce to ${adjustedBurnRate.toFixed(2)} €/day`
      );
    }
  });

  // -------- GLOBAL ALERTS --------
  if (expectedTotal > B_total - BUFFER) {
    alerts.push("Expected forecast exceeds safety buffer");
  }

  if (conservativeTotal > B_total) {
    alerts.push("Conservative forecast exceeds total budget");
  }

  return {
    conservative: {
      totalForecast: Math.round(conservativeTotal),
      risk: Math.round(conservativeTotal - B_total),
      alerts,
    },
    expected: {
      totalForecast: Math.round(expectedTotal),
      alerts,
    },
    optimistic: {
      totalForecast: Math.round(optimisticTotal),
    },
  };
}
