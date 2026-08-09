import type { User } from "@/lib/db/types";

export function MemberInfractionsSection({ member }: { member: User }) {
  const infractions = member.memberInfractions ?? [];
  if (infractions.length === 0) return null;

  return (
    <section aria-label="Hinterlegte Verstöße">
      <ol className="grid gap-2">
        {infractions.map((infraction, index) => (
          <li
            key={infraction._id}
            className="border-l-secondary bg-secondary/[0.06] border-l-4 px-4 py-3"
          >
            <p className="text-sm font-semibold">
              {infractions.length > 1 ? `Verstoß ${index + 1}` : "Verstoß"}
            </p>
            <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
              {infraction.reason}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
