"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import { useOnboarding } from "./OnboardingContext";

const SKELETON_ROWS = ["one", "two", "three", "four"];

export function OnboardingSidebarProgress() {
  const { steps } = useOnboarding();
  const currentIndex = steps.findIndex((step) => !step.complete);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="gap-2 font-semibold">
        <span>Onboarding</span>
        <span className="h-px flex-1 bg-ring" />
      </SidebarGroupLabel>
      <SidebarMenu>
        {steps.length === 0
          ? SKELETON_ROWS.map((row) => (
              <SidebarMenuItem key={row}>
                <div className="flex items-center gap-2 px-3 py-2">
                  <Skeleton className="size-4 shrink-0" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </SidebarMenuItem>
            ))
          : steps.map((step, index) => {
              const current = index === currentIndex;
              const Icon = step.complete
                ? CheckCircle2
                : current
                  ? Clock3
                  : Circle;
              return (
                <SidebarMenuItem key={`${index}-${step.label}`}>
                  <SidebarMenuButton
                    asChild
                    tooltip={step.label}
                    className="h-auto items-start px-3 py-2 font-medium whitespace-normal"
                    isActive={current}
                  >
                    <span>
                      <Icon
                        aria-hidden="true"
                        className={
                          step.complete
                            ? "mt-0.5 fill-primary text-foreground"
                            : "mt-0.5 text-sidebar-foreground/60"
                        }
                      />
                      <span
                        className={current ? "" : "text-sidebar-foreground/75"}
                      >
                        {step.label}
                      </span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
