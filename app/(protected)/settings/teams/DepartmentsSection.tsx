"use client";

import { ArchivedItemsDialog } from "@/components/Dialogs/ArchivedItemsDialog";
import { CreateDepartmentDialog } from "@/components/Dialogs/CreateDepartmentDialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDepartmentMutations } from "@/lib/client/departments/hooks/useDepartmentMutations";
import { useDepartments } from "@/lib/client/departments/hooks/useDepartments";
import { Archive, Building2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { DepartmentRow } from "./DepartmentRow";

export function DepartmentsSection() {
  const { departments, isLoading } = useDepartments();
  const { departments: archived } = useDepartments(true);
  const { update, archive, unarchive } = useDepartmentMutations();

  const [createOpen, setCreateOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleUpdate = async (departmentId: string, currentName: string) => {
    const name = editName.trim();
    setEditingId(null);
    if (!name || name === currentName) return;
    try {
      await update.mutateAsync({ departmentId, name });
      toast.success("Department aktualisiert");
    } catch {
      toast.error("Fehler beim Aktualisieren");
    }
  };

  const handleArchive = async (departmentId: string) => {
    try {
      await archive.mutateAsync({ departmentId });
      toast.success("Department archiviert");
    } catch {
      toast.error("Fehler beim Archivieren");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Departments</h2>
        <Button variant="ghost" size="sm" onClick={() => setArchivedOpen(true)}>
          <Archive className="h-4 w-4" />
          Archiv
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center">Lädt…</p>
      ) : departments.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">Keine Departments</h3>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Department erstellen
          </Button>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pr-6">
                  <div className="flex items-center gap-2">
                    Department
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setCreateOpen(true)}
                      title="Department erstellen"
                      aria-label="Department erstellen"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <DepartmentRow
                  key={department._id}
                  department={department}
                  isEditing={editingId === department._id}
                  editName={editName}
                  isArchiving={archive.isPending}
                  onEditNameChange={setEditName}
                  onStartEdit={() => {
                    setEditingId(department._id);
                    setEditName(department.name);
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onUpdate={() => handleUpdate(department._id, department.name)}
                  onArchive={() => handleArchive(department._id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateDepartmentDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ArchivedItemsDialog
        open={archivedOpen}
        onOpenChange={setArchivedOpen}
        title="Archivierte Departments"
        items={archived}
        isRestoring={unarchive.isPending}
        onRestore={(departmentId) => unarchive.mutateAsync({ departmentId })}
      />
    </section>
  );
}
