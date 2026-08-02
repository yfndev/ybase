import { ApplicationReviewSidebar } from "@/components/Applications/ApplicationReviewSidebar";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

function DetailSkeleton() {
  return (
    <section className="space-y-4 border-t pt-5">
      <Skeleton className="h-6 w-44" />
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </section>
  );
}

export default function ApplicationLoading() {
  return (
    <div className="w-full space-y-6" aria-busy="true">
      <PageHeader showBackButton />

      <main
        className="min-w-0 space-y-8 min-[1280px]:h-[calc(100svh-11.75rem)] min-[1280px]:overflow-hidden min-[1280px]:pr-4 [&>section:first-of-type]:border-t-0 [&>section:first-of-type]:pt-0"
        aria-label="Bewerbung wird geladen"
      >
        <div className="min-[1280px]:hidden">
          <DetailSkeleton />
        </div>
        <section className="space-y-5 border-t pt-5">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-14 w-4/5" />
            </div>
          </div>
        </section>
        <section className="space-y-4 border-t pt-5">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-16 w-full" />
        </section>
      </main>

      <ApplicationReviewSidebar footer={<Skeleton className="h-10 w-full" />}>
        <div className="hidden min-[1280px]:block">
          <DetailSkeleton />
        </div>
        <div>
          <section className="space-y-4 border-t pt-5">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-52" />
          </section>
        </div>
        <div>
          <section className="space-y-3 border-t pt-5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-9 w-full" />
          </section>
        </div>
      </ApplicationReviewSidebar>
    </div>
  );
}
