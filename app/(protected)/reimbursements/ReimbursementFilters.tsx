import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReimbursementView } from "./types";

type Props = {
  value: ReimbursementView;
  canManageReimbursements: boolean;
  pendingLinksCount: number;
  onChange: (value: ReimbursementView) => void;
};

export function ReimbursementFilters({
  value,
  canManageReimbursements,
  pendingLinksCount,
  onChange,
}: Props) {
  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) => onChange(nextValue as ReimbursementView)}
      className="mb-4"
    >
      <TabsList aria-label="Erstattungsansicht">
        <TabsTrigger value="all">Alle</TabsTrigger>
        <TabsTrigger value="travel">Reisekostenerstattung</TabsTrigger>
        <TabsTrigger value="expense">Auslagenerstattung</TabsTrigger>
        <TabsTrigger value="allowance">Ehrenamtspauschale</TabsTrigger>
        {canManageReimbursements ? (
          <TabsTrigger value="links">
            Offene Links
            <span className="min-w-5 rounded-full bg-muted px-1.5 py-0.5 text-xs leading-none text-muted-foreground">
              {pendingLinksCount}
            </span>
          </TabsTrigger>
        ) : null}
      </TabsList>
    </Tabs>
  );
}
