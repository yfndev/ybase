"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

interface ArchivedItem {
  _id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: ArchivedItem[];
  isRestoring: boolean;
  onRestore: (id: string) => Promise<unknown>;
}

export function ArchivedItemsDialog({
  open,
  onOpenChange,
  title,
  items,
  isRestoring,
  onRestore,
}: Props) {
  const handleRestore = async (id: string) => {
    try {
      await onRestore(id);
      toast.success("Wiederhergestellt");
    } catch {
      toast.error("Fehler beim Wiederherstellen");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nichts archiviert</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-2 rounded-md bg-muted"
              >
                <span className="text-sm">{item.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isRestoring}
                  onClick={() => handleRestore(item._id)}
                >
                  Wiederherstellen
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
