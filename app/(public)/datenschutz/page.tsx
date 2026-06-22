import { BetroffenenrechteSection } from "./_sections/BetroffenenrechteSection";
import { DatenerfassungSection } from "./_sections/DatenerfassungSection";
import { HostingSection } from "./_sections/HostingSection";
import { PflichtinformationenSection } from "./_sections/PflichtinformationenSection";
import { PluginsUndToolsSection } from "./_sections/PluginsUndToolsSection";
import { QuelleSection } from "./_sections/QuelleSection";
import { UeberblickSection } from "./_sections/UeberblickSection";

export default function DatenschutzPage() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Datenschutzerklärung</h1>

      <UeberblickSection />
      <HostingSection />
      <PflichtinformationenSection />
      <BetroffenenrechteSection />
      <DatenerfassungSection />
      <PluginsUndToolsSection />
      <QuelleSection />
    </div>
  );
}
