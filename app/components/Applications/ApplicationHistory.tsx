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
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Verlauf</h3>
      <ol className="space-y-3 border-l pl-4">
        {(application.history ?? [])
          .toSorted((left, right) => right.timestamp - left.timestamp)
          .map((entry) => {
            const actor = ownersById.get(entry.actorUserId);
            return (
              <li
                key={entry._id}
                className="relative text-sm before:absolute before:-left-[21px] before:top-1.5 before:size-2 before:rounded-full before:bg-primary"
              >
                <p>{entry.details}</p>
                <p className="text-xs text-muted-foreground">
                  {actor?.name || actor?.email || "System"} ·{" "}
                  {DATE_TIME_FORMAT.format(entry.timestamp)}
                </p>
              </li>
            );
          })}
        <li className="relative text-sm before:absolute before:-left-[21px] before:top-1.5 before:size-2 before:rounded-full before:bg-muted-foreground">
          <p>Bewerbung eingegangen</p>
          <p className="text-xs text-muted-foreground">
            System · {DATE_TIME_FORMAT.format(application.submittedAt)}
          </p>
        </li>
      </ol>
    </section>
  );
}
