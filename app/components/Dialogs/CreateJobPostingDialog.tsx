"use client";

import { SelectDepartment } from "@/components/Selectors/SelectDepartment";
import { SelectTeam } from "@/components/Selectors/SelectTeam";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDepartments } from "@/lib/client/departments/hooks/useDepartments";
import { useJobPostingMutations } from "@/lib/client/jobPostings/hooks/useJobPostingMutations";
import { useTeams } from "@/lib/client/teams/hooks/useTeams";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateJobPostingDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { departments } = useDepartments();
  const { teams } = useTeams();
  const { create } = useJobPostingMutations();
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [teamId, setTeamId] = useState("");
  const departmentTeams = teams.filter(
    (team) => team.departmentId === departmentId,
  );
  const hasDepartmentTeams = departmentTeams.length > 0;

  const reset = () => {
    setTitle("");
    setDepartmentId("");
    setTeamId("");
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value);
    setTeamId("");
  };

  const handleOpenChange = (value: boolean) => {
    if (create.isPending) return;
    if (!value) reset();
    onOpenChange(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !teamId || create.isPending) return;
    try {
      const id = await create.mutateAsync({ title: title.trim(), teamId });
      toast.success("Entwurf erstellt");
      reset();
      onOpenChange(false);
      router.push(`/recruiting/${id}`);
    } catch {
      toast.error("Fehler beim Erstellen");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Ausschreibung</DialogTitle>
        </DialogHeader>

        {departments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Bitte lege zuerst ein aktives Department an.
          </p>
        ) : teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Bitte lege zuerst ein aktives Team an.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="posting-department">Department*</Label>
              <SelectDepartment
                id="posting-department"
                departments={departments}
                value={departmentId || undefined}
                onValueChange={handleDepartmentChange}
                autoFocus
              />
            </div>
            {departmentId && hasDepartmentTeams ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="posting-team">Team*</Label>
                <SelectTeam
                  id="posting-team"
                  teams={departmentTeams}
                  value={teamId || undefined}
                  onValueChange={setTeamId}
                />
              </div>
            ) : null}
            {departmentId && !hasDepartmentTeams ? (
              <p className="text-sm text-muted-foreground">
                In diesem Department gibt es kein aktives Team.
              </p>
            ) : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="posting-title">Titel*</Label>
              <Input
                id="posting-title"
                placeholder="Wonach suchst du?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={!title.trim() || !teamId || create.isPending}
              >
                {create.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Entwurf erstellen
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
