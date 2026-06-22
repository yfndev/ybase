import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters/formatDate";
import type { Reimbursement } from "./types";

export function TravelDetailsCard({
  travelDetails,
}: {
  travelDetails: NonNullable<Reimbursement["travelDetails"]>;
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
      <h3 className="font-medium">Reisedetails</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Reiseziel:</span>
          {travelDetails.destination}
        </div>
        <div>
          <span className="text-muted-foreground">Zweck:</span>
          {travelDetails.purpose}
        </div>
        <div>
          <span className="text-muted-foreground">Zeitraum:</span>
          {formatDate(travelDetails.startDate)} –
          {formatDate(travelDetails.endDate)}
        </div>
        {travelDetails.isInternational && (
          <div>
            <Badge variant="outline">Auslandsreise</Badge>
          </div>
        )}
      </div>
    </div>
  );
}
