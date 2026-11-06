"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion, useInView, animate } from "motion/react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Scroll reveal                                                       */
/* ------------------------------------------------------------------ */

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}

export function Reveal({ children, delay = 0, y = 26, className, once = true }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-70px" }}
      transition={{ duration: 0.75, delay, ease: [0.21, 0.65, 0.32, 0.9] }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Staggered word reveal (hero headline)                               */
/* ------------------------------------------------------------------ */

export function StaggerWords({
  text,
  className,
  wordClassName,
  gradientFromIndex,
  delay = 0,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  /** Words at this index and beyond get the gradient treatment. */
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
              className={cn("inline-block will-change-transform", gradient && "gradient-text", wordClassName)}
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

/* ------------------------------------------------------------------ */
/* Magnetic hover wrapper                                              */
/* ------------------------------------------------------------------ */

export function Magnetic({
  children,
  className,
  strength = 0.25,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      x: (e.clientX - rect.left - rect.width / 2) * strength,
      y: (e.clientY - rect.top - rect.height / 2) * strength,
    });
  };

  return (
    <motion.span
      ref={ref}
      className={cn("inline-block", className)}
      onMouseMove={onMove}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 180, damping: 15, mass: 0.4 }}
    >
      {children}
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/* Animated counter (stats)                                            */
/* ------------------------------------------------------------------ */

export function Counter({
  to,
  suffix = "",
  className,
  duration = 1.4,
}: {
  to: number;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);

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

/* ------------------------------------------------------------------ */
/* Section wrapper (shared layout for every page section)             */
/* ------------------------------------------------------------------ */

export function Section({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-20 lg:pt-28 lg:pb-36 border-t border-line/40", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading kit                                                 */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  eyebrow,
  title,
  copy,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  copy?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow && (
        <Reveal>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-medium uppercase tracking-[0.14em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-500 to-sky-400" />
            {eyebrow}
          </span>
        </Reveal>
      )}
      <Reveal delay={0.06}>
        <h2 className="font-display text-[clamp(1.75rem,3.6vw,2.6rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-ink">
          {title}
        </h2>
      </Reveal>
      {copy && (
        <Reveal delay={0.12}>
          <p className="mt-4 text-[15px] leading-relaxed text-muted md:text-base">{copy}</p>
        </Reveal>
      )}
    </div>
  );
}
