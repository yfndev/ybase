import {
  createJobPostingDraft,
  setJobPostingStatus,
  updateJobPosting,
} from "@/lib/server/jobPostings/actions";
import { generateTallyForm } from "@/lib/server/jobPostings/tallyForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useJobPostingMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    queryClient.invalidateQueries({ queryKey: ["jobPostings"] });

  return {
    create: useMutation({ mutationFn: createJobPostingDraft, onSuccess }),
    update: useMutation({ mutationFn: updateJobPosting, onSuccess }),
    setStatus: useMutation({ mutationFn: setJobPostingStatus, onSuccess }),
    generateForm: useMutation({
      mutationFn: generateTallyForm,
      onSettled: onSuccess,
    }),
  };
}
