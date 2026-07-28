import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationsTableHeader } from "./ApplicationsTableHeader";

const SKELETON_ROWS = ["one", "two", "three", "four", "five"];

export function ApplicationsTableSkeleton({
  showJobPosting,
}: {
  showJobPosting: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-md border" aria-busy="true">
      <span className="sr-only">Bewerbungen werden geladen</span>
      <Table>
        <ApplicationsTableHeader showJobPosting={showJobPosting} />
        <TableBody>
          {SKELETON_ROWS.map((row) => (
            <TableRow key={row}>
              <TableCell className="space-y-2 pl-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </TableCell>
              {showJobPosting ? (
                <TableCell>
                  <Skeleton className="h-4 w-36" />
                </TableCell>
              ) : null}
              <TableCell>
                <Skeleton className="h-7 w-24 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell className="pr-4">
                <Skeleton className="h-4 w-28" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
