"use client";

import { ArchivedProjectsDialog } from "@/components/Dialogs/ArchivedProjectsDialog";
import { CreateProjectDialog } from "@/components/Dialogs/CreateProjectDialog";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProjectMutations } from "@/lib/client/projects/hooks/useProjectMutations";
import { useProjects } from "@/lib/client/projects/hooks/useProjects";
import type { Project } from "@/lib/db/types";
import { checkProjectLinkedData } from "@/lib/server/projects/actions";
import { Archive, FolderKanban, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { ProjectRow } from "./ProjectRow";

export function ProjectsClient() {
  const { projects, isLoading } = useProjects();
  const { projects: archivedProjects } = useProjects(true);
  const { rename, archive, remove } = useProjectMutations();

  const [createOpen, setCreateOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const isRenaming = useRef(false);

  const handleRename = async (project: Project) => {
    if (isRenaming.current) return;
    const name = editName.trim();
    setEditingId(null);
    if (!name || name === project.name) return;
    isRenaming.current = true;
    try {
      await rename.mutateAsync({ projectId: project._id, name });
      toast.success("Projekt umbenannt");
    } catch {
      toast.error("Fehler beim Umbenennen");
    } finally {
      isRenaming.current = false;
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

  const handleDelete = async () => {
    if (!deleteProject) return;
    const projectId = deleteProject._id;
    try {
      const { hasLinkedData } = await checkProjectLinkedData({ projectId });
      if (hasLinkedData) {
        toast.error(
          "Löschen nicht möglich: Es sind noch Erstattungen mit diesem Projekt verknüpft. Archiviere es stattdessen.",
        );
        return;
      }
      await remove.mutateAsync({ projectId });
      toast.success("Projekt gelöscht");
    } catch {
      toast.error("Fehler beim Löschen");
    } finally {
      setDeleteProject(null);
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
                        title="Projekt erstellen"
                        aria-label="Projekt erstellen"
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
                  <ProjectRow
                    key={project._id}
                    project={project}
                    isEditing={editingId === project._id}
                    editName={editName}
                    isArchiving={archive.isPending}
                    onEditNameChange={setEditName}
                    onStartEdit={() => {
                      setEditingId(project._id);
                      setEditName(project.name);
                    }}
                    onCancelEdit={() => setEditingId(null)}
                    onRename={() => handleRename(project)}
                    onArchive={() => handleArchive(project._id)}
                    onDelete={() => setDeleteProject(project)}
                  />
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
      <DeleteProjectDialog
        open={deleteProject !== null}
        projectName={deleteProject?.name ?? ""}
        isDeleting={remove.isPending}
        onCancel={() => setDeleteProject(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
