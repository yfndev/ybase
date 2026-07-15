export type CostType =
  | "car"
  | "train"
  | "flight"
  | "taxi"
  | "bus"
  | "accommodation"
  | "incidental";

export type MealAllowanceLine = { days: number; rate: number };

export type MealAllowance = {
  singleDay: MealAllowanceLine;
  arrivalDay: MealAllowanceLine;
  fullDay: MealAllowanceLine;
  departureDay: MealAllowanceLine;
};
