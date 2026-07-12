"use client";

import { Button } from "@/components/ui/button";
import {
  COST_TYPES,
  type CostType,
  COST_LABELS as LABELS,
} from "@/lib/travel-costs";
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
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-3">Kostenarten auswählen</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Wähle alle Kostenarten aus, für die du Belege einreichen möchtest.
        </p>
        <div className="flex flex-wrap gap-2">
          {COST_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              variant={hasReceipt(type) ? "primary" : "outline"}
              aria-pressed={hasReceipt(type)}
              onClick={() => toggleType(type)}
            >
              {LABELS[type]}
            </Button>
          ))}
        </div>
      </div>

      {receipts.map((receipt) => (
        <ReceiptCard
          key={receipt.costType}
          receipt={receipt}
          toggleType={toggleType}
          updateReceipt={updateReceipt}
        />
      ))}

      <MealAllowanceSection
        travel={travel}
        update={update}
        showMealAllowance={showMealAllowance}
        setShowMealAllowance={setShowMealAllowance}
        mealTotal={mealTotal}
      />
    </div>
  );
}
