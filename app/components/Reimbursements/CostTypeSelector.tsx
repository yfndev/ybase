"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CostType } from "@/lib/travel-costs";

type Props = {
  costTypes: readonly CostType[];
  labels: Record<CostType, string>;
  onSelect: (costType: CostType) => void;
  getAccessibleLabel?: (costType: CostType) => string;
};

export function CostTypeSelector({
  costTypes,
  labels,
  onSelect,
  getAccessibleLabel,
}: Props) {
  return (
    <fieldset className="flex flex-wrap gap-2" aria-label="Kostenarten">
      {costTypes.map((costType) => (
        <Button
          key={costType}
          type="button"
          variant="outline"
          aria-label={getAccessibleLabel?.(costType)}
          onClick={() => onSelect(costType)}
        >
          <Plus className="size-4" aria-hidden="true" />
          {labels[costType]}
        </Button>
      ))}
    </fieldset>
  );
}
