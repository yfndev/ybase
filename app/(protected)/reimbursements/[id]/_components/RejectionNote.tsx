export function RejectionNote({ note }: { note: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-sm font-medium text-red-800">Ablehnungsgrund:</p>
      <p className="text-red-700">{note}</p>
    </div>
  );
}
