export function WelcomeStep() {
  return (
    <section className="max-w-[42rem] space-y-3" aria-label="Willkommen">
      <p className="text-base leading-7 font-medium">
        Herzlichen Glückwunsch und willkommen im Team! Schön, dass du da bist.
      </p>
      <p className="text-sm leading-6 text-muted-foreground">
        Bevor du startest, lies bitte die Datenschutzerklärung und unterzeichne
        die Sondervereinbarung zu Arbeitsergebnissen. Das dauert nur wenige
        Minuten.
      </p>
    </section>
  );
}
