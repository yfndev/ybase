"use client";

import { CostTypeSelector } from "@/components/Reimbursements/CostTypeSelector";
import { COST_TYPES } from "@/lib/travel-costs";
import { TravelReceiptCard } from "./TravelReceiptCard";
import type { CostType, TravelReceipt } from "./types";

type Props = {
  organizationName: string;
  travelReceipts: TravelReceipt[];
  costLabels: Record<CostType, string>;
  onToggleCostType: (costType: CostType) => void;
  onUpdateTravelReceipt: (
    costType: CostType,
    updates: Partial<TravelReceipt>,
  ) => void;
  toNet: (gross: number, tax: number) => number;
  generateUploadUrl: (
    contentType: string,
  ) => Promise<{ key: string; url: string }>;
  getFileUrl: (key: string) => Promise<string | null>;
};

export function TravelCostsSection(props: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Kostenarten</h2>
      <p className="text-sm text-muted-foreground">
        Wähle alle Kostenarten aus, die du geltend machen möchtest.
      </p>
      <CostTypeSelector
        costTypes={COST_TYPES}
        labels={props.costLabels}
        isSelected={(costType) =>
          props.travelReceipts.some((receipt) => receipt.costType === costType)
        }
        onToggle={props.onToggleCostType}
      />

      {props.travelReceipts.map((receipt) => (
        <TravelReceiptCard
          key={receipt.costType}
          receipt={receipt}
          costLabels={props.costLabels}
          onRemove={() => props.onToggleCostType(receipt.costType)}
          onUpdate={(updates) =>
            props.onUpdateTravelReceipt(receipt.costType, updates)
          }
          toNet={props.toNet}
          generateUploadUrl={props.generateUploadUrl}
          getFileUrl={props.getFileUrl}
          organizationName={props.organizationName}
        />
      ))}
    </div>
  );
}
