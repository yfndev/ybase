import {
  createJobPostingDraft,
  updateJobPosting,
} from "@/lib/server/jobPostings/actions";
import {
  archiveJobPosting,
  closeJobPosting,
  reopenJobPosting,
  retryTallySync,
} from "@/lib/server/jobPostings/lifecycle";
import { generateTallyForm } from "@/lib/server/jobPostings/tallyForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useJobPostingMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["jobPostings"] });

  return {
    create: useMutation({
      mutationFn: createJobPostingDraft,
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: updateJobPosting,
      onSuccess: invalidate,
    }),
    generateForm: useMutation({
      mutationFn: generateTallyForm,
      onSettled: invalidate,
    }),
    close: useMutation({ mutationFn: closeJobPosting, onSettled: invalidate }),
    reopen: useMutation({
      mutationFn: reopenJobPosting,
      onSettled: invalidate,
    }),
    archive: useMutation({
      mutationFn: archiveJobPosting,
      onSettled: invalidate,
    }),
    retrySync: useMutation({
      mutationFn: retryTallySync,
      onSettled: invalidate,
    }),
  };
}
