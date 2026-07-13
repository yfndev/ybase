export function PluginsUndToolsSection() {
  return (
    <>
      <h2 className="text-2xl font-semibold mt-8 mb-4">5. Plugins und Tools</h2>

      <h3 className="text-xl font-semibold mt-6 mb-3">Google Fonts</h3>
      <p className="mb-4">
        Diese Seite nutzt zur einheitlichen Darstellung eine Google-Schriftart.
        Die Schriftdateien werden zusammen mit der Anwendung auf unseren eigenen
        Servern bereitgestellt und von dort geladen.
      </p>
      <p className="mb-4">
        Beim Seitenaufruf wird deshalb keine Verbindung zu Google-Servern zum
        Laden der Schriftart hergestellt. Rechtsgrundlage ist Art. 6 Abs. 1 lit.
        f DSGVO; unser berechtigtes Interesse liegt in einer einheitlichen und
        performanten Darstellung unseres Angebots.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Google OAuth</h3>
      <p className="mb-4">
        Wir bieten Ihnen die Möglichkeit, sich über Ihr Google-Konto bei unserer
        Website anzumelden. Wenn Sie diese Funktion nutzen, werden Sie auf eine
        Google-Seite weitergeleitet, auf der Sie sich mit Ihren
        Google-Anmeldedaten einloggen können. Nach erfolgreicher
        Authentifizierung erhalten wir von Google bestimmte Profilinformationen,
        darunter Ihren Namen und Ihre E-Mail-Adresse.
      </p>
      <p className="mb-4">
        Die Nutzung von Google OAuth erfolgt auf Grundlage von Art. 6 Abs. 1
        lit. a DSGVO (Einwilligung) und Art. 6 Abs. 1 lit. b DSGVO
        (Vertragserfüllung). Sie können die Verknüpfung Ihres Google-Kontos mit
        unserem Dienst jederzeit in Ihren Google-Kontoeinstellungen widerrufen.
      </p>
      <p className="mb-4">
        Anbieter: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4,
        Irland.
      </p>
      <p className="mb-4">
        Weitere Informationen finden Sie in der Datenschutzerklärung von Google:{" "}
        <a
          href="https://policies.google.com/privacy?hl=de"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://policies.google.com/privacy?hl=de
        </a>
        .
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">PostHog</h3>
      <p className="mb-4">
        Wir nutzen PostHog für Webanalyse und Produktanalysen. PostHog ist eine
        Open-Source-Plattform für Produktanalyse, die uns hilft zu verstehen,
        wie Nutzer unsere Website verwenden.
      </p>
      <p className="mb-4">
        PostHog erfasst Daten wie Seitenaufrufe, Klicks und andere Interaktionen
        auf unserer Website. Diese Daten werden anonymisiert und dienen
        ausschließlich zur Verbesserung unseres Angebots.
      </p>
      <p className="mb-4">
        Die Nutzung von PostHog erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f
        DSGVO. Wir haben ein berechtigtes Interesse an der Analyse des
        Nutzerverhaltens, um unser Webangebot zu optimieren.
      </p>
      <p className="mb-4">
        Anbieter: PostHog Inc., 2261 Market Street #4008, San Francisco, CA
        94114, USA.
      </p>
      <p className="mb-4">
        Weitere Informationen finden Sie in der Datenschutzerklärung von
        PostHog:{" "}
        <a
          href="https://posthog.com/privacy"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://posthog.com/privacy
        </a>
        .
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Brevo</h3>
      <p className="mb-4">
        Wir nutzen Brevo für den Versand transaktionaler E-Mails, beispielsweise
        für Statusmeldungen zu eingereichten Erstattungen. Dabei werden die für
        den Versand erforderliche E-Mail-Adresse und die Inhalte der Nachricht
        an Brevo übermittelt.
      </p>
      <p className="mb-4">
        Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO
        (Vertragserfüllung) und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
        Interesse an einer zuverlässigen Kommunikation).
      </p>
      <p className="mb-4">
        Anbieter: Brevo, Sendinblue GmbH, Köpenicker Straße 126, 10179 Berlin,
        Deutschland.
      </p>
      <p className="mb-4">
        Weitere Informationen finden Sie in der Datenschutzerklärung von Brevo:{" "}
        <a
          href="https://www.brevo.com/de/legal/privacypolicy/"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://www.brevo.com/de/legal/privacypolicy/
        </a>
        .
      </p>
    </>
  );
}
