import Image from "next/image";
import type { ReactNode } from "react";

export function ResignationShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-6 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-3">
          <Image src="/AppIcon.png" alt="" width={40} height={40} priority />
          <span className="text-xl font-bold">YBase</span>
        </div>
        {children}
      </div>
    </main>
  );
}
