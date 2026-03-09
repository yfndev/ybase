"use client";

import { ArchivedProjectsDialog } from "@/components/Dialogs/ArchivedProjectsDialog";
import { CreateProjectDialog } from "@/components/Dialogs/CreateProjectDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCanEdit } from "@/lib/hooks/useCurrentUserRole";
import { useMutation, useQuery } from "convex/react";
import { Archive, ChevronRight, FolderInput, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

type Project = NonNullable<
  ReturnType<typeof useQuery<typeof api.projects.queries.getAllProjects>>
>[number];

type DeleteDialogState = {
  open: boolean;
  projectId: Id<"projects"> | null;
  projectName: string;
  hasLinkedData: boolean;
  mergeTargetId: Id<"projects"> | "";
};

export function ProjectNav({ id }: { id?: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"projects"> | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    projectId: null,
    projectName: "",
    hasLinkedData: false,
    mergeTargetId: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const pathname = usePathname();
  const projects = useQuery(api.projects.queries.getAllProjects);
  const canEdit = useCanEdit();

  const renameProject = useMutation(api.projects.functions.renameProject);
  const archiveProject = useMutation(api.projects.functions.archiveProject);
  const moveProject = useMutation(api.projects.functions.moveProject);
  const checkProjectLinkedData = useMutation(api.projects.functions.checkProjectLinkedData);
  const deleteProject = useMutation(api.projects.functions.deleteProject);

  if (!projects) {
    return (
      <SidebarGroup id={id}>
        <SidebarGroupLabel>Projekte</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1 text-sm text-muted-foreground">
              Laden...
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  const sortByName = (a: Project, b: Project) => {
    if (a.name === "Rücklagen") return -1;
    if (b.name === "Rücklagen") return 1;
    return a.name.localeCompare(b.name);
  };

  const parentProjects = projects
    .filter((project) => !project.parentId)
    .sort(sortByName);

  const getChildren = (parentId: Id<"projects">) =>
    projects
      .filter((project) => project.parentId === parentId)
      .sort(sortByName);

  const handleSave = async () => {
    if (!editingId || !editValue.trim()) return;
    try {
      await renameProject({ projectId: editingId, name: editValue.trim() });
      setEditingId(null);
      toast.success("Projekt umbenannt");
    } catch {
      toast.error("Fehler beim Umbenennen");
    }
  };

  const handleArchive = async (projectId: Id<"projects">) => {
    try {
      await archiveProject({ projectId });
      toast.success("Projekt archiviert");
    } catch {
      toast.error("Du darfst dieses Projekt nicht archivieren");
    }
  };

  const handleMove = async (
    projectId: Id<"projects">,
    newParentId: Id<"projects"> | null
  ) => {
    try {
      await moveProject({ projectId, newParentId });
      toast.success("Projekt verschoben");
    } catch {
      toast.error("Fehler beim Verschieben");
    }
  };

  const handleDeleteClick = async (projectId: Id<"projects">, projectName: string) => {
    try {
      const { hasLinkedData } = await checkProjectLinkedData({ projectId });
      setDeleteDialog({ open: true, projectId, projectName, hasLinkedData, mergeTargetId: "" });
    } catch {
      toast.error("Fehler beim Prüfen des Projekts");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.projectId) return;
    if (deleteDialog.hasLinkedData && !deleteDialog.mergeTargetId) return;

    setIsDeleting(true);
    try {
      await deleteProject({
        projectId: deleteDialog.projectId,
        mergeIntoProjectId: deleteDialog.mergeTargetId || undefined,
      });
      toast.success("Projekt gelöscht");
      setDeleteDialog({ open: false, projectId: null, projectName: "", hasLinkedData: false, mergeTargetId: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen");
    } finally {
      setIsDeleting(false);
    }
  };

  const startEdit = (projectId: Id<"projects">, name: string) => {
    if (!canEdit) return;
    setEditingId(projectId);
    setEditValue(name);
  };

  const handleAddClick = () => {
    setDialogOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setEditingId(null);
  };

  const renderEditInput = () => (
    <div className="px-2 py-1.5">
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        autoFocus
      />
    </div>
  );

  const renderMoveMenu = (
    project: Project,
    availableDepartments: Project[]
  ) => {
    if (getChildren(project._id).length > 0) return null;

    const canMoveToRoot = Boolean(project.parentId);
    const hasDestinations = availableDepartments.length > 0 || canMoveToRoot;
    if (!hasDestinations) return null;

    return (
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <FolderInput className="mr-2 h-4 w-4" />
          Verschieben nach
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          {canMoveToRoot && (
            <ContextMenuItem onClick={() => handleMove(project._id, null)}>
              Kein Department
            </ContextMenuItem>
          )}
          {availableDepartments.map((dept) => (
            <ContextMenuItem
              key={dept._id}
              onClick={() => handleMove(project._id, dept._id)}
            >
              {dept.name}
            </ContextMenuItem>
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>
    );
  };

  const renderProjectLink = (project: Project, isSubItem: boolean) => {
    const hasChildren = getChildren(project._id).length > 0;
    const isReserves = project.name === "Rücklagen" && !project.parentId;

    const handleDoubleClick = isReserves
      ? undefined
      : (e: React.MouseEvent) => {
          e.preventDefault();
          startEdit(project._id, project.name);
        };

    const className = isReserves
      ? "text-gray-400"
      : hasChildren && !isSubItem
        ? "font-semibold"
        : undefined;

    const content = (
      <span className={className} onDoubleClick={handleDoubleClick}>
        {project.name}
      </span>
    );

    const link = <Link href={`/projects/${project._id}`}>{content}</Link>;

    if (isSubItem) {
      return <SidebarMenuSubButton asChild>{link}</SidebarMenuSubButton>;
    }

    return (
      <SidebarMenuButton
        asChild
        tooltip={project.name}
        isActive={pathname === `/projects/${project._id}`}
      >
        {link}
      </SidebarMenuButton>
    );
  };

  const renderContextMenu = (project: Project, isSubItem: boolean) => {
    const isReserves = project.name === "Rücklagen" && !project.parentId;
    const availableDepartments = parentProjects.filter(
      (dept) =>
        dept._id !== project._id &&
        dept._id !== project.parentId &&
        dept.name !== "Rücklagen"
    );

    if (isReserves) return renderProjectLink(project, isSubItem);

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {renderProjectLink(project, isSubItem)}
        </ContextMenuTrigger>
        {canEdit && (
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => startEdit(project._id, project.name)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Umbenennen
            </ContextMenuItem>
            {renderMoveMenu(project, availableDepartments)}
            <ContextMenuItem onClick={() => handleArchive(project._id)}>
              <Archive className="mr-2 h-4 w-4" />
              Archivieren
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleDeleteClick(project._id, project.name)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Löschen
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>
    );
  };

  const renderProject = (project: Project, isSubItem: boolean) => {
    if (editingId === project._id) return renderEditInput();
    return renderContextMenu(project, isSubItem);
  };

  const renderChildren = (parentId: Id<"projects">) => {
    const children = getChildren(parentId);
    if (children.length === 0) return null;

    return (
      <>
        <CollapsibleTrigger asChild>
          <SidebarMenuAction className="data-[state=open]:rotate-90 w-6 h-6">
            <ChevronRight />
            <span className="sr-only">Toggle</span>
          </SidebarMenuAction>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map((child) => (
              <SidebarMenuSubItem key={child._id}>
                {renderProject(child, true)}
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </>
    );
  };

  return (
    <SidebarGroup id={id}>
      <div className="flex items-center justify-between pr-1">
        <SidebarGroupLabel className="font-bold text-sm text-foreground">
          Projekte & Departments
        </SidebarGroupLabel>
        {canEdit && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setArchiveDialogOpen(true)}
              className="p-1 hover:bg-accent rounded"
            >
              <Archive className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={handleAddClick}
              className="p-1 hover:bg-accent rounded"
              aria-label="Projekt hinzufügen"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      <SidebarMenu className="gap-0">
        {parentProjects.map((project) => (
          <Collapsible key={project._id} asChild defaultOpen>
            <SidebarMenuItem>
              {renderProject(project, false)}
              {renderChildren(project._id)}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>

      {canEdit && (
        <>
          <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
          <ArchivedProjectsDialog
            open={archiveDialogOpen}
            onOpenChange={setArchiveDialogOpen}
          />
        </>
      )}

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => !isDeleting && setDeleteDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Projekt löschen</DialogTitle>
            <DialogDescription>
              {deleteDialog.hasLinkedData
                ? `"${deleteDialog.projectName}" hat verknüpfte Transaktionen oder Erstattungen. Wähle ein Zielprojekt, in das alle Daten übernommen werden sollen.`
                : `Möchtest du "${deleteDialog.projectName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
            </DialogDescription>
          </DialogHeader>
          {deleteDialog.hasLinkedData && (
            <Select
              value={deleteDialog.mergeTargetId}
              onValueChange={(value) =>
                setDeleteDialog((prev) => ({ ...prev, mergeTargetId: value as Id<"projects"> }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Zielprojekt auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {projects
                  .filter((p) => p._id !== deleteDialog.projectId && !p.parentId)
                  .map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog((prev) => ({ ...prev, open: false }))}
              disabled={isDeleting}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting || (deleteDialog.hasLinkedData && !deleteDialog.mergeTargetId)}
            >
              {isDeleting ? "Wird gelöscht..." : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarGroup>
  );
}
