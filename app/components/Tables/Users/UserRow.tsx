import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import type { UserRole } from "@/lib/db/types";
import { getInitials } from "@/lib/formatters/getInitials";
import { Shield } from "lucide-react";

interface Props {
  user: {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
    role: UserRole;
  };
  onRoleChange: (userId: string, role: UserRole) => void;
  isAdmin: boolean;
}

export function UserRow({ user, onRoleChange, isAdmin }: Props) {
  return (
    <TableRow>
      <TableCell className="pl-6">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.image} />
            <AvatarFallback>
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">
            {user.name || "Unbekannter Benutzer"}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {user.email || "Keine E-Mail"}
      </TableCell>
      <TableCell className="pr-6">
        <Select
          value={user.role}
          onValueChange={(value) => onRoleChange(user._id, value as UserRole)}
          disabled={!isAdmin}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </div>
            </SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}
