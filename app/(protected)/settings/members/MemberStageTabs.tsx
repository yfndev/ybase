import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MEMBER_STAGE_OPTIONS, type MemberStage } from "@/lib/members/stages";

export function MemberStageTabs({
  stage,
  counts,
  isLoading,
  onChange,
}: {
  stage: MemberStage;
  counts: Record<MemberStage, number>;
  isLoading: boolean;
  onChange: (stage: MemberStage) => void;
}) {
  return (
    <Tabs
      value={stage}
      onValueChange={(value) => onChange(value as MemberStage)}
    >
      <TabsList aria-label="Mitgliederprozess filtern">
        {MEMBER_STAGE_OPTIONS.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs leading-none tabular-nums text-muted-foreground">
              {isLoading ? "–" : counts[option.value]}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
