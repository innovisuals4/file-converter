"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { animate } from "motion";
import {
  ArrowRight,
  ChevronRight,
  Cloud,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { ConverterWorkspace } from "@/components/workspace/converter";
import { LinkButton } from "@/components/ui";
import { FormatIcon } from "@/lib/format-icons";
import { HERO_PAIRS, STATS } from "@/lib/registry";
import { cn } from "@/lib/cn";

const FLOAT_FORMATS = [
  "pdf",
  "docx",
  "png",
  "jpg",
  "webp",
  "mp4",
  "mp3",
  "zip",
  "xlsx",
  "pptx",
  "heic",
  "avif",
  "epub",
  "ogg",
  "flac",
];

function StaggerWords({
  text,
  className,
  gradientFromIndex,
  delay = 0,
}: {
  text: string;
  className?: string;
  gradientFromIndex?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <span className={cn("inline", className)}>
      {words.map((word, i) => {
        const gradient = gradientFromIndex !== undefined && i >= gradientFromIndex;
        return (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <motion.span
              className={cn("inline-block will-change-transform", gradient && "gradient-text")}
              initial={reduce ? false : { y: "112%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.8,
                delay: delay + i * 0.075,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

function FloatingOrbs() {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {!reduce && (
        <>
          <motion.div
            className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-[160px]"
            animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-tl from-sky-500/18 to-transparent blur-[160px]"
            animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div
            className="absolute top-1/2 -right-60 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/12 to-transparent blur-[140px]"
            animate={{ x: [0, 30, 0], y: [0, -25, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          />
        </>
      )}
      {FLOAT_FORMATS.map((fmt, i) => {
        const x = (11 + i * 7 + (i * 37) % 15) % 88;
        const y = (8 + i * 9 + (i * 23) % 13) % 84;
        const size = 44 + (i * 7) % 32;
        const delay = (i * 0.6) % 4;
        return (
          <motion.div
            key={fmt}
            className="absolute glass rounded-xl p-1.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]"
            style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
            animate={
              reduce
                ? undefined
                : { y: [0, -14, 0], x: [0, 8, 0], rotate: [0, 2, -2, 0] }
            }
            transition={{
              duration: 9 + i * 0.7,
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }}
          >
            <FormatIcon formatId={fmt} size="md" />
          </motion.div>
        );
      })}
    </div>
  );
}

function AnimatedConversionArrow({ index }: { index: number }) {
  const reduce = useReducedMotion();
  const [pair, setPair] = useState(HERO_PAIRS[0]);
  const [n, force] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => {
      force((m) => m + 1);
      setPair(HERO_PAIRS[(index + n + 1) % HERO_PAIRS.length]);
    }, 3200);
    return () => clearInterval(timer);
  }, [reduce, index, n]);

  return (
    <motion.div
      className="relative flex h-14 w-full max-w-md items-center justify-center gap-3"
      animate={reduce ? undefined : { x: [-8, 8, -8] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
    >
      <FormatIcon formatId={pair[0]} size="lg" />
      <motion.div
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600/30 to-indigo-600/10"
        animate={reduce ? undefined : { scale: [1, 1.12, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronRight className="h-5 w-5 text-brand-strong" strokeWidth={2.5} />
      </motion.div>
      <FormatIcon formatId={pair[1]} size="lg" />
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-strong">
          <Zap className="h-3 w-3" /> Converting
        </span>
      </div>
    </motion.div>
  );
}

function TrustBadges() {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-[13px] text-faint">
      <span className="flex items-center gap-1.5">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        Free to get started
      </span>
      <span className="flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-brand-strong" />
        No complicated setup
      </span>
      <span className="flex items-center gap-1.5">
        <Cloud className="h-4 w-4 text-sky-500" />
        Privacy-first processing
      </span>
    </div>
  );
}

function Counter({ to, suffix = "", className, duration = 1.4 }: { to: number; suffix?: string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: "-40px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Immediate set for reduced-motion users (no animation)
      setValue(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24">
      <div className="hero-grid-bg absolute inset-0 opacity-30" aria-hidden />
      <FloatingOrbs />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-500 to-sky-400" />
            New: Batch convert up to 10 files at once
          </span>

          <h1 className="font-display text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-ink">
            Every File.
            <br />
            <StaggerWords text="Any Format. One Powerful Converter." gradientFromIndex={2} delay={0.15} />
          </h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
            className="mt-6 text-[clamp(1.05rem,2vw,1.2rem)] leading-relaxed text-muted max-w-2xl mx-auto"
          >
            Convert documents, images, videos, audio, archives, and more — all in one place. Fast, simple, secure, and effortless.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <LinkButton size="lg" className="min-w-[240px] gap-2" href="#convert">
              Convert Your Files
              <ArrowRight className="h-5 w-5" />
            </LinkButton>
            <LinkButton variant="secondary" size="lg" href="/tools" className="min-w-[200px]">
              Explore All Tools
              <ChevronRight className="h-5 w-5" />
            </LinkButton>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: "easeOut" }}
          >
            <TrustBadges />
          </motion.div>
        </motion.div>

        {/* Interactive conversion panel */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 relative"
        >
          {/* Animated conversion arrow */}
          <div className="mb-6">
            <AnimatedConversionArrow index={0} />
          </div>

          {/* Embedded converter workspace */}
          <ConverterWorkspace variant="hero" initialTo="webp" />
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="mt-16 grid grid-cols-3 gap-4 sm:grid-cols-[1fr_1fr_1fr]"
        >
          <StatCard label="Formats" value={STATS.formats} suffix="+" delay={0} />
          <StatCard label="Conversions" value={STATS.conversions} suffix="+" delay={0.1} />
          <StatCard label="Categories" value={STATS.categories} delay={0.2} />
        </motion.div>
      </div>
    </section>
  );
}

function StatCard({ label, value, suffix = "", delay = 0 }: { label: string; value: number; suffix?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className="relative glass rounded-2xl p-5 sm:p-7 text-center"
    >
      <Counter to={value} suffix={suffix} className="font-display text-[clamp(2rem,3.5vw,3rem)] font-semibold tracking-[-0.02em] text-ink" />
      <p className="mt-1.5 text-[13px] font-medium text-muted">{label}</p>
    </motion.div>
  );
}
