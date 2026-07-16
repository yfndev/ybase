"use client";

import {
  COST_TYPES,
  type CostType,
  COST_LABELS as LABELS,
} from "@/lib/travel-costs";
import { CostTypeSelector } from "../CostTypeSelector";
import { OvernightAllowanceSection } from "../OvernightAllowanceSection";
import { MealAllowanceSection } from "./MealAllowanceSection";
import { ReceiptCard } from "./ReceiptCard";
import type { Receipt, Travel } from "./types";

interface Props {
  receipts: Receipt[];
  hasReceipt: (type: CostType) => boolean;
  toggleType: (type: CostType) => void;
  updateReceipt: (type: CostType, updates: Partial<Receipt>) => void;
  travel: Travel;
  update: (field: Partial<Travel>) => void;
  showMealAllowance: boolean;
  setShowMealAllowance: (value: boolean) => void;
  mealTotal: number;
  showOvernightAllowance: boolean;
  setShowOvernightAllowance: (value: boolean) => void;
  overnightTotal: number;
  organizationName: string;
}

export function ReceiptsSection({
  receipts,
  hasReceipt,
  toggleType,
  updateReceipt,
  travel,
  update,
  showMealAllowance,
  setShowMealAllowance,
  mealTotal,
  showOvernightAllowance,
  setShowOvernightAllowance,
  overnightTotal,
  organizationName,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-3">Kostenarten auswählen</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Wähle alle Kostenarten aus, die du geltend machen möchtest.
        </p>
        <CostTypeSelector
          costTypes={COST_TYPES}
          labels={LABELS}
          isSelected={hasReceipt}
          onToggle={toggleType}
        />
      </div>

      {receipts.map((receipt) => (
        <ReceiptCard
          key={receipt.costType}
          receipt={receipt}
          toggleType={toggleType}
          updateReceipt={updateReceipt}
          organizationName={organizationName}
        />
      ))}

      <MealAllowanceSection
        allowance={travel.mealAllowance}
        isInternational={travel.isInternational}
        onAllowanceChange={(mealAllowance) => update({ mealAllowance })}
        showMealAllowance={showMealAllowance}
        setShowMealAllowance={setShowMealAllowance}
        mealTotal={mealTotal}
      />

      <OvernightAllowanceSection
        enabled={showOvernightAllowance}
        isInternational={travel.isInternational}
        nights={travel.overnightAllowanceNights}
        rate={travel.overnightAllowanceRate}
        total={overnightTotal}
        onEnabledChange={setShowOvernightAllowance}
        onNightsChange={(overnightAllowanceNights) =>
          update({ overnightAllowanceNights })
        }
        onRateChange={(overnightAllowanceRate) =>
          update({ overnightAllowanceRate })
        }
      />
    </div>
  );
}
