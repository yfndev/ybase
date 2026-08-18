import type { ApplicationWithFiles } from "@/lib/db/types";
import { DATE_TIME_FORMAT } from "./applicationPresentation";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

export function ApplicationDetails({
  application,
}: {
  application: ApplicationWithFiles;
}) {
  const withdrawn = application.status === "withdrawn";
  const phone = application.applicantPhone?.trim();

  return (
    <section className="space-y-4 border-t pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Bewerbungsdetails</h2>
        <ApplicationStatusBadge application={application} />
      </div>
      <dl className="space-y-3">
        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">
            Ausschreibung
          </dt>
          <dd className="text-base">{application.jobPostingTitle}</dd>
        </div>
        {!withdrawn ? (
          <>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">
                E-Mail
              </dt>
              <dd>
                <a
                  className="break-words text-base underline-offset-4 hover:underline"
                  href={`mailto:${application.applicantEmail}`}
                >
                  {application.applicantEmail}
                </a>
              </dd>
            </div>
            {phone ? (
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  Telefon
                </dt>
                <dd>
                  <a
                    className="break-words text-base font-medium underline-offset-4 hover:underline"
                    href={`tel:${phone.replace(/\s/g, "")}`}
                  >
                    {phone}
                  </a>
                </dd>
              </div>
            ) : null}
          </>
        ) : null}
        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">
            Eingegangen
          </dt>
          <dd className="text-base">
            {DATE_TIME_FORMAT.format(application.submittedAt)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
