import Link from "next/link";
import { Logo } from "@/components/logo";
import { POPULAR, STATS } from "@/lib/registry";

const CATEGORY_LINKS = [
  { label: "Documents", href: "/tools?category=documents" },
  { label: "Images", href: "/tools?category=images" },
  { label: "Video", href: "/tools?category=video" },
  { label: "Audio", href: "/tools?category=audio" },
  { label: "Spreadsheets", href: "/tools?category=spreadsheets" },
  { label: "Presentations", href: "/tools?category=presentations" },
  { label: "Archives", href: "/tools?category=archives" },
  { label: "Fonts, Subtitles & Data", href: "/tools?category=other" },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface-2">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted">
              {`The all-in-one file converter. ${STATS.formats} formats, ${STATS.conversions}+ conversion paths — fast, free and privacy-first.`}
            </p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-[20px] border border-line surface-card px-3 py-1.5 text-[11px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-soft" />
              Files processed in memory & auto-deleted
            </p>
          </div>

          <nav aria-label="Popular conversions">
            <h3 className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-faint">Popular</h3>
            <ul className="space-y-3">
              {POPULAR.map((p) => (
                <li key={p.title}>
                  <Link
                    href={`/convert/${p.from}-to-${p.to}`}
                    className="text-sm text-muted transition-colors hover:text-ink hover:bg-brand/5 px-2 py-1 rounded-[12px]"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Categories">
            <h3 className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-faint">Categories</h3>
            <ul className="space-y-3">
              {CATEGORY_LINKS.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className="text-sm text-muted transition-colors hover:text-ink hover:bg-brand/5 px-2 py-1 rounded-[12px]">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Resources">
            <h3 className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-faint">Resources</h3>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-sm text-muted transition-colors hover:text-ink hover:bg-brand/5 px-2 py-1 rounded-[12px]">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted transition-colors hover:text-ink hover:bg-brand/5 px-2 py-1 rounded-[12px]">Terms of Service</Link></li>
              <li><Link href="/tools" className="text-sm text-muted transition-colors hover:text-ink hover:bg-brand/5 px-2 py-1 rounded-[12px]">All Converters</Link></li>
              <li>
                <a href="mailto:support@transmute.app" className="text-sm text-muted transition-colors hover:text-ink hover:bg-brand/5 px-2 py-1 rounded-[12px]">
                  support@transmute.app
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 text-[11px] text-faint sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Transmute Labs. All rights reserved.</p>
          <p>Built with care — no files are ever stored on our servers.</p>
        </div>
      </div>
    </footer>
  );
}
