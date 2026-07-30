"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { JobPostingUrgency } from "@/lib/db/types";
import { JOB_POSTING_URGENCY_LABELS } from "@/lib/jobPostings/urgency";

interface Props {
  id: string;
  value: JobPostingUrgency;
  onValueChange: (urgency: JobPostingUrgency) => void;
}

export function SelectJobPostingUrgency({ id, value, onValueChange }: Props) {
  return (
    <Select
      value={value}
      onValueChange={(urgency) => onValueChange(urgency as JobPostingUrgency)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(JOB_POSTING_URGENCY_LABELS).map(([urgency, label]) => (
          <SelectItem key={urgency} value={urgency}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
