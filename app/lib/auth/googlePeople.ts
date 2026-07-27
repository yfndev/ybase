type GooglePhoto = {
  default?: boolean;
  metadata?: { primary?: boolean };
  url?: string;
};

type PeopleResponse = {
  photos?: GooglePhoto[];
};

export async function getGooglePhotoIsDefault(
  accessToken: string | undefined,
): Promise<boolean | undefined> {
  if (!accessToken) return undefined;

  try {
    const response = await fetch(
      "https://people.googleapis.com/v1/people/me?personFields=photos&sources=READ_SOURCE_TYPE_PROFILE",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!response.ok) return undefined;

    const data = (await response.json()) as PeopleResponse;
    const photo =
      data.photos?.find((item) => item.metadata?.primary) ?? data.photos?.[0];
    return photo?.default ?? true;
  } catch {
    return undefined;
  }
}
