import Link from "next/link";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 shadow-[0_6px_20px_-6px_rgba(139,92,246,0.7)]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path
          d="M5 9h10.2M13 5.5 17 9l-4 3.5M19 15H8.8M11 18.5 7 15l4-3.5"
          stroke="white"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Transmute — home"
      className="group inline-flex items-center gap-2.5 rounded-lg"
    >
      <LogoMark className="transition-transform duration-300 group-hover:rotate-[8deg]" />
      {!compact && (
        <span className="font-display text-[17px] font-semibold tracking-[-0.02em] text-ink">
          transmute
        </span>
      )}
    </Link>
  );
}
