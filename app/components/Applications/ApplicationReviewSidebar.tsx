import type { ReactNode } from "react";

export function ApplicationReviewSidebar({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <aside
      data-application-review-sidebar
      aria-label="Bewerbungsverwaltung"
      className="mt-8 border-t pt-6 min-[1280px]:fixed min-[1280px]:inset-y-4 min-[1280px]:right-4 min-[1280px]:z-40 min-[1280px]:mt-0 min-[1280px]:w-(--application-review-sidebar-width) min-[1280px]:overflow-hidden min-[1280px]:border-0 min-[1280px]:pt-0"
    >
      <div className="flex flex-col min-[1280px]:absolute min-[1280px]:inset-y-0 min-[1280px]:left-0 min-[1280px]:w-(--application-review-sidebar-width) min-[1280px]:overflow-hidden min-[1280px]:rounded-[0.25rem] min-[1280px]:border min-[1280px]:bg-background">
        <div className="space-y-6 min-[1280px]:min-h-0 min-[1280px]:flex-1 min-[1280px]:overflow-y-auto min-[1280px]:px-6 min-[1280px]:pt-8 [&>div:first-child>section:first-child]:border-t-0 [&>div:first-child>section:first-child]:pt-0">
          {children}
        </div>
        <div className="mt-6 min-[1280px]:mt-0 min-[1280px]:px-6 min-[1280px]:pb-6">
          {footer}
        </div>
      </div>
    </aside>
  );
}
