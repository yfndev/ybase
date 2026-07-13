import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full bg-background px-3 py-2 text-base outline-none border-2 border-input transition-colors hover:border-ring focus:border-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
