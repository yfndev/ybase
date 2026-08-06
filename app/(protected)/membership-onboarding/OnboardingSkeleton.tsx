import { Skeleton } from "@/components/ui/skeleton";

export function OnboardingSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy="true">
      <span className="sr-only">Onboarding wird geladen</span>
      <Skeleton className="min-h-0 w-full flex-1" />
      <Skeleton className="mt-6 h-11 w-48 shrink-0" />
    </div>
  );
}
