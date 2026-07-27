import { ApplicationReviewSidebar } from "@/components/Applications/ApplicationReviewSidebar";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

export default function ApplicationLoading() {
  return (
    <div className="w-full space-y-6">
      <PageHeader showBackButton />
      <main className="space-y-6 min-[1200px]:pr-4">
        <div className="space-y-4 min-[1200px]:hidden">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-48 w-full" />
      </main>
      <ApplicationReviewSidebar
        footer={
          <div className="space-y-2 border-t pt-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        }
      >
        <div className="hidden space-y-4 min-[1200px]:block">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </ApplicationReviewSidebar>
    </div>
  );
}
