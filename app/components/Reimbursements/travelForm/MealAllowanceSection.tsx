"use client";

import type { MealAllowance } from "@/lib/db/types";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { createMealAllowance } from "@/lib/travel-costs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  allowance: MealAllowance;
  isInternational: boolean;
  onAllowanceChange: (allowance: MealAllowance) => void;
  showMealAllowance: boolean;
  setShowMealAllowance: (value: boolean) => void;
  mealTotal: number;
};

const LINES: Array<{ key: keyof MealAllowance; label: string }> = [
  { key: "singleDay", label: "Eintägige Reise (mehr als 8 Stunden)" },
  { key: "arrivalDay", label: "Anreisetag" },
  { key: "fullDay", label: "Zwischentag (24 Stunden)" },
  { key: "departureDay", label: "Abreisetag" },
];

export function MealAllowanceSection({
  allowance,
  isInternational,
  onAllowanceChange,
  showMealAllowance,
  setShowMealAllowance,
  mealTotal,
}: Props) {
  const updateLine = (
    key: keyof MealAllowance,
    field: "days" | "rate",
    value: number,
  ) => {
    onAllowanceChange({
      ...allowance,
      [key]: { ...allowance[key], [field]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="mealAllowance"
          checked={showMealAllowance}
          onCheckedChange={(checked) => {
            const enabled = checked === true;
            setShowMealAllowance(enabled);
            if (!enabled) {
              onAllowanceChange(createMealAllowance(isInternational));
            }
          }}
        />
        <Label htmlFor="mealAllowance" className="font-normal cursor-pointer">
          Verpflegungsmehraufwand geltend machen
        </Label>
      </div>

      {showMealAllowance ? (
        <div className="border rounded-lg p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Bitte nur ausfüllen, wenn dies vorab mit deinem Lead abgesprochen
            wurde. Bei Auslandsreisen müssen die geltenden Sätze eingetragen
            werden.
          </p>
          <div className="space-y-3">
            {LINES.map(({ key, label }) => {
              const line = allowance[key];
              return (
                <div
                  key={key}
                  className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_100px_120px_120px]"
                >
                  <div className="text-sm font-medium">{label}</div>
                  <div>
                    <Label htmlFor={`${key}-days`}>Tage</Label>
                    <Input
                      id={`${key}-days`}
                      type="number"
                      step="1"
                      min={0}
                      value={line.days || ""}
                      onChange={(event) =>
                        updateLine(
                          key,
                          "days",
                          Math.max(0, Math.floor(Number(event.target.value))),
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${key}-rate`}>Satz (€)</Label>
                    <Input
                      id={`${key}-rate`}
                      type="number"
                      step="0.01"
                      min={0}
                      disabled={!isInternational}
                      value={line.rate || ""}
                      onChange={(event) =>
                        updateLine(
                          key,
                          "rate",
                          Math.max(0, Number(event.target.value)),
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Betrag</Label>
                    <Input
                      value={formatCurrency(line.days * line.rate)}
                      disabled
                      className="bg-muted/50 font-mono"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between border-t pt-3 font-medium">
            <span>Verpflegung gesamt</span>
            <span>{formatCurrency(mealTotal)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
