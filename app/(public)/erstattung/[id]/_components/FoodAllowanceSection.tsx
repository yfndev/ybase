"use client";

import { MealAllowanceSection } from "@/components/Reimbursements/travelForm/MealAllowanceSection";
import type { MealAllowance } from "@/lib/db/types";

type Props = {
  allowance: MealAllowance;
  isInternational: boolean;
  showFoodAllowance: boolean;
  onShowFoodAllowanceChange: (value: boolean) => void;
  mealTotal: number;
  onAllowanceChange: (value: MealAllowance) => void;
};

export function FoodAllowanceSection(props: Props) {
  return (
    <MealAllowanceSection
      allowance={props.allowance}
      isInternational={props.isInternational}
      onAllowanceChange={props.onAllowanceChange}
      showMealAllowance={props.showFoodAllowance}
      setShowMealAllowance={props.onShowFoodAllowanceChange}
      mealTotal={props.mealTotal}
    />
  );
}
