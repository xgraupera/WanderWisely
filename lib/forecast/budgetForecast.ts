// lib/forecast/budgetForecast.ts

export type BudgetCategory = {
  category: string;
  budget: number;
  spent: number;
  planned: number; // confirmed reservations
  reservations: any[]; // all reservations
  type: "fixed" | "variable" | "mixed";
};

export type CategoryForecast = {
  category: string;
  budget: number;
  spent: number;
  planned: number;
  fixedPart: number;
  variablePart: number;
  forecast: number;
  overForecast: number;
  alert: boolean;
  dailyAllowance?: number; // ✅ NUEVO
};

export type BudgetForecastResult = {
  categories: CategoryForecast[];
  totalForecast: number;
  totalBudget: number;
  alerts: string[];
};

export function calculateForecast(params: {
  budgets: BudgetCategory[];
  totalDays: number;
  daysElapsed: number;
}): BudgetForecastResult {
  const { budgets, totalDays, daysElapsed } = params;

  const categories: CategoryForecast[] = [];
  const alerts: string[] = [];

  let totalForecast = 0;
  let totalBudget = 0;

  const daysLeft = Math.max(totalDays - daysElapsed, 1);

  for (const b of budgets) {
    const budget = b.budget || 0;
    const spent = b.spent || 0;
    const planned = b.planned || 0;
    const reservations = b.reservations || [];

if (budget === 0) {
  const fixedTotal = reservations.reduce((s, r) => s + r.amount, 0);

  if (spent > 0 || fixedTotal > 0) {
    alerts.push(
      `${b.category} has expenses or reservations but no budget defined`
    );
  }

  categories.push({
    category: b.category,
    budget,
    spent,
    planned,
    fixedPart: fixedTotal,
    variablePart: 0,
    forecast: spent + fixedTotal,
    overForecast: spent + fixedTotal,
    alert: spent + fixedTotal > 0,
  });

  totalForecast += spent + fixedTotal;
  continue;
}
 
let dailyAllowance: number | undefined = undefined;

    // =============================
    // FIXED PART (all reservations)
    // =============================
    const fixedConfirmed = reservations
      .filter((r) => r.confirmed)
      .reduce((s, r) => s + r.amount, 0);

    const fixedUnconfirmed = reservations
      .filter((r) => !r.confirmed)
      .reduce((s, r) => s + r.amount, 0);

    const fixedPart = fixedConfirmed + fixedUnconfirmed;

    // VARIABLE PART = rest of budget
    const variablePart = Math.max(0, budget - fixedPart);

    // =============================
    // Forecast
    // =============================
    
    // Default forecast = full budget (if no activity yet)
let forecast = budget;

// If there is any spending or reservations, calculate real forecast


    const overForecast = Math.max(0, forecast - budget);
    const alert = forecast > budget;

    
    totalBudget += budget;

    // =============================
    // ALERT: FIXED reservations exceed budget
    // =============================
    if (fixedPart > budget) {
      alerts.push(
        `Reservations exceed the ${b.category} budget by ${(fixedPart - budget).toFixed(2)} €`
      );
    }

    // =============================
    // FIXED CATEGORY LOGIC
    // =============================
    if (b.type === "fixed") {

        if (spent > 0 || fixedUnconfirmed > 0 || fixedConfirmed > 0) {
  forecast = spent + fixedUnconfirmed;
}

      if (alert) {
        alerts.push(
          `You must reduce ${b.category} costs by ${overForecast.toFixed(2)} € to meet the budget`
        );
      }

   
    }

    // =============================
    // VARIABLE CATEGORY LOGIC
    // =============================
    if (b.type === "variable") {
      const remainingBudget = budget - spent;
      const expectedDaily = budget / totalDays;
      const currentDaily = spent / Math.max(daysElapsed, 1);

      

if (remainingBudget > 0) {
  dailyAllowance = remainingBudget / daysLeft;
}


  if (spent > 0) {
    const projected = (spent / Math.max(daysElapsed, 1)) * totalDays;
    forecast = projected;
  }


const reduce = (remainingBudget) / daysLeft;

      if (currentDaily > expectedDaily  && reduce > 0 ) {
        
        alerts.push(
          `You must reduce ${b.category} spending by ${reduce.toFixed(2)} € per day`
        );
      }
  if (reduce <= 0) {
  alerts.push(
    `${b.category}: variable spending exceeded budget by ${Math.abs(spent).toFixed(2)} €. Consider increasing the budget or reallocating from other categories`
  );
}
      
    }

    // =============================
    // MIXED CATEGORY LOGIC (REAL)
    // =============================

if (b.type === "mixed") {
  const fixedConfirmed = (b.reservations || [])
    .filter((r) => r.confirmed)
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const fixedUnconfirmed = (b.reservations || [])
    .filter((r) => !r.confirmed)
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const fixedTotal = fixedConfirmed + fixedUnconfirmed;

  // ✅ Gasto que pertenece a la parte variable
  let variableSpent = spent;
  // Si hay confirmed fixed, restamos solo lo que ya se gastó en fixed
  if (fixedConfirmed > 0) variableSpent = Math.max(0, spent - fixedConfirmed);

  const variableBudget = Math.max(0, budget - fixedTotal);
  const variableRemaining = variableBudget - variableSpent;
  const daysLeft = Math.max(totalDays - daysElapsed, 1);

if (spent > 0) {
    const projectedVariable = (spent / Math.max(daysElapsed, 1)) * totalDays;
    forecast = fixedTotal + projectedVariable;
  } else {
    // no variable spending yet
    forecast = fixedTotal;
  }

if (variableRemaining > 0) {
  dailyAllowance = variableRemaining / daysLeft;
}

  if (fixedTotal > budget) {
    alerts.push(
      `${b.category}: fixed bookings exceed budget by ${(fixedTotal - budget).toFixed(2)} €`
    );
  }




 const expectedDaily = variableBudget / totalDays;
      const currentDaily = variableSpent / Math.max(daysElapsed, 1);


  if (variableRemaining <= 0) {
  // ❌ Te pasaste del presupuesto
  alerts.push(
    `${b.category}: variable spending exceeded budget by ${Math.abs(variableRemaining).toFixed(2)} €. Consider increasing the budget or reallocating from other categories`
  );
} 
else if (variableRemaining > 0 && currentDaily > expectedDaily) {
  // ⚠️ Vas demasiado rápido
  const dailyAllowance = variableRemaining / daysLeft;
  alerts.push(
    `${b.category}: you can spend up to ${dailyAllowance.toFixed(2)} € per day`
  );
}


  {/*
    else if (variableRemaining > 0) {
    // Solo mostrar daily allowance si queda presupuesto
    const dailyAllowance = variableRemaining / daysLeft;
    alerts.push(
    `${b.category}: variable spending exceeded budget by ${Math.abs(variableRemaining).toFixed(2)} €`
      `${b.category}: you can spend up to ${dailyAllowance.toFixed(2)} € per day`
    );
  }
    */}
}



totalForecast += forecast;
  

    categories.push({
      category: b.category,
      budget,
      spent,
      planned,
      fixedPart,
      variablePart,
      forecast,
      overForecast,
      alert,
      dailyAllowance, // ✅
    });
  }

  return {
    categories,
    totalForecast,
    totalBudget,
    alerts,
  };
}
