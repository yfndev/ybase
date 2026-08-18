import { PageHeader } from "@/components/Layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <PageHeader showBackButton />
      <div className="max-w-4xl space-y-8">
        <section className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-28" />
        </section>
        <section className="space-y-4 border-t pt-6">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-64 w-full" />
        </section>
      </div>
    </div>
  );
}
