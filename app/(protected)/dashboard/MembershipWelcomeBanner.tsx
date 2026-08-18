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
      className="overflow-hidden rounded-none border bg-card"
    >
      <div className="grid md:grid-cols-[minmax(0,1fr)_16rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-h-52 flex-col justify-center px-6 py-6 sm:px-8">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${presentation.dot}`}
            />
            {presentation.statusLabel}
          </p>

          <h2
            id="membership-welcome-title"
            className="mt-3 text-xl leading-tight font-semibold tracking-tight sm:text-2xl"
          >
            {presentation.heading}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            {presentation.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            {canResign ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/membership?resign=1">
                  <LogOut aria-hidden="true" />
                  Mitgliedschaft beenden
                </Link>
              </Button>
            ) : membership ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/membership">
                  {presentation.actionLabel}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline">
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
          </div>
        </div>

        <div className="relative min-h-40 border-t md:min-h-full md:border-t-0 md:border-l">
          <Image
            src="/yfn-onboarding-team.jpg"
            alt="Mitglieder des Young Founders Network bei einem gemeinsamen Teamfoto"
            fill
            priority
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 16rem, 20rem"
            className="object-cover object-[center_52%]"
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
      actionLabel: "Austritt ansehen",
      dot: "bg-amber-500",
    };
  }

  if (membership.legalStatus === "active") {
    return {
      heading,
      description: (
        <>
          Schön, dass du seit dem{" "}
          <strong className="font-semibold text-foreground">
            {DATE_FORMAT.format(membership.admittedAt)}
          </strong>{" "}
          Mitglied unserer Community bist. Hier kannst du deine Mitgliedschaft
          einsehen und verwalten.
        </>
      ),
      statusLabel: "Aktive Mitgliedschaft",
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
    actionLabel: "Mitgliedschaft ansehen",
    dot: "bg-muted-foreground",
  };
}
