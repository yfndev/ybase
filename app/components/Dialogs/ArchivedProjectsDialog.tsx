"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProjectMutations } from "@/lib/client/projects/hooks/useProjectMutations";
import type { Project } from "@/lib/db/types";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  archivedProjects: Project[];
}

export function ArchivedProjectsDialog({
  open,
  onOpenChange,
  archivedProjects,
}: Props) {
  const { unarchive } = useProjectMutations();

  const handleUnarchive = async (projectId: string) => {
    try {
      await unarchive.mutateAsync({ projectId });
      toast.success("Projekt wiederhergestellt");
    } catch {
      toast.error("Fehler beim Wiederherstellen");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Archivierte Projekte</DialogTitle>
        </DialogHeader>
        {archivedProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keine archivierten Projekte
          </p>
        ) : (
          <div className="space-y-2">
            {archivedProjects.map((project) => (
              <div
                key={project._id}
                className="flex items-center justify-between p-2 rounded-md bg-muted"
              >
                <span className="text-sm">{project.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={unarchive.isPending}
                  onClick={() => handleUnarchive(project._id)}
                >
                  Wiederherstellen
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
