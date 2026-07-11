import { Separator } from "@/components/ui/separator";
import { LinkRow } from "./LinkRow";
import type { ShareModalUIProps } from "./types";

type ExistingLinksProps = Pick<
  ShareModalUIProps,
  "allLinks" | "copiedId" | "onCopyExistingLink" | "onDeleteLink"
>;

export function ExistingLinks({
  allLinks,
  copiedId,
  onCopyExistingLink,
  onDeleteLink,
}: ExistingLinksProps) {
  if (allLinks.length === 0) return null;

  return (
    <>
      <Separator />
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Offene Freigabe-Links (noch nicht eingereicht)
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {allLinks.map((link) => (
            <LinkRow
              key={link._id}
              link={link}
              copiedId={copiedId}
              onCopy={() => onCopyExistingLink(link._id, link.linkType)}
              onDelete={() => onDeleteLink(link._id, link.linkType)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
