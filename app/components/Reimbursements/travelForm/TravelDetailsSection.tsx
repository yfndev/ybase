"use client";

import { DateInput } from "@/components/Selectors/DateInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTravelDateRangeError } from "@/lib/travelDates";
import {
  changeMealAllowanceCountry,
  OVERNIGHT_ALLOWANCE_EUR,
} from "@/lib/travel-costs";
import type { Travel } from "./types";

interface Props {
  travel: Travel;
  update: (field: Partial<Travel>) => void;
}

export function TravelDetailsSection({ travel, update }: Props) {
  const dateRangeError = getTravelDateRangeError(
    travel.startDate,
    travel.endDate,
    travel.startTime,
    travel.endTime,
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Reiseangaben</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <Label htmlFor="travel-destination">Reiseziel *</Label>
          <Input
            id="travel-destination"
            value={travel.destination}
            onChange={(e) => update({ destination: e.target.value })}
            placeholder="z.B. München, Berlin"
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="travel-purpose">Reisezweck *</Label>
          <Input
            id="travel-purpose"
            value={travel.purpose}
            onChange={(e) => update({ purpose: e.target.value })}
            placeholder="z.B. Kundentermin, Konferenz"
          />
        </div>
      </div>
      <div className="space-y-6">
        <fieldset className="min-w-0">
          <legend className="mb-3 text-base font-medium">Reisebeginn</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <Label htmlFor="travel-start-date">Datum *</Label>
              <DateInput
                id="travel-start-date"
                value={travel.startDate}
                onChange={(value) => update({ startDate: value })}
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="travel-start-time">Uhrzeit *</Label>
              <Input
                id="travel-start-time"
                type="time"
                value={travel.startTime}
                onChange={(event) => update({ startTime: event.target.value })}
              />
            </div>
          </div>
        </fieldset>

        <div className="pt-6">
          <fieldset className="min-w-0">
            <legend className="mb-3 text-base font-medium">Reiseende</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <Label htmlFor="travel-end-date">Datum *</Label>
                <DateInput
                  id="travel-end-date"
                  value={travel.endDate}
                  onChange={(value) => update({ endDate: value })}
                  invalid={Boolean(dateRangeError)}
                  describedBy={
                    dateRangeError ? "travel-date-range-error" : undefined
                  }
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="travel-end-time">Uhrzeit *</Label>
                <Input
                  id="travel-end-time"
                  type="time"
                  value={travel.endTime}
                  onChange={(event) => update({ endTime: event.target.value })}
                  aria-invalid={Boolean(dateRangeError) || undefined}
                  aria-describedby={
                    dateRangeError ? "travel-date-range-error" : undefined
                  }
                />
              </div>
            </div>
          </fieldset>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="international"
            checked={travel.isInternational}
            onCheckedChange={(checked) => {
              const isInternational = checked === true;
              update({
                isInternational,
                mealAllowance: changeMealAllowanceCountry(
                  travel.mealAllowance,
                  isInternational,
                ),
                overnightAllowanceRate: OVERNIGHT_ALLOWANCE_EUR,
              });
            }}
          />
          <Label htmlFor="international" className="font-normal">
            Auslandsreise
          </Label>
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
