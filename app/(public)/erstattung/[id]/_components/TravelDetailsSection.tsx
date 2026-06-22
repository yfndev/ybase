"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  isInternational: boolean;
  onDestinationChange: (value: string) => void;
  onPurposeChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onIsInternationalChange: (value: boolean) => void;
};

export function TravelDetailsSection(props: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Reiseangaben</h2>
      <div className="grid grid-cols-2 gap-4">
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
          <Label>Von *</Label>
          <Input
            type="date"
            value={props.startDate}
            onChange={(e) => props.onStartDateChange(e.target.value)}
          />
        </div>
        <div>
          <Label>Bis *</Label>
          <Input
            type="date"
            value={props.endDate}
            onChange={(e) => props.onEndDateChange(e.target.value)}
          />
        </div>
      </div>
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
