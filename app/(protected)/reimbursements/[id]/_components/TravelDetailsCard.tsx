import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters/formatDate";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import {
  getMealAllowanceTotal,
  getMealAllowanceWithLegacyFallback,
} from "@/lib/travel-costs";
import type { Reimbursement } from "./types";

export function TravelDetailsCard({
  travelDetails,
}: {
  travelDetails: NonNullable<Reimbursement["travelDetails"]>;
}) {
  const allowance = getMealAllowanceWithLegacyFallback(travelDetails);
  const mealTotal = getMealAllowanceTotal(allowance);
  const overnightTotal =
    (travelDetails.overnightAllowanceNights ?? 0) *
    (travelDetails.overnightAllowanceRate ?? 0);

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
      <h3 className="font-medium">Reisedetails</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Reiseziel: </span>
          {travelDetails.destination}
        </div>
        <div>
          <span className="text-muted-foreground">Zweck: </span>
          {travelDetails.purpose}
        </div>
        <div>
          <span className="text-muted-foreground">Zeitraum: </span>
          {formatDate(travelDetails.startDate)} –{" "}
          {formatDate(travelDetails.endDate)}
        </div>
        {(travelDetails.startTime || travelDetails.endTime) && (
          <div>
            <span className="text-muted-foreground">Uhrzeit: </span>
            {travelDetails.startTime || "–"} – {travelDetails.endTime || "–"}
          </div>
        )}
        {travelDetails.isInternational && (
          <div>
            <Badge variant="outline">Auslandsreise</Badge>
          </div>
        )}
        {mealTotal > 0 && (
          <div>
            <span className="text-muted-foreground">Verpflegung: </span>
            {formatCurrency(mealTotal)}
          </div>
        )}
        {overnightTotal > 0 && (
          <div>
            <span className="text-muted-foreground">Übernachtungen: </span>
            {travelDetails.overnightAllowanceNights} ×{" "}
            {formatCurrency(travelDetails.overnightAllowanceRate ?? 0)}
          </div>
        )}
      </div>
    </div>
  );
}
