"use client";

import { ArchivedProjectsDialog } from "@/components/Dialogs/ArchivedProjectsDialog";
import { CreateProjectDialog } from "@/components/Dialogs/CreateProjectDialog";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProjectMutations } from "@/lib/client/projects/hooks/useProjectMutations";
import { useProjects } from "@/lib/client/projects/hooks/useProjects";
import { Archive, FolderKanban, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

export function ProjectsClient() {
  const { projects, isLoading } = useProjects();
  const { projects: archivedProjects } = useProjects(true);
  const { rename, archive, remove } = useProjectMutations();

  const [createOpen, setCreateOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleRename = async (projectId: string) => {
    const name = editName.trim();
    setEditingId(null);
    if (!name) return;
    try {
      await rename.mutateAsync({ projectId, name });
      toast.success("Projekt umbenannt");
    } catch {
      toast.error("Fehler beim Umbenennen");
    }
  };

  const handleArchive = async (projectId: string) => {
    try {
      await archive.mutateAsync({ projectId });
      toast.success("Projekt archiviert");
    } catch {
      toast.error("Fehler beim Archivieren");
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Projekt wirklich löschen?")) return;
    try {
      await remove.mutateAsync({ projectId });
      toast.success("Projekt gelöscht");
    } catch {
      toast.error(
        "Löschen nicht möglich. Es sind noch Erstattungen mit diesem Projekt verknüpft.",
      );
    }
  };

  return (
    <div>
      <PageHeader title="Projekte" />

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground">
            Projekte (z.B. Events oder Aktionen), denen Erstattungen zugeordnet
            werden.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setArchivedOpen(true)}
          >
            <Archive className="h-4 w-4" />
            Archiv
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground py-12 text-center">Lädt…</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Keine Projekte</h3>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Projekt erstellen
            </Button>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pr-6">
                    <div className="flex items-center gap-2">
                      Projekt
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setCreateOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="w-px" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project._id}>
                    <TableCell>
                      {editingId === project._id ? (
                        <Input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => handleRename(project._id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(project._id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => {
                            setEditingId(project._id);
                            setEditName(project.name);
                          }}
                        >
                          {project.name}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Archivieren"
                          onClick={() => handleArchive(project._id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          title="Löschen"
                          onClick={() => handleDelete(project._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ArchivedProjectsDialog
        open={archivedOpen}
        onOpenChange={setArchivedOpen}
        archivedProjects={archivedProjects}
      />
    </div>
  );
}
