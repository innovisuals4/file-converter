"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Cloud } from "lucide-react";
import { buttonClasses } from "@/components/ui";
import { cn } from "@/lib/cn";

export function FinalCta() {
  const reduce = useReducedMotion();
  return (
    <section className="py-20 lg:pt-28 lg:pb-32 border-t border-line/40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-600 to-indigo-600 p-8 sm:p-14 text-center"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/40 via-sky-500/30 to-transparent blur-2xl -z-10 rounded-[32px]" />
          <div className="relative z-10">
            <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-white mb-4">
              Your Files, Ready for Anything.
            </h2>
            <p className="text-violet-100/90 leading-relaxed max-w-xl mx-auto mb-10">
              Choose a format, upload your file, and let the conversion begin. Fast, free, and privacy-first.
            </p>
            <Link
              href="/#convert"
              className={cn(
                buttonClasses("primary", "lg"),
                "flex items-center justify-center gap-2",
              )}
            >
              Start Converting
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-6 text-violet-200/70 text-sm">
              <Cloud className="h-4 w-4 inline mr-1.5" /> Uploads are processed in memory and auto-deleted
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
