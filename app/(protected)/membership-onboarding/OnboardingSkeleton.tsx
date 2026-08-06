import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ROWS = ["one", "two", "three", "four"];

export function OnboardingSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <span className="sr-only">Onboarding wird geladen</span>
      <div className="space-y-3">
        {SKELETON_ROWS.map((row) => (
          <div key={row} className="flex items-center gap-3">
            <Skeleton className="size-5 shrink-0" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-11 w-48" />
    </div>
  );
}
