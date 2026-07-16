"use client";

import { CostTypeSelector } from "@/components/Reimbursements/CostTypeSelector";
import { COST_TYPES } from "@/lib/travel-costs";
import { getTravelReceiptLabel } from "@/lib/travelReceiptForm";
import { TravelReceiptCard } from "./TravelReceiptCard";
import type { CostType, TravelReceipt } from "./types";

type Props = {
  organizationName: string;
  travelReceipts: TravelReceipt[];
  costLabels: Record<CostType, string>;
  onAddTravelReceipt: (costType: CostType) => void;
  onRemoveTravelReceipt: (clientId: string) => void;
  onUpdateTravelReceipt: (
    clientId: string,
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
      <h2 className="text-lg font-medium">Kostenpositionen hinzufügen</h2>
      <p className="text-sm text-muted-foreground">
        Wähle eine Kostenart, um eine Position hinzuzufügen.
      </p>
      <CostTypeSelector
        costTypes={COST_TYPES}
        labels={props.costLabels}
        onSelect={props.onAddTravelReceipt}
        getAccessibleLabel={(costType) =>
          `${props.costLabels[costType]} hinzufügen`
        }
      />

      {props.travelReceipts.map((receipt, index) => (
        <TravelReceiptCard
          key={receipt.clientId}
          receipt={receipt}
          title={getTravelReceiptLabel(
            props.travelReceipts,
            index,
            props.costLabels,
          )}
          onRemove={() => props.onRemoveTravelReceipt(receipt.clientId)}
          onUpdate={(updates) =>
            props.onUpdateTravelReceipt(receipt.clientId, updates)
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
