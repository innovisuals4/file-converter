import { SectionHeading } from "@/components/motion-primitives";
import { ToolsDirectory } from "@/components/home/tools-directory";

export const metadata = {
  title: "All Converters — Browse Every Format",
  description: "Searchable directory of all supported file conversions — documents, images, video, audio, spreadsheets, presentations, archives, fonts, subtitles, and data.",
};

export default function ToolsPage() {
  return (
    <>
      <SectionHeading
        eyebrow="Conversion directory"
        title="Browse every conversion"
        copy="Searchable directory of every supported format pair. Pick a category, search for your conversion, and go straight to the workspace."
      />
      <ToolsDirectory initialCategory="all" />
    </>
  );
}
