import { Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MemberPlatformLinkOption } from "@/lib/server/memberPlatform/linking";
import { getInitials } from "@/lib/formatters/getInitials";

interface Props {
  profile: MemberPlatformLinkOption;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function MemberPlatformProfileOption({
  profile,
  isSelected = false,
  onSelect,
}: Props) {
  const content = (
    <>
      <Avatar className="size-11 border">
        <AvatarImage src={profile.imageUrl} alt="" className="object-cover" />
        <AvatarFallback className="text-sm font-semibold">
          {getInitials(profile.name)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 truncate text-left font-medium">
        {profile.name}
      </span>
      {isSelected ? (
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check aria-hidden="true" className="size-3.5" />
        </span>
      ) : null}
    </>
  );

  if (!onSelect) {
    return (
      <div className="flex items-center gap-3 rounded-md border-2 bg-muted/30 p-4">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-md border-2 p-3 transition-colors hover:border-ring aria-pressed:border-primary aria-pressed:bg-primary/5"
    >
      {content}
    </button>
  );
}
