"use client";

import { ArchivedItemsDialog } from "@/components/Dialogs/ArchivedItemsDialog";
import { CreateTeamDialog } from "@/components/Dialogs/CreateTeamDialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDepartments } from "@/lib/client/departments/hooks/useDepartments";
import { useTeamMutations } from "@/lib/client/teams/hooks/useTeamMutations";
import { useTeams } from "@/lib/client/teams/hooks/useTeams";
import { Archive, Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { TeamRow } from "./TeamRow";

export function TeamsSection() {
  const { teams, isLoading } = useTeams();
  const { teams: archivedTeams } = useTeams(true);
  const { departments } = useDepartments();
  const { departments: archivedDepartments } = useDepartments(true);
  const { update, archive, unarchive } = useTeamMutations();

  const [createOpen, setCreateOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ name: "", departmentId: "" });

  const departmentNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const department of [...departments, ...archivedDepartments]) {
      map.set(department._id, department.name);
    }
    return map;
  }, [departments, archivedDepartments]);

  const handleUpdate = async (teamId: string) => {
    const name = editValues.name.trim();
    const { departmentId } = editValues;
    setEditingId(null);
    if (!name || !departmentId) return;
    try {
      await update.mutateAsync({ teamId, name, departmentId });
      toast.success("Team aktualisiert");
    } catch {
      toast.error("Fehler beim Aktualisieren");
    }
  };

  const handleArchive = async (teamId: string) => {
    try {
      await archive.mutateAsync({ teamId });
      toast.success("Team archiviert");
    } catch {
      toast.error("Fehler beim Archivieren");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Teams</h2>
        <Button variant="ghost" size="sm" onClick={() => setArchivedOpen(true)}>
          <Archive className="h-4 w-4" />
          Archiv
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center">Lädt…</p>
      ) : teams.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">Keine Teams</h3>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Team erstellen
          </Button>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pr-6">
                  <div className="flex items-center gap-2">
                    Team
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setCreateOpen(true)}
                      title="Team erstellen"
                      aria-label="Team erstellen"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TeamRow
                  key={team._id}
                  team={team}
                  departmentName={departmentNames.get(team.departmentId) ?? "–"}
                  departments={departments}
                  isEditing={editingId === team._id}
                  editValues={editValues}
                  isArchiving={archive.isPending}
                  onEditValuesChange={(values) =>
                    setEditValues((current) => ({ ...current, ...values }))
                  }
                  onStartEdit={() => {
                    setEditingId(team._id);
                    setEditValues({
                      name: team.name,
                      departmentId: team.departmentId,
                    });
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onUpdate={() => handleUpdate(team._id)}
                  onArchive={() => handleArchive(team._id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ArchivedItemsDialog
        open={archivedOpen}
        onOpenChange={setArchivedOpen}
        title="Archivierte Teams"
        items={archivedTeams}
        isRestoring={unarchive.isPending}
        onRestore={(teamId) => unarchive.mutateAsync({ teamId })}
      />
    </section>
  );
}
