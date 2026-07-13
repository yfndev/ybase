"use client";

import { DateInput } from "@/components/Selectors/DateInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTravelDateRangeError } from "@/lib/travelDates";
import type { Travel } from "./types";

interface Props {
  travel: Travel;
  update: (field: Partial<Travel>) => void;
}

export function TravelDetailsSection({ travel, update }: Props) {
  const dateRangeError = getTravelDateRangeError(
    travel.startDate,
    travel.endDate,
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Reiseangaben</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Reiseziel *</Label>
          <Input
            value={travel.destination}
            onChange={(e) => update({ destination: e.target.value })}
            placeholder="z.B. München, Berlin"
          />
        </div>
        <div>
          <Label>Reisezweck *</Label>
          <Input
            value={travel.purpose}
            onChange={(e) => update({ purpose: e.target.value })}
            placeholder="z.B. Kundentermin, Konferenz"
          />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label>Reisebeginn *</Label>
          <DateInput
            value={travel.startDate}
            onChange={(value) => update({ startDate: value })}
          />
        </div>
        <div>
          <Label>Reiseende *</Label>
          <DateInput
            value={travel.endDate}
            onChange={(value) => update({ endDate: value })}
            invalid={Boolean(dateRangeError)}
            describedBy={dateRangeError ? "travel-date-range-error" : undefined}
          />
        </div>
        <div className="col-span-2 flex items-end pb-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="international"
              checked={travel.isInternational}
              onCheckedChange={(checked) =>
                update({ isInternational: checked === true })
              }
            />
            <Label htmlFor="international" className="font-normal">
              Auslandsreise
            </Label>
          </div>
        </div>
      </div>
      {dateRangeError ? (
        <p
          id="travel-date-range-error"
          role="alert"
          className="text-sm font-medium text-destructive"
        >
          {dateRangeError}
        </p>
      ) : null}
    </div>
  );
}
