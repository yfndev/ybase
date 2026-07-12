"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import {
  MEAL_ALLOWANCE_FULL_DAY_EUR,
  MEAL_ALLOWANCE_PARTIAL_DAY_EUR,
} from "@/lib/travel-costs";
import type { Travel } from "./types";

interface Props {
  travel: Travel;
  update: (field: Partial<Travel>) => void;
  showMealAllowance: boolean;
  setShowMealAllowance: (value: boolean) => void;
  mealTotal: number;
}

export function MealAllowanceSection({
  travel,
  update,
  showMealAllowance,
  setShowMealAllowance,
  mealTotal,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="mealAllowance"
          checked={showMealAllowance}
          onCheckedChange={(checked) => {
            setShowMealAllowance(checked === true);
            if (!checked) update({ mealDays: 0, mealRate: 0 });
          }}
        />
        <Label htmlFor="mealAllowance" className="font-normal cursor-pointer">
          Verpflegungsmehraufwand geltend machen
        </Label>
      </div>

      {showMealAllowance && (
        <div className="border rounded-lg p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Bitte nur ausfüllen, wenn dies vorab mit deinem Lead abgesprochen
            wurde! Ansonsten werden die Reisekosten nicht erstattet.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Tage</Label>
              <Input
                type="number"
                step="0.5"
                min={0}
                value={travel.mealDays || ""}
                onChange={(e) =>
                  update({ mealDays: parseFloat(e.target.value) || 0 })
                }
                placeholder="z.B. 2.5"
              />
            </div>
            <div>
              <Label>Tagessatz (€)</Label>
              <Select
                value={travel.mealRate ? String(travel.mealRate) : ""}
                onValueChange={(value) =>
                  update({ mealRate: parseFloat(value) || 0 })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(MEAL_ALLOWANCE_PARTIAL_DAY_EUR)}>
                    {MEAL_ALLOWANCE_PARTIAL_DAY_EUR} € (8-24h)
                  </SelectItem>
                  <SelectItem value={String(MEAL_ALLOWANCE_FULL_DAY_EUR)}>
                    {MEAL_ALLOWANCE_FULL_DAY_EUR} € (24h+)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground">Betrag</Label>
              <Input
                value={formatCurrency(mealTotal)}
                disabled
                className="bg-muted/50 font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
