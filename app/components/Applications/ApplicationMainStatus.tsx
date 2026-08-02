import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	getApplicationMainStatus,
	type ApplicationMainStatus as MainStatus,
} from "@/lib/applications/mainStatus";
import type { ApplicationStatus } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const FLOW = [
	{
		status: "application",
		label: "Bewerbung",
	},
	{
		status: "interview",
		label: "Interview",
	},
	{
		status: "accepted",
		label: "Angenommen",
	},
] as const;

const TERMINAL_STATUS: Record<
	Extract<MainStatus, "rejected" | "withdrawn">,
	{ label: string; className: string }
> = {
	rejected: {
		label: "Abgelehnt",
		className: "border-destructive bg-destructive text-destructive-foreground",
	},
	withdrawn: {
		label: "Zurückgezogen",
		className: "border-border bg-muted text-muted-foreground",
	},
};

export function ApplicationMainStatus({
	status,
}: {
	status: ApplicationStatus;
}) {
	const mainStatus = getApplicationMainStatus(status);
	const activeIndex = FLOW.findIndex((step) => step.status === mainStatus);
	const terminalStatus =
		mainStatus === "rejected" || mainStatus === "withdrawn"
			? TERMINAL_STATUS[mainStatus]
			: undefined;

	return (
		<section className="space-y-4 border-t pt-5">
			<h3 className="text-xl font-semibold">Status der Bewerbung</h3>
			{activeIndex >= 0 ? (
				<ol className="grid grid-cols-3" aria-label="Bewerbungsfortschritt">
					{FLOW.map((step, index) => {
						const isActive = index === activeIndex;
						const isCompleted = index < activeIndex;
						const stateLabel = isActive
							? "Aktuell"
							: isCompleted
								? "Abgeschlossen"
								: "Ausstehend";
						return (
							<li
								key={step.status}
								aria-current={isActive ? "step" : undefined}
								aria-label={`${index + 1}. ${step.label}: ${stateLabel}`}
								className={cn(
									"relative flex flex-col items-center gap-2 text-center",
									index > 0 &&
										"before:absolute before:top-[15px] before:right-1/2 before:h-0.5 before:w-full before:content-['']",
									index > activeIndex
										? "before:bg-border"
										: "before:bg-foreground",
								)}
							>
								<span
									className={cn(
										"relative z-10 flex size-8 items-center justify-center border-2 bg-background text-sm font-semibold",
										isActive
											? "border-foreground bg-primary text-primary-foreground"
											: isCompleted
												? "border-foreground bg-foreground text-background"
												: "border-border text-muted-foreground",
									)}
								>
									{isCompleted ? (
										<Check aria-hidden="true" className="size-4" />
									) : (
										index + 1
									)}
								</span>
								<span
									className={cn(
										"text-sm font-semibold",
										!isActive && "text-muted-foreground",
									)}
								>
									{step.label}
								</span>
								{isActive ? (
									<span className="text-[0.6875rem] font-semibold tracking-wider text-muted-foreground uppercase">
										Aktuell
									</span>
								) : null}
							</li>
						);
					})}
				</ol>
			) : terminalStatus ? (
				<Badge
					variant="outline"
					className={cn(
						"h-9 border-2 px-3 text-sm font-semibold",
						terminalStatus.className,
					)}
				>
					{terminalStatus.label}
				</Badge>
			) : null}
		</section>
	);
}
