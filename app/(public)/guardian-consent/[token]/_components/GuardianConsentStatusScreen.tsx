import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type Props =
  | { status: "loading" }
  | { status: "invalid"; error: string }
  | { status: "complete" };

export function GuardianConsentStatusScreen(props: Props) {
  if (props.status === "loading") {
    return <StatusScreen icon={<Loader2 className="size-8 animate-spin" />} />;
  }

  if (props.status === "invalid") {
    return (
      <StatusScreen
        icon={<AlertCircle className="size-14 text-destructive" />}
        title="Link nicht verfügbar"
        text={props.error}
      />
    );
  }

  return (
    <StatusScreen
      icon={<CheckCircle2 className="size-14 text-green-600" />}
      title="Zustimmung gespeichert"
      text="Das YFN-Team wurde informiert. Dieses Fenster kann geschlossen werden."
    />
  );
}

function StatusScreen({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title?: string;
  text?: string;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        {icon}
        {title ? <h1 className="text-2xl font-semibold">{title}</h1> : null}
        {text ? <p className="text-muted-foreground">{text}</p> : null}
      </div>
    </main>
  );
}
