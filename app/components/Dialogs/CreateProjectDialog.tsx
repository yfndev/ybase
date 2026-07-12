"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectTravelDefaults } from "@/lib/db/types";
import { createProject } from "@/lib/server/projects/actions";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (
    projectId: string,
    travelDefaults: ProjectTravelDefaults,
  ) => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
}: Props) {
  const [name, setName] = useState("");
  const [travelDestination, setTravelDestination] = useState("");
  const [travelPurpose, setTravelPurpose] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleOpenChange = (value: boolean) => {
    if (isSubmitting) return;
    if (!value) {
      setName("");
      setTravelDestination("");
      setTravelPurpose("");
    }
    onOpenChange(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const project = {
        name: name.trim(),
        travelDestination: travelDestination.trim(),
        travelPurpose: travelPurpose.trim(),
      };
      const projectId = await createProject(project);
      router.refresh();
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projekt erstellt");
      onProjectCreated?.(projectId, project);
      onOpenChange(false);
      setName("");
      setTravelDestination("");
      setTravelPurpose("");
    } catch {
      toast.error("Fehler beim Erstellen");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neues Projekt erstellen</DialogTitle>
          <DialogDescription>
            Erstelle ein neues Projekt (z.B. ein Event oder eine Aktion) für
            deine Organisation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">Projektname*</Label>
            <Input
              id="project-name"
              placeholder="Wie soll es heißen?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-travel-destination">Reiseziel</Label>
              <Input
                id="project-travel-destination"
                placeholder="z.B. Hamburg"
                value={travelDestination}
                onChange={(e) => setTravelDestination(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-travel-purpose">Reisezweck</Label>
              <Input
                id="project-travel-purpose"
                placeholder="z.B. Team-Wochenende"
                value={travelPurpose}
                onChange={(e) => setTravelPurpose(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Projekt erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
