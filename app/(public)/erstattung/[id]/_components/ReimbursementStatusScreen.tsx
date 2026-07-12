import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export function ReimbursementLoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function ReimbursementInvalidScreen({ error }: { error?: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center p-8">
      <div className="text-center max-w-md">
        <AlertCircle className="size-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Link nicht verfügbar</h1>
        <p className="text-muted-foreground">
          {error || "Dieser Link ist ungültig oder wurde bereits verwendet."}
        </p>
      </div>
    </div>
  );
}

export function ReimbursementSubmittedScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center p-8">
      <div className="text-center max-w-md">
        <CheckCircle2 className="size-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Erfolgreich eingereicht</h1>
        <p className="text-muted-foreground">
          Deine Erstattung wurde erfolgreich eingereicht. Du kannst dieses
          Fenster jetzt schließen.
        </p>
      </div>
    </div>
  );
}
