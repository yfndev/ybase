import type { Department, Team } from "@/lib/db/types";

export function sortTeamsByDepartment(
  teams: Team[],
  departments: Department[],
) {
  const departmentOrder = new Map(
    departments.map((department, index) => [department._id, index]),
  );

  return [...teams].sort((first, second) => {
    const firstDepartment =
      departmentOrder.get(first.departmentId) ?? Number.MAX_SAFE_INTEGER;
    const secondDepartment =
      departmentOrder.get(second.departmentId) ?? Number.MAX_SAFE_INTEGER;

    return firstDepartment - secondDepartment;
  });
}
