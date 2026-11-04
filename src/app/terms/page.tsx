import Link from "next/link";
import { SectionHeading } from "@/components/motion-primitives";

export const metadata = {
  title: "Terms of Service — Transmute",
  description: "Terms of use for the Transmute file conversion service.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
      <SectionHeading eyebrow="Legal" title="Terms of Service" copy="Last updated: November 2026" align="left" />

      <div className="mt-12 space-y-8 text-muted leading-relaxed">
        <p>
          Welcome to Transmute. By using the service you agree to these terms. If you don&rsquo;t agree, please don&rsquo;t use
          the converter.
        </p>

        <h3 className="text-lg font-semibold text-ink">1. Use of the service</h3>
        <p>
          You may upload files you own or have rights to, and convert them between supported formats. Don&rsquo;t upload
          content you don&rsquo;t have the right to process, or content that is illegal or harmful.
        </p>

        <h3 className="text-lg font-semibold text-ink">2. Free service & limits</h3>
        <p>
          The converter is free to use. We reserve the right to apply rate limits, file-size limits (currently 100 MB
          per file), and to suspend automated or abusive usage.
        </p>

        <h3 className="text-lg font-semibold text-ink">3. No warranty</h3>
        <p>
          The service is provided &quot;as is&quot;. Conversion fidelity depends on the source file and format pair. Some
          conversions (e.g. scanned PDFs, DRM-protected media, proprietary codecs) may not be supported or may lose
          layout information. We make no guarantee that every conversion will succeed.
        </p>

        <h3 className="text-lg font-semibold text-ink">4. Limitation of liability</h3>
        <p>
          To the fullest extent permitted by law, Transmute is not liable for data loss, conversion errors, or
          indirect damages arising from use of the service.
        </p>

        <h3 className="text-lg font-semibold text-ink">5. Changes</h3>
        <p>
          We may update these terms or the supported formats at any time. Continued use means acceptance.
        </p>

        <p className="text-sm text-faint">
          Read our{" "}
          <Link href="/privacy" className="text-brand-strong hover:underline">
            Privacy Policy
          </Link>
          . Questions:{" "}
          <a href="mailto:support@transmute.app" className="text-brand-strong hover:underline">
            support@transmute.app
          </a>
        </p>
      </div>
    </div>
  );
}
