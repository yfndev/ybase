"use client";

import { CreateJobPostingDialog } from "@/components/Dialogs/CreateJobPostingDialog";
import { JobPostingStatusBadge } from "@/components/JobPostings/JobPostingStatusBadge";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useJobPostings } from "@/lib/client/jobPostings/hooks/useJobPostings";
import { useTeamDirectory } from "@/lib/client/teams/hooks/useTeamDirectory";
import { Megaphone, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function RecruitingClient() {
  const { jobPostings, isLoading } = useJobPostings();
  const { lookup } = useTeamDirectory();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Ausschreibungen" />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Neue Ausschreibung
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center">Lädt…</p>
      ) : jobPostings.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <Megaphone className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">Keine Ausschreibungen</h3>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobPostings.map((posting) => {
                const info = lookup.get(posting.teamId);
                return (
                  <TableRow key={posting._id}>
                    <TableCell className="font-medium">
                      {posting.title}
                    </TableCell>
                    <TableCell>{info?.teamName ?? "–"}</TableCell>
                    <TableCell>{info?.departmentName ?? "–"}</TableCell>
                    <TableCell>
                      <JobPostingStatusBadge status={posting.status} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/recruiting/${posting._id}`}>
                          <Pencil className="h-4 w-4" />
                          Bearbeiten
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateJobPostingDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
