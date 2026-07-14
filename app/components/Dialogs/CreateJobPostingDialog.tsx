"use client";

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
  const { teams } = useTeams();
  const { create } = useJobPostingMutations();
  const [title, setTitle] = useState("");
  const [teamId, setTeamId] = useState("");

  const reset = () => {
    setTitle("");
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

        {teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Bitte lege zuerst ein aktives Team an.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="posting-title">Titel*</Label>
              <Input
                id="posting-title"
                placeholder="Wonach suchst du?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="posting-team">Team*</Label>
              <SelectTeam
                id="posting-team"
                teams={teams}
                value={teamId || undefined}
                onValueChange={setTeamId}
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
