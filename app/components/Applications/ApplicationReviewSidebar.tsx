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
      data-member-drawer
      aria-label="Bewerbungsverwaltung"
      className="mt-8 border-t pt-6 min-[1200px]:fixed min-[1200px]:inset-y-4 min-[1200px]:right-4 min-[1200px]:z-40 min-[1200px]:mt-0 min-[1200px]:w-(--member-drawer-width) min-[1200px]:overflow-hidden min-[1200px]:border-0 min-[1200px]:pt-0"
    >
      <div className="flex flex-col min-[1200px]:absolute min-[1200px]:inset-y-0 min-[1200px]:left-0 min-[1200px]:w-(--member-drawer-width) min-[1200px]:overflow-hidden min-[1200px]:rounded-[0.25rem] min-[1200px]:border min-[1200px]:bg-background">
        <div className="space-y-6 min-[1200px]:min-h-0 min-[1200px]:flex-1 min-[1200px]:overflow-y-auto min-[1200px]:px-6 min-[1200px]:pt-8 [&>div:first-child>section:first-child]:border-t-0 [&>div:first-child>section:first-child]:pt-0">
          {children}
        </div>
        <div className="mt-6 min-[1200px]:mt-0 min-[1200px]:px-6 min-[1200px]:pb-6">
          {footer}
        </div>
      </div>
    </aside>
  );
}
