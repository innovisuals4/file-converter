"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LinkButton } from "@/components/ui";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/tools", label: "All Converters" },
  { href: "/tools?category=images", label: "Image Tools" },
  { href: "/tools?category=documents", label: "Document Tools" },
  { href: "/tools?category=video", label: "Video & Audio" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Close mobile nav on route change
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "transition-all duration-500",
          scrolled ? "glass shadow-lg" : "border-b border-transparent bg-transparent",
        )}
      >
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />

          <ul className="hidden items-center gap-2 lg:flex">
            {LINKS.map((link) => {
              const isRoot = link.href === "/";
              const active = isRoot ? pathname === "/" : pathname === link.href.split("?")[0];
              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={cn(
                      "px-3 py-2 text-[13px] font-bold transition-colors tracking-tight uppercase",
                      active ? "text-brand-strong" : "text-muted hover:text-ink",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <LinkButton href="/#convert" size="sm" className="hidden sm:inline-flex variant-neon">
              Start Converting
              <ArrowRight className="h-4 w-4" />
            </LinkButton>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[20px] border border-line text-muted lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label="Toggle navigation menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="glass mx-4 mt-2 overflow-hidden rounded-[32px] lg:hidden border border-line"
          >
            <ul className="p-3">
              {LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="block rounded-[28px] px-4 py-3 text-[15px] font-bold text-muted transition-colors hover:bg-surface-2/80 hover:text-ink tracking-tight uppercase"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 border-t border-line pt-3">
                <LinkButton href="/#convert" className="w-full variant-neon">
                  Start Converting
                  <ArrowRight className="h-4 w-4" />
                </LinkButton>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
