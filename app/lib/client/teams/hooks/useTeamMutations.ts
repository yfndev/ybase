import {
  archiveTeam,
  unarchiveTeam,
  updateTeam,
} from "@/lib/server/teams/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTeam } from "../requests/createTeam";

export function useTeamMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["teams"] }),
      queryClient.invalidateQueries({ queryKey: ["members"] }),
    ]);

  return {
    create: useMutation({ mutationFn: createTeam, onSuccess }),
    update: useMutation({ mutationFn: updateTeam, onSuccess }),
    archive: useMutation({ mutationFn: archiveTeam, onSuccess }),
    unarchive: useMutation({ mutationFn: unarchiveTeam, onSuccess }),
  };
}
