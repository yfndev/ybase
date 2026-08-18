export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="block text-sm font-medium">
          {label}
        </label>
      ) : (
        <p className="text-sm font-medium">{label}</p>
      )}
      {children}
    </div>
  );
}
