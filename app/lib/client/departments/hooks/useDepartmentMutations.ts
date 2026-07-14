import {
  archiveDepartment,
  createDepartment,
  unarchiveDepartment,
  updateDepartment,
} from "@/lib/server/departments/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDepartmentMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    queryClient.invalidateQueries({ queryKey: ["departments"] });

  return {
    create: useMutation({ mutationFn: createDepartment, onSuccess }),
    update: useMutation({ mutationFn: updateDepartment, onSuccess }),
    archive: useMutation({ mutationFn: archiveDepartment, onSuccess }),
    unarchive: useMutation({ mutationFn: unarchiveDepartment, onSuccess }),
  };
}
