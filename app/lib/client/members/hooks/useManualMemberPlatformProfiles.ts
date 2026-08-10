import { useMutation } from "@tanstack/react-query";
import { searchManualMemberPlatformProfiles } from "@/lib/server/users/manualMemberPlatformProfiles";

interface Lookup {
  name: string;
  privateEmail: string;
}

function lookupKey({ name, privateEmail }: Lookup): string {
  return `${name.trim()}\n${privateEmail.trim().toLowerCase()}`;
}

export function useManualMemberPlatformProfiles(lookup: Lookup) {
  const search = useMutation({
    mutationFn: searchManualMemberPlatformProfiles,
  });
  const isCurrentResult = search.variables
    ? lookupKey(search.variables) === lookupKey(lookup)
    : false;

  return {
    candidates: isCurrentResult && search.isSuccess ? search.data : null,
    isError: isCurrentResult && search.isError,
    isSearching: isCurrentResult && search.isPending,
    isPending: search.isPending,
    search: () => search.mutate(lookup),
  };
}
