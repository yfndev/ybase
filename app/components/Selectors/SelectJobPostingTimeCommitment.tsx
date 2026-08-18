"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  isJobPostingTimeCommitment,
  JOB_POSTING_TIME_COMMITMENTS,
  type JobPostingTimeCommitment,
} from "@/lib/jobPostings/timeCommitment";

interface Props {
  id: string;
  value: JobPostingTimeCommitment | "";
  onValueChange: (timeCommitment: JobPostingTimeCommitment) => void;
}

export function SelectJobPostingTimeCommitment({
  id,
  value,
  onValueChange,
}: Props) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (isJobPostingTimeCommitment(nextValue)) onValueChange(nextValue);
      }}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Zeitaufwand wählen" />
      </SelectTrigger>
      <SelectContent>
        {JOB_POSTING_TIME_COMMITMENTS.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
