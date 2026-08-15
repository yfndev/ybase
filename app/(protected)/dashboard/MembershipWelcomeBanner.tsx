import { ArrowRight, ArrowUpRight, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { OwnMembershipOverview } from "@/lib/server/memberships/selfServiceResignation";

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function MembershipWelcomeBanner({
  membership,
}: {
  membership: OwnMembershipOverview | null;
}) {
  const presentation = membershipPresentation(membership);
  const canResign = membership?.legalStatus === "active";

  return (
    <section
      aria-labelledby="membership-welcome-title"
      className="overflow-hidden rounded-none border-4 bg-card"
    >
      <div className="grid md:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-h-56 flex-col justify-center px-6 py-7 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-sm font-semibold">Young Founders Network</p>
            <span className="text-muted-foreground" aria-hidden="true">
              ·
            </span>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${presentation.dot}`}
              />
              {presentation.statusLabel}
            </p>
          </div>

          <h2
            id="membership-welcome-title"
            className="mt-4 text-2xl leading-tight font-bold tracking-tight sm:text-3xl"
          >
            {presentation.heading}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {presentation.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {canResign ? (
              <Button asChild variant="outline">
                <Link href="/membership?resign=1">
                  <LogOut aria-hidden="true" />
                  Mitgliedschaft beenden
                </Link>
              </Button>
            ) : membership ? (
              <Button asChild variant="outline">
                <Link href="/membership">
                  {presentation.actionLabel}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <a
                  href="https://youngfounders.network"
                  target="_blank"
                  rel="noreferrer"
                >
                  Mehr über YFN
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
            )}
            {membership ? (
              <span className="text-xs text-muted-foreground">
                {presentation.detail}
              </span>
            ) : null}
          </div>
        </div>

        <div className="relative min-h-48 border-t-4 md:min-h-full md:border-t-0 md:border-l-4">
          <Image
            src="/yfn-onboarding-team.jpg"
            alt="Mitglieder des Young Founders Network bei einem gemeinsamen Teamfoto"
            fill
            priority
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 18rem, 24rem"
            className="object-cover object-[center_52%]"
          />
          <div
            aria-hidden="true"
            className="absolute right-0 bottom-0 h-2 w-24 bg-primary"
          />
        </div>
      </div>
    </section>
  );
}

function membershipPresentation(membership: OwnMembershipOverview | null) {
  if (!membership) {
    return {
      heading: "Herzlich willkommen bei YBase",
      description:
        "Hier findest du deine Anträge, Abrechnungen und alles, was du für deine Arbeit im YFN brauchst.",
      statusLabel: "YBase-Konto",
      detail: "",
      actionLabel: "",
      dot: "bg-secondary",
    };
  }

  const firstName = membership.memberName.trim().split(/\s+/)[0];
  const heading = firstName
    ? `Herzlich willkommen, ${firstName}`
    : "Herzlich willkommen";

  if (membership.legalStatus === "resigning") {
    return {
      heading,
      description:
        "Dein Austritt ist vorgemerkt. Bis zum Mitgliedschaftsende bleiben deine Mitgliedschaft und deine Zugänge bestehen.",
      statusLabel: "Ende vorgemerkt",
      detail: membership.scheduledEndAt
        ? `Mitglied bis ${formatEndDate(membership.scheduledEndAt)}`
        : membership.membershipNumber,
      actionLabel: "Austritt ansehen",
      dot: "bg-amber-500",
    };
  }

  if (membership.legalStatus === "active") {
    return {
      heading,
      description:
        "Schön, dass du Teil unserer Community bist. Hier kannst du deine Mitgliedschaft einsehen und verwalten.",
      statusLabel: "Aktive Mitgliedschaft",
      detail: `Mitglied seit ${DATE_FORMAT.format(membership.admittedAt)}`,
      actionLabel: "",
      dot: "bg-emerald-500",
    };
  }

  const suspended = membership.legalStatus === "suspended";
  return {
    heading,
    description: suspended
      ? "Deine Mitgliedschaft ruht aktuell. Deine hinterlegten Daten kannst du weiterhin einsehen."
      : "Deine frühere Mitgliedschaft ist weiterhin dokumentiert und für dich einsehbar.",
    statusLabel: suspended ? "Mitgliedschaft ruhend" : "Mitgliedschaft beendet",
    detail: membership.membershipNumber,
    actionLabel: "Mitgliedschaft ansehen",
    dot: "bg-muted-foreground",
  };
}

function formatEndDate(scheduledEndAt: number) {
  return DATE_FORMAT.format(scheduledEndAt - 1);
}
