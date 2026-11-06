"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { animate } from "motion";
import { ArrowRight, ChevronRight, Cloud, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { ConverterWorkspace } from "@/components/workspace/converter";
import { LinkButton } from "@/components/ui";
import { FormatIcon } from "@/lib/format-icons";
import { HERO_PAIRS, STATS } from "@/lib/registry";
import { cn } from "@/lib/cn";
import { Section } from "@/components/motion-primitives";

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
      className="relative flex h-18 w-full max-w-md items-center justify-center gap-3"
      animate={reduce ? undefined : { x: [-12, 12, -12] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <FormatIcon formatId={pair[0]} size="lg" />
      <motion.div
        className="relative flex h-12 w-12 items-center justify-center rounded-[20px] bg-gradient-to-br from-brand/25 to-accent/15 border border-brand/30"
        animate={reduce ? undefined : { scale: [1, 1.18, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronRight className="h-5 w-5 text-brand-strong" strokeWidth={2.5} />
      </motion.div>
      <FormatIcon formatId={pair[1]} size="lg" />
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-0.5 text-[10px] font-bold text-brand uppercase tracking-[0.18em]">
          <Zap className="h-3 w-3" /> Converting
        </span>
      </div>
    </motion.div>
  );
}

function TrustBadges() {
  return (
    <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-[13px] text-muted">
      <span className="flex items-center gap-1.5">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        Free to get started
      </span>
      <span className="flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-brand-strong" />
        No complicated setup
      </span>
      <span className="flex items-center gap-1.5">
        <Cloud className="h-4 w-4 text-accent" />
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
      setTimeout(() => setValue(to), 0);
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

function StatCard({ label, value, suffix = "", delay = 0 }: { label: string; value: number; suffix?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className="relative neon-card rounded-[32px] p-8 sm:p-12 text-center card-hover"
    >
      <Counter to={value} suffix={suffix} className="font-display text-[clamp(2.25rem,5vw,4rem)] font-black tracking-[-0.02em] text-ink mb-2" />
      <p className="text-[13px] font-medium text-muted tracking-tight uppercase">{label}</p>
    </motion.div>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  return (
    <Section className="border-0 pb-0 relative">
      {/* Ambient scanlines */}
      <div className="absolute inset-0 z-0 scanlines" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl text-center"
        >
          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand/30 px-3 py-1.5 text-[11px] font-bold text-brand uppercase tracking-[0.18em] bg-brand/5 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            New: Batch convert up to 10 files at once
          </span>

          <h1 className="font-display text-[clamp(3rem,8vw,5.5rem)] font-black leading-[1.0] tracking-[-0.03em] text-ink mb-5">
            Every File.<br />
            <StaggerWords text="Any Format. One Powerful Converter." gradientFromIndex={2} delay={0.15} />
          </h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
            className="mt-0 text-[clamp(1.2rem,2.5vw,1.5rem)] leading-relaxed text-muted max-w-2xl mx-auto"
          >
            Convert documents, images, videos, audio, archives, and more — all in one place.
            Fast, simple, secure, and effortless.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="mt-14 flex flex-col items-center gap-5 sm:flex-row sm:justify-center"
          >
            <LinkButton size="lg" className="min-w-[260px] gap-3" href="#convert">
              Convert Your Files
              <ArrowRight className="h-5 w-5" />
            </LinkButton>
            <LinkButton variant="secondary" size="lg" href="/tools" className="min-w-[240px]">
              Explore All Tools
              <ChevronRight className="h-5 w-5" />
            </LinkButton>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: "easeOut" }}
          >
            <TrustBadges />
          </motion.div>
        </motion.div>

        {/* Interactive conversion panel */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-24 relative"
        >
          <div className="mb-10">
            <AnimatedConversionArrow index={0} />
          </div>
          <ConverterWorkspace variant="hero" initialTo="webp" />
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="mt-28 grid grid-cols-3 gap-8 sm:grid-cols-[1fr_1fr_1fr]"
        >
          <StatCard label="Formats" value={STATS.formats} suffix="+" delay={0} />
          <StatCard label="Conversions" value={STATS.conversions} suffix="+" delay={0.1} />
          <StatCard label="Categories" value={STATS.categories} delay={0.2} />
        </motion.div>
      </div>
    </Section>
  );
}
