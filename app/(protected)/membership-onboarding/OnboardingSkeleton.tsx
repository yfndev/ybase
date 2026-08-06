import { Skeleton } from "@/components/ui/skeleton";

export function OnboardingSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Onboarding wird geladen</span>
      <Skeleton className="h-[26rem] w-full" />
      <Skeleton className="mt-6 h-11 w-48" />
    </div>
  );
}
