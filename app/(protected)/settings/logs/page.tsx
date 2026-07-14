import { PageHeader } from "@/components/Layout/PageHeader";
import { AccessDenied } from "@/components/Settings/AccessDenied";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { hasPermission, USER_PERMISSIONS } from "@/lib/auth/roles";
import { formatDateTime } from "@/lib/formatters/formatDateTime";
import { getLogs } from "@/lib/server/logs/data";
import { ScrollText } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  "organization.update": "Organisation aktualisiert",
  "project.create": "Projekt erstellt",
  "project.rename": "Projekt umbenannt",
  "project.update": "Projekt aktualisiert",
  "project.archive": "Projekt archiviert",
  "project.unarchive": "Projekt wiederhergestellt",
  "project.delete": "Projekt gelöscht",
  "reimbursement.create": "Erstattung erstellt",
  "reimbursement.approve": "Erstattung genehmigt",
  "reimbursement.decline": "Erstattung abgelehnt",
  "reimbursement.requestChanges": "Änderungen an Erstattung angefordert",
  "reimbursement.resubmit": "Erstattung erneut eingereicht",
  "reimbursement.delete": "Erstattung gelöscht",
  "volunteerAllowance.create": "Ehrenamtspauschale erstellt",
  "volunteerAllowance.approve": "Ehrenamtspauschale genehmigt",
  "volunteerAllowance.decline": "Ehrenamtspauschale abgelehnt",
  "volunteerAllowance.requestChanges":
    "Änderungen an Ehrenamtspauschale angefordert",
  "volunteerAllowance.resubmit": "Ehrenamtspauschale erneut eingereicht",
  "volunteerAllowance.delete": "Ehrenamtspauschale gelöscht",
  "user.role_change": "Rolle geändert",
  "jobPosting.close": "Ausschreibung geschlossen",
  "jobPosting.reopen": "Ausschreibung wieder geöffnet",
  "jobPosting.archive": "Ausschreibung archiviert",
  "jobPosting.tally.publish": "Bewerbungsformular veröffentlicht",
  "jobPosting.tally.error": "Tally-Synchronisierung fehlgeschlagen",
};

export default async function LogsPage() {
  const session = await auth();
  if (!hasPermission(session?.user?.role, USER_PERMISSIONS.auditLogs)) {
    return <AccessDenied title="Logs" />;
  }

  const logs = await getLogs();

  if (!logs.length) {
    return (
      <div>
        <PageHeader title="Logs" />
        <div className="text-center py-12 border rounded-lg">
          <ScrollText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Keine Logs vorhanden</h3>
          <p className="text-muted-foreground mt-2">
            Sobald Aktionen durchgeführt werden, erscheinen sie hier.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Logs" />
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zeitpunkt</TableHead>
              <TableHead>Aktion</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDateTime(log._creationTime)}
                </TableCell>
                <TableCell>{ACTION_LABELS[log.action] ?? log.action}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {log.details || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
