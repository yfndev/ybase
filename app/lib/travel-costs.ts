import type { Doc } from "@/convex/_generated/dataModel";

export type CostType = NonNullable<Doc<"receipts">["costType"]>;

export const COST_LABELS: Record<CostType, string> = {
  car: "PKW",
  train: "Bahn",
  flight: "Flug",
  taxi: "Taxi",
  bus: "Bus",
  accommodation: "Unterkunft",
};

export const DEFAULT_TAX_RATES: Record<CostType, number> = {
  car: 0,
  train: 7,
  flight: 19,
  taxi: 7,
  bus: 7,
  accommodation: 7,
};

export const COST_TYPES = Object.keys(COST_LABELS) as CostType[];

export const CAR_ALLOWANCE_RATE_EUR_PER_KM = 0.30;

export const MEAL_ALLOWANCE_PARTIAL_DAY_EUR = 14;
export const MEAL_ALLOWANCE_FULL_DAY_EUR = 28;
