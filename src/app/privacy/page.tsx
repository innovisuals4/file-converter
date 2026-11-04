import { SectionHeading } from "@/components/motion-primitives";

export const metadata = {
  title: "Privacy Policy — Transmute",
  description: "How Transmute handles your files: processing, retention, deletion, and your rights.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
      <SectionHeading eyebrow="Legal" title="Privacy Policy" copy="Last updated: November 2026" align="left" />

      <div className="mt-12 space-y-8 text-muted leading-relaxed">
        <p>
          Transmute (&quot;we&quot;, &quot;us&quot;) operates the file conversion service at transmute.app. This policy describes how
          we handle files you upload.
        </p>

        <h3 className="text-lg font-semibold text-ink">1. No permanent storage</h3>
        <p>
          Uploaded files are held in memory only for the duration of the conversion. Temporary buffers are cleared
          immediately after the response is sent to your browser. We do not retain your files, build a library from
          them, or keep backups beyond the conversion window.
        </p>

        <h3 className="text-lg font-semibold text-ink">2. Where processing happens</h3>
        <p>
          Documents, images, spreadsheets, archives, fonts, subtitles, and structured-data conversions run on our
          servers. Audio and video conversions run on our server via FFmpeg when available; otherwise they run entirely
          in your browser using ffmpeg.wasm, so the file never leaves your device.
        </p>

        <h3 className="text-lg font-semibold text-ink">3. What we do not do</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>We do not scan, index, or train on your file contents.</li>
          <li>We do not share files with third parties.</li>
          <li>We do not require an account to convert.</li>
          <li>We do not store converted files for download later — you download directly from the response.</li>
        </ul>

        <h3 className="text-lg font-semibold text-ink">4. Security measures</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>File type is verified by inspecting actual file contents (magic bytes), not just the extension.</li>
          <li>Uploads are capped at 100 MB per file; archive extraction is bounded to prevent bombs.</li>
          <li>Archive contents are repackaged in memory — never extracted to disk, preventing path-traversal attacks.</li>
          <li>Conversion jobs are rate-limited per device.</li>
        </ul>

        <h3 className="text-lg font-semibold text-ink">5. Your rights</h3>
        <p>
          You own your input and output files. To delete your data, simply close the tab — nothing is stored on our
          side that could be recovered.
        </p>

        <div className="rounded-xl border border-line bg-surface p-6">
          <p className="text-sm text-faint">
            Questions about privacy? Contact us at{" "}
            <a href="mailto:privacy@transmute.app" className="text-brand-strong hover:underline">
              privacy@transmute.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
