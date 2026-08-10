import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { searchManualMemberPlatformProfiles } from "@/lib/server/users/manualMemberPlatformProfiles";

const SEARCH_DELAY_MS = 300;

export function useManualMemberPlatformProfiles(name: string) {
  const normalizedName = name.trim();
  const [debouncedName, setDebouncedName] = useState("");

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedName(normalizedName),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [normalizedName]);

  const isEnabled = debouncedName.length >= 2;
  const isWaiting =
    normalizedName.length >= 2 && normalizedName !== debouncedName;
  const result = useQuery({
    queryKey: ["manual-member-platform-profiles", debouncedName],
    queryFn: () => searchManualMemberPlatformProfiles({ name: debouncedName }),
    enabled: isEnabled,
    retry: false,
    staleTime: 30_000,
  });

  return {
    candidates: isEnabled && !isWaiting ? (result.data ?? null) : null,
    isError: !isWaiting && result.isError,
    isSearching: isWaiting || result.isFetching,
    refetch: result.refetch,
  };
}
