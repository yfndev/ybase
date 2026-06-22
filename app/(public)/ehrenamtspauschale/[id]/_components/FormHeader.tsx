import type { ValidAllowanceLink } from "./types";

export function FormHeader({ linkData }: { linkData: ValidAllowanceLink }) {
  const address = [
    linkData.organizationStreet,
    linkData.organizationPlz,
    linkData.organizationCity,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">Ehrenamtspauschale</h1>
      <p className="text-muted-foreground mt-2">
        {linkData.organizationName} - {linkData.projectName}
      </p>
      {(linkData.organizationStreet || linkData.organizationCity) && (
        <p className="text-sm text-muted-foreground mt-1">{address}</p>
      )}
    </div>
  );
}
