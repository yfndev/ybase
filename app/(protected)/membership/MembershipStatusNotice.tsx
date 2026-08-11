import { CalendarClock, MailCheck } from "lucide-react";

export function MembershipStatusNotice({
  title,
  description,
  icon = "calendar",
}: {
  title: string;
  description: string;
  icon?: "calendar" | "mail";
}) {
  const Icon = icon === "mail" ? MailCheck : CalendarClock;
  return (
    <div className="flex gap-3 rounded-md border bg-muted/30 p-4">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-muted-foreground"
      />
      <div className="space-y-1 text-sm">
        <p className="font-medium">{title}</p>
        <p className="leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
