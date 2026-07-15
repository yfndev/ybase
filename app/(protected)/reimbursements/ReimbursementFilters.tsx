import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReimbursementTypeFilter } from "./types";

type Props = {
  value: ReimbursementTypeFilter;
  onChange: (value: ReimbursementTypeFilter) => void;
};

export function ReimbursementFilters({ value, onChange }: Props) {
  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) =>
        onChange(nextValue as ReimbursementTypeFilter)
      }
      className="mb-4"
    >
      <TabsList aria-label="Erstattungsart filtern">
        <TabsTrigger value="all">Alle</TabsTrigger>
        <TabsTrigger value="travel">Reisekostenerstattung</TabsTrigger>
        <TabsTrigger value="expense">Auslagenerstattung</TabsTrigger>
        <TabsTrigger value="allowance">Ehrenamtspauschale</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
