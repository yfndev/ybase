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
  const { update, archive, remove } = useProjectMutations();

  const [createOpen, setCreateOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    name: "",
    travelDestination: "",
    travelPurpose: "",
  });
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const isUpdating = useRef(false);

  const handleUpdate = async (project: Project) => {
    if (isUpdating.current) return;
    const values = {
      name: editValues.name.trim(),
      travelDestination: editValues.travelDestination.trim(),
      travelPurpose: editValues.travelPurpose.trim(),
    };
    if (!values.name) return;

    const isUnchanged =
      values.name === project.name &&
      values.travelDestination === (project.travelDestination ?? "") &&
      values.travelPurpose === (project.travelPurpose ?? "");
    setEditingId(null);
    if (isUnchanged) return;

    isUpdating.current = true;
    try {
      await update.mutateAsync({ projectId: project._id, ...values });
      toast.success("Projekt aktualisiert");
    } catch {
      toast.error("Fehler beim Aktualisieren");
    } finally {
      isUpdating.current = false;
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
        <div className="flex justify-end">
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
                  <TableHead>Reiseziel</TableHead>
                  <TableHead>Reisezweck</TableHead>
                  <TableHead className="w-px" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <ProjectRow
                    key={project._id}
                    project={project}
                    isEditing={editingId === project._id}
                    editValues={editValues}
                    isArchiving={archive.isPending}
                    onEditValuesChange={(values) =>
                      setEditValues((current) => ({ ...current, ...values }))
                    }
                    onStartEdit={() => {
                      setEditingId(project._id);
                      setEditValues({
                        name: project.name,
                        travelDestination: project.travelDestination ?? "",
                        travelPurpose: project.travelPurpose ?? "",
                      });
                    }}
                    onCancelEdit={() => setEditingId(null)}
                    onUpdate={() => handleUpdate(project)}
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
