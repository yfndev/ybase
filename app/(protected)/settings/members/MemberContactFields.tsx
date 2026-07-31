import { ExternalLink, Mail, Phone } from "lucide-react";
import type { User } from "@/lib/db/types";

const MEMBER_PLATFORM_URL = "https://member.youngfounders.network";

export function MemberContactFields({ member }: { member: User }) {
  const profileUrl = member.memberPlatformUserId
    ? `${MEMBER_PLATFORM_URL}/member/${member.memberPlatformUserId}`
    : undefined;

  return (
    <section className="border-t pt-5" aria-labelledby="private-contact-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id="private-contact-title" className="text-sm font-semibold">
            Private Kontaktdaten
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            {member.membershipId
              ? "In der YBase-Mitgliedschaftsakte verwaltet"
              : member.memberPlatformUserId
                ? "Aus der Member-Plattform synchronisiert"
                : "Noch nicht mit der Member-Plattform verknüpft"}
          </p>
        </div>
        {profileUrl ? (
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 text-xs underline-offset-4 hover:underline"
          >
            Profil
            <ExternalLink aria-hidden="true" className="size-3" />
          </a>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 text-sm">
        {member.privateEmail ? (
          <a
            href={`mailto:${member.privateEmail}`}
            className="text-muted-foreground hover:text-foreground flex min-w-0 items-center gap-2 underline-offset-4 hover:underline"
          >
            <Mail aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">{member.privateEmail}</span>
          </a>
        ) : null}
        {member.phone ? (
          <a
            href={`tel:${member.phone.replace(/\s/g, "")}`}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 underline-offset-4 hover:underline"
          >
            <Phone aria-hidden="true" className="size-3.5 shrink-0" />
            <span>{member.phone}</span>
          </a>
        ) : null}
        {!member.privateEmail && !member.phone ? (
          <p className="text-muted-foreground">Keine Kontaktdaten hinterlegt</p>
        ) : null}
      </div>
    </section>
  );
}
