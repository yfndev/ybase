"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { OVERNIGHT_ALLOWANCE_EUR } from "@/lib/travel-costs";

type Props = {
  enabled: boolean;
  isInternational: boolean;
  nights: number;
  rate: number;
  total: number;
  onEnabledChange: (enabled: boolean) => void;
  onNightsChange: (nights: number) => void;
  onRateChange: (rate: number) => void;
};

export function OvernightAllowanceSection(props: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="overnightAllowance"
          checked={props.enabled}
          onCheckedChange={(checked) => {
            const enabled = checked === true;
            props.onEnabledChange(enabled);
            if (!enabled) props.onNightsChange(0);
          }}
        />
        <Label
          htmlFor="overnightAllowance"
          className="font-normal cursor-pointer"
        >
          Übernachtungspauschale geltend machen
        </Label>
      </div>

      {props.enabled ? (
        <div className="border rounded-lg p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Nur für Übernachtungen ohne erstatteten Unterkunftsbeleg. Der
            Standardsatz beträgt {formatCurrency(OVERNIGHT_ALLOWANCE_EUR)} pro
            Nacht; bei Auslandsreisen ist der geltende Satz einzutragen.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="overnight-nights">Übernachtungen</Label>
              <Input
                id="overnight-nights"
                type="number"
                step="1"
                min={0}
                value={props.nights || ""}
                onChange={(event) =>
                  props.onNightsChange(
                    Math.max(0, Math.floor(Number(event.target.value))),
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="overnight-rate">Satz (€)</Label>
              <Input
                id="overnight-rate"
                type="number"
                step="0.01"
                min={0}
                disabled={!props.isInternational}
                value={props.rate || ""}
                onChange={(event) =>
                  props.onRateChange(Math.max(0, Number(event.target.value)))
                }
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Betrag</Label>
              <Input
                value={formatCurrency(props.total)}
                disabled
                className="bg-muted/50 font-mono"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
