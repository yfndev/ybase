"use client";

import { Button } from "@/components/ui/button";
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
        Wähle alle Kostenarten aus, für die du Belege einreichen möchtest.
      </p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(props.costLabels) as CostType[]).map((costType) => (
          <Button
            key={costType}
            type="button"
            variant={
              props.travelReceipts.some(
                (receipt) => receipt.costType === costType,
              )
                ? "default"
                : "outline"
            }
            onClick={() => props.onToggleCostType(costType)}
          >
            {props.costLabels[costType]}
          </Button>
        ))}
      </div>

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
