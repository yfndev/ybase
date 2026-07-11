"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export function PageHeader({
  title,
  subtitle,
  showBackButton = false,
  backUrl,
}: Props) {
  const router = useRouter();

  const handleBackClick = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <header className="flex h-12 sm:h-16 items-center">
      <div className="flex w-full items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackClick}
              className="h-8 w-8 shrink-0"
              aria-label="Zurück"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0">
            {title ? (
              <h1 className="text-lg sm:text-xl font-semibold truncate">
                {title}
              </h1>
            ) : (
              <Skeleton className="h-7 w-48" />
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
