"use client";

import { DateInput } from "@/components/Selectors/DateInput";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TAX_YEARS } from "./constants";
import type { VolunteerAllowanceForm } from "./types";

interface Props {
  form: VolunteerAllowanceForm;
  update: (field: Partial<VolunteerAllowanceForm>) => void;
}

export function ActivitySection({ form, update }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Tätigkeit</h2>
      <div>
        <Label>Beschreibung der nebenberuflichen Tätigkeit *</Label>
        <Textarea
          value={form.activity}
          onChange={(e) => update({ activity: e.target.value })}
          placeholder="z.B. Übungsleiter, Jugendarbeit, Vorstandstätigkeit"
          rows={3}
          className="resize-none"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Von *</Label>
          <DateInput
            value={form.startDate}
            onChange={(value) => update({ startDate: value })}
          />
        </div>
        <div>
          <Label>Bis *</Label>
          <DateInput
            value={form.endDate}
            onChange={(value) => update({ endDate: value })}
          />
        </div>
        <div>
          <Label>Steuerjahr *</Label>
          <Select
            value={form.taxYear}
            onValueChange={(value) => update({ taxYear: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAX_YEARS.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
