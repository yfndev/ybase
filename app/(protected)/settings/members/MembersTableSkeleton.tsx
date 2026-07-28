import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { MembersTableHeader } from "./MembersTableHeader";

const SKELETON_ROWS = ["one", "two", "three", "four", "five"];

export function MembersTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border" aria-busy="true">
      <span className="sr-only">Mitglieder werden geladen</span>
      <Table>
        <MembersTableHeader />
        <TableBody>
          {SKELETON_ROWS.map((row) => (
            <TableRow key={row}>
              <TableCell className="pl-4">
                <Skeleton className="h-8 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-44" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-7 w-24 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell className="pr-4">
                <Skeleton className="h-4 w-32" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
