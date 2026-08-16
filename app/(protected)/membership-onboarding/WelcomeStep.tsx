import Image from "next/image";

export function WelcomeStep() {
  return (
    <section className="space-y-6" aria-label="Willkommen">
      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-[0.25rem] border bg-muted sm:aspect-[3/1]">
        <Image
          src="/yfn-onboarding-celebration.jpg"
          alt="Mitglieder des Young Founders Network bei einem gemeinsamen Teamfoto"
          fill
          priority
          sizes="(max-width: 768px) 100vw, calc(100vw - 16rem)"
          className="object-cover object-[center_52%]"
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
