import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ApplicationsTableHeader({
  showJobPosting,
}: {
  showJobPosting: boolean;
}) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="pl-4">Bewerber:in</TableHead>
        <TableHead>E-Mail</TableHead>
        <TableHead>Status</TableHead>
        {showJobPosting ? <TableHead>Ausschreibung</TableHead> : null}
        <TableHead>
          {showJobPosting ? "Zuständig" : "Letzte Aktivität"}
        </TableHead>
        <TableHead className="pr-4">Eingang</TableHead>
      </TableRow>
    </TableHeader>
  );
}
