import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function MembersTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="pl-4">Name</TableHead>
        <TableHead>YFN-Mail</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Department</TableHead>
        <TableHead>Team</TableHead>
        <TableHead className="pr-4">Position</TableHead>
      </TableRow>
    </TableHeader>
  );
}
