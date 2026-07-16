"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTravelDateRangeError } from "@/lib/travelDates";

type Props = {
  destination: string;
  purpose: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isInternational: boolean;
  onDestinationChange: (value: string) => void;
  onPurposeChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onIsInternationalChange: (value: boolean) => void;
};

export function TravelDetailsSection(props: Props) {
  const dateRangeError = getTravelDateRangeError(
    props.startDate,
    props.endDate,
    props.startTime,
    props.endTime,
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Reiseangaben</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Reiseziel *</Label>
          <Input
            value={props.destination}
            onChange={(e) => props.onDestinationChange(e.target.value)}
            placeholder="z.B. München"
          />
        </div>
        <div>
          <Label>Reisezweck *</Label>
          <Input
            value={props.purpose}
            onChange={(e) => props.onPurposeChange(e.target.value)}
            placeholder="z.B. Konferenz"
          />
        </div>
        <div>
          <Label>Von (Datum) *</Label>
          <Input
            type="date"
            value={props.startDate}
            onChange={(e) => props.onStartDateChange(e.target.value)}
          />
        </div>
        <div>
          <Label>Von (Uhrzeit) *</Label>
          <Input
            type="time"
            value={props.startTime}
            onChange={(e) => props.onStartTimeChange(e.target.value)}
          />
        </div>
        <div>
          <Label>Bis (Datum) *</Label>
          <Input
            type="date"
            value={props.endDate}
            onChange={(e) => props.onEndDateChange(e.target.value)}
            min={props.startDate || undefined}
            aria-invalid={Boolean(dateRangeError) || undefined}
            aria-describedby={
              dateRangeError ? "travel-date-range-error" : undefined
            }
          />
        </div>
        <div>
          <Label>Bis (Uhrzeit) *</Label>
          <Input
            type="time"
            value={props.endTime}
            onChange={(e) => props.onEndTimeChange(e.target.value)}
            aria-invalid={Boolean(dateRangeError) || undefined}
            aria-describedby={
              dateRangeError ? "travel-date-range-error" : undefined
            }
          />
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
      <div className="flex items-center space-x-2">
        <Checkbox
          id="international"
          checked={props.isInternational}
          onCheckedChange={(checked) =>
            props.onIsInternationalChange(checked === true)
          }
        />
        <Label htmlFor="international" className="font-normal">
          Auslandsreise
        </Label>
      </div>
    </div>
  );
}
