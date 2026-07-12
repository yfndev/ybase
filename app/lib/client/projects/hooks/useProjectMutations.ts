import {
  archiveProject,
  createProject,
  deleteProject,
  unarchiveProject,
  updateProject,
} from "@/lib/server/projects/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useProjectMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    queryClient.invalidateQueries({ queryKey: ["projects"] });

  return {
    create: useMutation({ mutationFn: createProject, onSuccess }),
    update: useMutation({ mutationFn: updateProject, onSuccess }),
    archive: useMutation({ mutationFn: archiveProject, onSuccess }),
    unarchive: useMutation({ mutationFn: unarchiveProject, onSuccess }),
    remove: useMutation({ mutationFn: deleteProject, onSuccess }),
  };
}
