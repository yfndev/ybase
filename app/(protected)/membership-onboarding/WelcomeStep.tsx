import Image from "next/image";

export function WelcomeStep() {
  return (
    <section className="space-y-8" aria-label="Willkommen">
      <div className="max-w-[46rem] space-y-3">
        <p className="text-base leading-7 font-medium">
          Herzlichen Glückwunsch und willkommen im Team! Schön, dass du da bist.
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          Bevor du startest, lies bitte die Datenschutzerklärung und
          unterzeichne die Sondervereinbarung zu Arbeitsergebnissen. Das dauert
          nur wenige Minuten.
        </p>
      </div>
      <div className="relative min-h-64 w-full overflow-hidden rounded-[0.25rem] border bg-muted sm:aspect-[16/7]">
        <Image
          src="/yfn-onboarding-team.jpg"
          alt="YFN-Mitglieder bei einer gemeinsamen Veranstaltung"
          fill
          priority
          sizes="(max-width: 768px) 100vw, calc(100vw - 16rem)"
          className="object-cover object-center"
        />
      </div>
    </section>
  );
}
