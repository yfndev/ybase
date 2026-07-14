"use client";

import { SelectDepartment } from "@/components/Selectors/SelectDepartment";
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
import { useTeamMutations } from "@/lib/client/teams/hooks/useTeamMutations";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTeamDialog({ open, onOpenChange }: Props) {
  const { departments } = useDepartments();
  const { create } = useTeamMutations();
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const reset = () => {
    setName("");
    setDepartmentId("");
  };

  const handleOpenChange = (value: boolean) => {
    if (create.isPending) return;
    if (!value) reset();
    onOpenChange(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !departmentId || create.isPending) return;
    try {
      await create.mutateAsync({ name: name.trim(), departmentId });
      toast.success("Team erstellt");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Fehler beim Erstellen");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neues Team erstellen</DialogTitle>
        </DialogHeader>

        {departments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Bitte lege zuerst ein aktives Department an.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="team-name">Team-Name*</Label>
              <Input
                id="team-name"
                placeholder="Wie soll es heißen?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="team-department">Department*</Label>
              <SelectDepartment
                id="team-department"
                departments={departments}
                value={departmentId || undefined}
                onValueChange={setDepartmentId}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={!name.trim() || !departmentId || create.isPending}
              >
                {create.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Team erstellen
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
