import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResignationShell } from "../ResignationShell";

export const metadata: Metadata = {
  title: "Austritt bestätigt",
  robots: { index: false, follow: false },
};

export default function ResignationConfirmedPage() {
  return (
    <ResignationShell>
      <Card>
        <CardHeader className="text-center">
          <CheckCircle2
            aria-hidden="true"
            className="mx-auto size-10 text-emerald-600"
          />
          <CardTitle>Austritt bestätigt</CardTitle>
          <CardDescription className="leading-6">
            Die Austrittserklärung wurde verbindlich erfasst. Das Mitglied kann
            das vorgemerkte Mitgliedschaftsende jetzt in YBase einsehen.
          </CardDescription>
        </CardHeader>
      </Card>
    </ResignationShell>
  );
}
