import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/formatters/getInitials";
import type { MemberPlatformLinkOption } from "@/lib/server/memberPlatform/linking";

export function MemberPlatformProfileOption({
  profile,
}: {
  profile: MemberPlatformLinkOption;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border-2 bg-muted/30 p-4">
      <Avatar className="size-11 border">
        <AvatarImage src={profile.imageUrl} alt="" className="object-cover" />
        <AvatarFallback className="text-sm font-semibold">
          {getInitials(profile.name)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 truncate text-left font-medium">
        {profile.name}
      </span>
    </div>
  );
}
