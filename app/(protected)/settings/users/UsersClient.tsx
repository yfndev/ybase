"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { UserRow } from "@/components/Tables/Users/UserRow";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { User, UserRole } from "@/lib/db/types";
import { useIsAdmin } from "@/lib/hooks/useCurrentUserRole";
import { updateUserRole } from "@/lib/server/users/actions";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface Props {
  users: User[];
}

export function UsersClient({ users }: Props) {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    const target = users.find((user) => user._id === userId);
    const adminCount = users.filter((user) => user.role === "admin").length;
    const removesLastAdmin =
      target?.role === "admin" && role !== "admin" && adminCount <= 1;
    if (removesLastAdmin) {
      toast.error(
        "Der letzte Admin kann nicht entfernt werden. Mindestens ein Admin ist erforderlich.",
      );
      return;
    }

    setUpdatingId(userId);
    try {
      await updateUserRole({ userId, role });
      router.refresh();
      toast.success("Rolle aktualisiert");
    } catch {
      toast.error("Fehler beim Aktualisieren der Rolle");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Benutzer" />

      <div className="space-y-6">
        <p className="text-muted-foreground">
          Hier kannst du Benutzer und deren Rollen verwalten.
        </p>

        {users.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              Keine Benutzer gefunden
            </h3>
            <p className="text-muted-foreground mt-2">
              Noch keine Benutzer in deiner Organisation.
            </p>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pr-6">Benutzer</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead className="pr-6">Rolle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <UserRow
                    key={user._id}
                    user={{
                      ...user,
                      role: user.role || "member",
                    }}
                    onRoleChange={handleRoleChange}
                    isAdmin={isAdmin}
                    isUpdating={updatingId === user._id}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
