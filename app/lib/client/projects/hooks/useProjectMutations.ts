import {
  archiveProject,
  createProject,
  deleteProject,
  renameProject,
  unarchiveProject,
} from "@/lib/server/projects/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useProjectMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    queryClient.invalidateQueries({ queryKey: ["projects"] });

  return {
    create: useMutation({ mutationFn: createProject, onSuccess }),
    rename: useMutation({ mutationFn: renameProject, onSuccess }),
    archive: useMutation({ mutationFn: archiveProject, onSuccess }),
    unarchive: useMutation({ mutationFn: unarchiveProject, onSuccess }),
    remove: useMutation({ mutationFn: deleteProject, onSuccess }),
  };
}
