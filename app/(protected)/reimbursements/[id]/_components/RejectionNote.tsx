export function RejectionNote({
  note,
  changesRequested = false,
}: {
  note: string;
  changesRequested?: boolean;
}) {
  return (
    <div
      className={
        changesRequested
          ? "rounded-lg border border-orange-200 bg-orange-50 p-4"
          : "rounded-lg border border-red-200 bg-red-50 p-4"
      }
    >
      <p
        className={
          changesRequested
            ? "text-sm font-medium text-orange-800"
            : "text-sm font-medium text-red-800"
        }
      >
        {changesRequested ? "Angeforderte Änderungen:" : "Ablehnungsgrund:"}
      </p>
      <p className={changesRequested ? "text-orange-700" : "text-red-700"}>
        {note}
      </p>
    </div>
  );
}
