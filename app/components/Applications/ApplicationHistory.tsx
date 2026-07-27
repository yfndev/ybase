import { ArrowRight } from "lucide-react";
import { APPLICATION_STATUS_LABELS } from "@/lib/applications/status";
import type { ApplicationWithFiles, User } from "@/lib/db/types";
import { DATE_TIME_FORMAT } from "./applicationPresentation";

export function ApplicationHistory({
  application,
  ownersById,
}: {
  application: ApplicationWithFiles;
  ownersById: Map<string, User>;
}) {
  return (
    <section className="flex flex-col gap-3 border-t pt-5 pb-4">
      <h3 className="text-xl font-semibold">Timeline</h3>
      <ol className="space-y-3">
        {(application.history ?? [])
          .toSorted((left, right) => right.timestamp - left.timestamp)
          .map((entry) => {
            const actor = ownersById.get(entry.actorUserId);
            return (
              <li key={entry._id} className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {entry.fromStatus && entry.toStatus ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span>{APPLICATION_STATUS_LABELS[entry.fromStatus]}</span>
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                      <span>{APPLICATION_STATUS_LABELS[entry.toStatus]}</span>
                    </span>
                  ) : (
                    entry.details
                  )}
                </span>
                <span className="text-base">
                  {DATE_TIME_FORMAT.format(entry.timestamp)} ·{" "}
                  {actor?.name || actor?.email || "System"}
                </span>
              </li>
            );
          })}
        <li className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">
            Bewerbung eingegangen
          </span>
          <span className="text-base">
            {DATE_TIME_FORMAT.format(application.submittedAt)} · System
          </span>
        </li>
      </ol>
    </section>
  );
}
