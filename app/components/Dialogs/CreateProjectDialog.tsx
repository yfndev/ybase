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
import { createProject } from "@/lib/server/projects/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (projectId: string) => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
}: Props) {
  const [name, setName] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (!name.trim()) return;

    try {
      const projectId = await createProject({ name: name.trim() });
      router.refresh();
      toast.success("Projekt erstellt!");
      onProjectCreated?.(projectId);
      onOpenChange(false);
      setName("");
    } catch {
      toast.error("Fehler beim Erstellen.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neues Projekt erstellen</DialogTitle>
          <DialogDescription>
            Erstelle ein neues Projekt (z.B. ein Event oder eine Aktion) für
            deine Organisation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Projekt erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
