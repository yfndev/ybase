"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TallyTemplateOption } from "@/lib/tally/types";

interface Props {
  templates: TallyTemplateOption[];
  value: string | undefined;
  onValueChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function SelectTallyTemplate({
  templates,
  value,
  onValueChange,
  id,
  disabled,
  placeholder = "Vorlage wählen",
}: Props) {
  const selectedTemplate = templates.find((template) => template.id === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        className="min-w-0 w-full"
        title={selectedTemplate?.name}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-w-[calc(100vw-2rem)]">
        {templates.map((template) => (
          <SelectItem
            key={template.id}
            value={template.id}
            title={template.name}
          >
            <span className="block max-w-[calc(100vw-5rem)] truncate sm:max-w-80">
              {template.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
