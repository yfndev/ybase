import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ROWS = ["one", "two", "three"];

export function DocumentVersionsSkeleton() {
  return (
    <ul className="space-y-3" aria-busy="true">
      <span className="sr-only">Unterlagen werden geladen</span>
      {SKELETON_ROWS.map((row) => (
        <li key={row} className="rounded-xl border bg-card p-4 shadow-sm">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-2 h-3 w-72" />
          <Skeleton className="mt-2 h-3 w-40" />
        </li>
      ))}
    </ul>
  );
}
