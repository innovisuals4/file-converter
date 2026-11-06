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
    <Section className="border-0 pt-0">
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-brand via-brand-strong to-accent p-8 sm:p-16 text-center"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 via-brand/40 to-transparent blur-2xl -z-10 rounded-[40px]" />
          <div className="relative z-10">
            <h2 className="font-display text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-white mb-5">
              Your Files, Ready for Anything.
            </h2>
            <p className="text-white/90 leading-relaxed max-w-xl mx-auto mb-12">
              Choose a format, upload your file, and let the conversion begin. Fast, free, and privacy-first.
            </p>
            <Link
              href="/#convert"
              className={cn(buttonClasses("primary", "lg"), "flex items-center justify-center gap-2")}
            >
              Start Converting
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-8 text-white/70 text-sm">
              <Cloud className="h-4 w-4 inline mr-1.5" /> Uploads processed in memory & auto-deleted
            </p>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
