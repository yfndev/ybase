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

type Props = {
  showFoodAllowance: boolean;
  onShowFoodAllowanceChange: (value: boolean) => void;
  mealDays: number;
  mealRate: number;
  mealTotal: number;
  onMealDaysChange: (value: number) => void;
  onMealRateChange: (value: number) => void;
};

export function FoodAllowanceSection(props: Props) {
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Checkbox
            id="showFood"
            checked={props.showFoodAllowance}
            onCheckedChange={(checked) =>
              props.onShowFoodAllowanceChange(checked === true)
            }
          />
          <Label
            htmlFor="showFood"
            className="text-lg font-medium cursor-pointer"
          >
            Verpflegungsmehraufwand geltend machen
          </Label>
        </div>
      </div>

      {props.showFoodAllowance && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Verpflegungsmehraufwand</h2>
          <div className="border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Tage</Label>
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  value={props.mealDays || ""}
                  onChange={(e) =>
                    props.onMealDaysChange(parseFloat(e.target.value) || 0)
                  }
                  placeholder="z.B. 2.5"
                />
              </div>
              <div>
                <Label>Tagessatz (€)</Label>
                <Select
                  value={props.mealRate ? String(props.mealRate) : ""}
                  onValueChange={(value) =>
                    props.onMealRateChange(parseFloat(value) || 0)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14">14 € (8-24h)</SelectItem>
                    <SelectItem value="28">28 € (24h+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground">Betrag</Label>
                <Input
                  value={`${props.mealTotal.toFixed(2)} €`}
                  disabled
                  className="bg-muted/50 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
