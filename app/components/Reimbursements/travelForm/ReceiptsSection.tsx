"use client";

import {
  COST_TYPES,
  type CostType,
  COST_LABELS as LABELS,
} from "@/lib/travel-costs";
import { getTravelReceiptLabel } from "@/lib/travelReceiptForm";
import { CostTypeSelector } from "../CostTypeSelector";
import { OvernightAllowanceSection } from "../OvernightAllowanceSection";
import { MealAllowanceSection } from "./MealAllowanceSection";
import { ReceiptCard } from "./ReceiptCard";
import type { Receipt, Travel } from "./types";

interface Props {
  receipts: Receipt[];
  addReceipt: (type: CostType) => void;
  removeReceipt: (clientId: string) => void;
  updateReceipt: (clientId: string, updates: Partial<Receipt>) => void;
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
  addReceipt,
  removeReceipt,
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
        <h2 className="text-lg font-medium mb-3">
          Kostenpositionen hinzufügen
        </h2>
        <p className="text-sm text-muted-foreground mb-2">
          Wähle eine Kostenart, um eine Position hinzuzufügen.
        </p>
        <CostTypeSelector
          costTypes={COST_TYPES}
          labels={LABELS}
          isSelected={(type) =>
            receipts.some((receipt) => receipt.costType === type)
          }
          onSelect={addReceipt}
          getAccessibleLabel={(type) => `${LABELS[type]} hinzufügen`}
        />
      </div>

      {receipts.map((receipt, index) => (
        <ReceiptCard
          key={receipt.clientId}
          receipt={receipt}
          title={getTravelReceiptLabel(receipts, index, LABELS)}
          onRemove={() => removeReceipt(receipt.clientId)}
          onUpdate={(updates) => updateReceipt(receipt.clientId, updates)}
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
