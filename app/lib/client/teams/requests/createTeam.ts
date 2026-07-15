interface CreateTeamInput {
  name: string;
  departmentId: string;
}

export async function createTeam(input: CreateTeamInput): Promise<string> {
  const response = await fetch("/api/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      `Team konnte nicht erstellt werden (Code ${response.status})`,
    );
  }

  const json = await response.json();
  return json.data as string;
}
