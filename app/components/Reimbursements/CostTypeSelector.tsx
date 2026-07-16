"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CostType } from "@/lib/travel-costs";

type Props = {
  costTypes: readonly CostType[];
  labels: Record<CostType, string>;
  isSelected: (costType: CostType) => boolean;
  onToggle: (costType: CostType) => void;
};

export function CostTypeSelector({
  costTypes,
  labels,
  isSelected,
  onToggle,
}: Props) {
  return (
    <fieldset className="flex flex-wrap gap-2" aria-label="Kostenarten">
      {costTypes.map((costType) => {
        const selected = isSelected(costType);

        return (
          <Button
            key={costType}
            type="button"
            variant={selected ? "primary" : "outline"}
            aria-pressed={selected}
            onClick={() => onToggle(costType)}
          >
            {selected ? <Check className="size-4" aria-hidden="true" /> : null}
            {labels[costType]}
          </Button>
        );
      })}
    </fieldset>
  );
}
