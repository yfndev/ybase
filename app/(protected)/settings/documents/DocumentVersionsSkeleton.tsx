import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ROWS = ["one", "two", "three"];

export function DocumentVersionsSkeleton() {
  return (
    <ul className="space-y-3" aria-busy="true">
      <li className="sr-only">Unterlagen werden geladen</li>
      {SKELETON_ROWS.map((row) => (
        <li
          key={row}
          className="border-l-4 border-l-muted border-y border-r bg-background p-5"
        >
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-2 h-3 w-72" />
          <Skeleton className="mt-2 h-3 w-40" />
        </li>
      ))}
    </ul>
  );
}
