"use client";

import { Megaphone, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { CreateJobPostingDialog } from "@/components/Dialogs/CreateJobPostingDialog";
import { DeleteJobPostingDialog } from "@/components/JobPostings/DeleteJobPostingDialog";
import { JobPostingActionsMenu } from "@/components/JobPostings/JobPostingActionsMenu";
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
import { useJobPostingMutations } from "@/lib/client/jobPostings/hooks/useJobPostingMutations";
import { useJobPostings } from "@/lib/client/jobPostings/hooks/useJobPostings";
import { useTeamDirectory } from "@/lib/client/teams/hooks/useTeamDirectory";
import type { JobPosting } from "@/lib/db/types";
import { jobPostingUrgency } from "@/lib/jobPostings/urgency";
import { cn } from "@/lib/utils";

export function RecruitingClient() {
  const router = useRouter();
  const { jobPostings, isLoading } = useJobPostings();
  const { lookup } = useTeamDirectory();
  const { archive, deletePosting } = useJobPostingMutations();
  const [createOpen, setCreateOpen] = useState(false);
  const [postingToDelete, setPostingToDelete] = useState<JobPosting | null>(
    null,
  );

  const handleArchive = async (posting: JobPosting) => {
    try {
      await archive.mutateAsync({ jobPostingId: posting._id });
      toast.success("Ausschreibung archiviert");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Archivieren fehlgeschlagen",
      );
    }
  };

  const handleDelete = async () => {
    if (!postingToDelete) return;
    try {
      await deletePosting.mutateAsync({
        jobPostingId: postingToDelete._id,
      });
      toast.success("Ausschreibung gelöscht");
      setPostingToDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Ausschreibung konnte nicht gelöscht werden",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Ausschreibungen" />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Neue Ausschreibung
        </Button>
      </div>

      <section className="space-y-4">
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
                  const isUrgent =
                    jobPostingUrgency(posting.urgency) === "urgent";
                  return (
                    <TableRow
                      key={posting._id}
                      className={cn(
                        "cursor-pointer",
                        isUrgent &&
                          "border-l-4 border-l-secondary bg-secondary/[0.06] hover:bg-secondary/10",
                      )}
                      onClick={() => router.push(`/recruiting/${posting._id}`)}
                    >
                      <TableCell className="font-medium">
                        <Link
                          href={`/recruiting/${posting._id}`}
                          className="outline-none hover:underline focus-visible:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {posting.title}
                        </Link>
                      </TableCell>
                      <TableCell>{info?.teamName ?? "–"}</TableCell>
                      <TableCell>{info?.departmentName ?? "–"}</TableCell>
                      <TableCell>
                        <JobPostingStatusBadge status={posting.status} />
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <JobPostingActionsMenu
                          posting={posting}
                          disabled={
                            archive.isPending || deletePosting.isPending
                          }
                          onArchive={() => void handleArchive(posting)}
                          onDelete={() => setPostingToDelete(posting)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <CreateJobPostingDialog open={createOpen} onOpenChange={setCreateOpen} />
      {postingToDelete ? (
        <DeleteJobPostingDialog
          postingTitle={postingToDelete.title}
          open
          isDeleting={deletePosting.isPending}
          onOpenChange={(open) => !open && setPostingToDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}
