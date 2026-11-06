"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Cloud } from "lucide-react";
import { buttonClasses } from "@/components/ui";
import { cn } from "@/lib/cn";
import { Section } from "@/components/motion-primitives";

export function FinalCta() {
  const reduce = useReducedMotion();
  return (
    <Section className="border-0 pt-0 relative overflow-hidden">
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[48px] bg-gradient-to-br from-brand via-accent p-8 sm:p-20 text-center"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-accent/40 via-brand/40 to-transparent blur-[60px] -z-10 rounded-[48px]" />
          <div className="relative z-10">
            <h2 className="font-display text-[clamp(2.5rem,6vw,3.5rem)] font-black leading-[1.1] tracking-[-0.025em] text-ink mb-5">
              Your Files, Ready for Anything.
            </h2>
            <p className="text-muted/90 leading-relaxed max-w-xl mx-auto mb-12">
              Choose a format, upload your file, and let the conversion begin. Fast, free, and privacy-first.
            </p>
            <Link
              href="/#convert"
              className={cn(buttonClasses("primary", "lg"), "flex items-center justify-center gap-3")}
            >
              Start Converting
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-10 text-muted/70 text-sm">
              <Cloud className="h-4 w-4 inline mr-2" /> Uploads processed in memory & auto-deleted
            </p>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
