import { Skeleton } from "@/components/ui/skeleton";

export function OnboardingSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Onboarding wird geladen</span>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-8 w-80 max-w-full" />
      <Skeleton className="mt-5 h-4 w-full max-w-2xl" />
      <Skeleton className="mt-2 h-4 w-2/3 max-w-xl" />
      <Skeleton className="mt-6 h-72 w-full rounded-xl" />
      <Skeleton className="mt-6 h-10 w-48" />
    </div>
  );
}
