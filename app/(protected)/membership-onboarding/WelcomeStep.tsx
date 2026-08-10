import Image from "next/image";

export function WelcomeStep() {
  return (
    <section className="space-y-6" aria-label="Willkommen">
      <div className="relative h-44 w-full overflow-hidden rounded-[0.25rem] border bg-muted sm:h-52">
        <Image
          src="/yfn-onboarding-team.jpg"
          alt="Die Young Founders Network Community bei einer gemeinsamen Veranstaltung"
          fill
          priority
          sizes="(max-width: 768px) 100vw, calc(100vw - 16rem)"
          className="object-cover object-center"
        />
      </div>
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
    </section>
  );
}
