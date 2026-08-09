import { FileSignature } from "lucide-react";
import Link from "next/link";

export function MembershipPendingNotice() {
  return (
    <Link
      href="/membership-onboarding"
      className="border-border bg-muted/30 hover:bg-muted/60 mb-6 flex items-center gap-3 rounded-md border p-4"
    >
      <FileSignature
        aria-hidden="true"
        className="text-muted-foreground size-5 shrink-0"
      />
      <span className="text-sm font-medium">
        Vereinsmitgliedschaft abschließen
      </span>
    </Link>
  );
}
