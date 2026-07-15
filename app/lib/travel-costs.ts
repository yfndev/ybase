import type { CostType, MealAllowance } from "@/lib/db/types";

export type { CostType };

export const COST_LABELS: Record<CostType, string> = {
  car: "PKW",
  train: "Bahn",
  flight: "Flug",
  taxi: "Taxi",
  bus: "Bus",
  accommodation: "Unterkunft",
  incidental: "Reise-Nebenkosten",
};

export const DEFAULT_TAX_RATES: Record<CostType, number> = {
  car: 0,
  train: 7,
  flight: 19,
  taxi: 7,
  bus: 7,
  accommodation: 7,
  incidental: 19,
};

export const COST_TYPES = Object.keys(COST_LABELS) as CostType[];

export const CAR_ALLOWANCE_RATE_EUR_PER_KM = 0.3;

export const MEAL_ALLOWANCE_PARTIAL_DAY_EUR = 14;
export const MEAL_ALLOWANCE_FULL_DAY_EUR = 28;
export const OVERNIGHT_ALLOWANCE_EUR = 20;

export function createMealAllowance(isInternational = false): MealAllowance {
  return {
    singleDay: { days: 0, rate: isInternational ? 0 : 14 },
    arrivalDay: { days: 0, rate: isInternational ? 0 : 14 },
    fullDay: { days: 0, rate: isInternational ? 0 : 28 },
    departureDay: { days: 0, rate: isInternational ? 0 : 14 },
  };
}

export function changeMealAllowanceCountry(
  allowance: MealAllowance,
  isInternational: boolean,
): MealAllowance {
  const rates = createMealAllowance(isInternational);
  return {
    singleDay: { ...rates.singleDay, days: allowance.singleDay.days },
    arrivalDay: { ...rates.arrivalDay, days: allowance.arrivalDay.days },
    fullDay: { ...rates.fullDay, days: allowance.fullDay.days },
    departureDay: { ...rates.departureDay, days: allowance.departureDay.days },
  };
}

export function getMealAllowanceTotal(allowance?: MealAllowance): number {
  if (!allowance) return 0;
  return Object.values(allowance).reduce(
    (sum, line) => sum + line.days * line.rate,
    0,
  );
}

export function getMealAllowanceWithLegacyFallback(input: {
  mealAllowance?: MealAllowance;
  mealAllowanceDays?: number;
  mealAllowanceDailyBudget?: number;
  isInternational?: boolean;
}): MealAllowance {
  if (input.mealAllowance) return input.mealAllowance;
  const result = createMealAllowance(input.isInternational);
  const days = input.mealAllowanceDays ?? 0;
  const rate = input.mealAllowanceDailyBudget ?? 0;
  if (days <= 0 || rate <= 0) return result;

  const target = rate === MEAL_ALLOWANCE_FULL_DAY_EUR ? "fullDay" : "singleDay";
  result[target] = { days, rate };
  return result;
}
