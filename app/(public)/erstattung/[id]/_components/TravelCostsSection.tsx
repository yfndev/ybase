"use client";

import { Button } from "@/components/ui/button";
import { getTravelReceiptLabel } from "@/lib/travelReceiptForm";
import { Plus } from "lucide-react";
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
      <div className="flex flex-wrap gap-2">
        {(Object.keys(props.costLabels) as CostType[]).map((costType) => (
          <Button
            key={costType}
            type="button"
            variant="outline"
            aria-label={`${props.costLabels[costType]} hinzufügen`}
            onClick={() => props.onAddTravelReceipt(costType)}
          >
            <Plus className="size-4" />
            {props.costLabels[costType]}
          </Button>
        ))}
      </div>

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
