"use client";

import { CreateProjectDialog } from "@/components/Dialogs/CreateProjectDialog";
import type { Project } from "@/lib/db/types";
import { focusNextInput } from "@/lib/focusNextInput";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: string | undefined;
  onValueChange: (value: string) => void;
  projects: Project[];
  autoFocus?: boolean;
}

export function SelectProject({
  value,
  onValueChange,
  projects,
  autoFocus,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = projects.find((project) => project._id === value);
  const filtered = projects.filter(
    (project) =>
      !project.isArchived &&
      project.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const close = () => {
    setOpen(false);
    setSearch("");
  };

  const handleSelect = (id: string) => {
    onValueChange(id === value ? "" : id);
    close();
    setTimeout(() => focusNextInput(inputRef.current), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
        close();
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) setOpen(true);
        else setHighlightedIndex((idx) => (idx + 1) % filtered.length);
        break;
      case "ArrowUp":
        if (open) {
          e.preventDefault();
          setHighlightedIndex(
            (idx) => (idx - 1 + filtered.length) % filtered.length,
          );
        }
        break;
      case "Enter":
        e.preventDefault();
        if (open && filtered[highlightedIndex])
          handleSelect(filtered[highlightedIndex]._id);
        else if (!open) setOpen(true);
        break;
    }
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        <input
          ref={inputRef}
          className={cn(
            "h-9 w-full bg-muted px-3 pr-8 text-sm outline-none border border-transparent focus:border-ring",
            open || !selected ? "text-muted-foreground" : "text-foreground",
          )}
          placeholder="Projekt suchen..."
          value={open ? search : (selected?.name ?? "")}
          onChange={(e) => {
            setSearch(e.target.value);
            setHighlightedIndex(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          aria-expanded={open}
        />
        <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />

        {open && (
          <div className="absolute mt-1 w-full bg-background border rounded-md shadow-lg z-50 max-h-64 overflow-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Keine Projekte gefunden
              </div>
            )}
            {filtered.map((project, index) => (
              <button
                key={project._id}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 text-sm flex items-center justify-between",
                  index === highlightedIndex && "bg-accent",
                )}
                onClick={() => handleSelect(project._id)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {project.name}
                {value === project._id && <Check className="h-4 w-4" />}
              </button>
            ))}
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-foreground flex items-center gap-2 border-t hover:bg-accent"
              onClick={() => {
                setDialogOpen(true);
                close();
              }}
            >
              <Plus className="h-4 w-4" />
              Neues Projekt erstellen
            </button>
          </div>
        )}
      </div>

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onProjectCreated={onValueChange}
      />
    </>
  );
}
