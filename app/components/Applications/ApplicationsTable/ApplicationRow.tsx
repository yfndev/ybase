import { TableCell, TableRow } from "@/components/ui/table";
import type { ApplicationWithFiles, User } from "@/lib/db/types";
import { ApplicationStatusBadge } from "../ApplicationStatusBadge";

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function ApplicationRow({
  application,
  ownersById,
  showJobPosting,
  onSelect,
}: {
  application: ApplicationWithFiles;
  ownersById: Map<string, User>;
  showJobPosting: boolean;
  onSelect: (application: ApplicationWithFiles) => void;
}) {
  const identity =
    application.status === "withdrawn"
      ? "Anonymisierte Bewerbung"
      : application.applicantName || application.applicantEmail;
  const responsiblePeople = application.ownerIds.flatMap((ownerId) => {
    const owner = ownersById.get(ownerId);
    return owner ? [owner] : [];
  });
  const responsibilityLabel =
    responsiblePeople.length === 0
      ? "–"
      : responsiblePeople
          .map((owner) => owner.name || owner.email || "Unbenannt")
          .join(", ");

  return (
    <TableRow className="cursor-pointer" onClick={() => onSelect(application)}>
      <TableCell className="pl-4">
        <button
          type="button"
          className="flex items-center gap-2 font-medium outline-none hover:underline focus-visible:underline"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(application);
          }}
        >
          {identity}
        </button>
        {application.applicantEmail ? (
          <p className="text-xs text-muted-foreground">
            {application.applicantEmail}
          </p>
        ) : null}
      </TableCell>
      {showJobPosting ? (
        <TableCell>{application.jobPostingTitle}</TableCell>
      ) : null}
      <TableCell>
        <ApplicationStatusBadge application={application} />
      </TableCell>
      {showJobPosting ? (
        <TableCell className="max-w-56 truncate">
          {responsibilityLabel}
        </TableCell>
      ) : (
        <TableCell className="text-muted-foreground">
          {DATE_FORMAT.format(application.updatedAt ?? application.submittedAt)}
        </TableCell>
      )}
      <TableCell className="pr-4 text-muted-foreground">
        {DATE_FORMAT.format(application.submittedAt)}
      </TableCell>
    </TableRow>
  );
}
