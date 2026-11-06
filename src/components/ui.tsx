import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "neon";
type ButtonSize = "md" | "lg" | "sm";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "text-black bg-gradient-to-br from-brand via-brand-strong to-accent shadow-[0_12px_40px_-12px_rgba(0,243,255,0.5)] hover:shadow-[0_16px_50px_-14px_rgba(0,243,255,0.6)] hover:scale-[1.02] active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none",
  secondary:
    "border border-brand/30 bg-surface/80 text-ink hover:text-ink hover:bg-surface/100 hover:border-brand active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none backdrop-blur-sm",
  ghost: "text-muted hover:text-ink active:scale-[0.96]",
  neon:
    "text-black bg-gradient-to-br from-accent via-accent-strong to-brand shadow-[0_0_20px_rgba(255,0,255,0.4)] hover:shadow-[0_0_35px_rgba(255,0,255,0.6)] hover:scale-[1.03] active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[12px] font-bold rounded-[10px] tracking-tight",
  md: "h-11 px-5 text-sm font-bold rounded-[12px] tracking-tight",
  lg: "h-14 px-8 text-base font-bold rounded-[16px] tracking-tight",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 transition-all duration-300 cursor-pointer font-sans",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button {...props} className={buttonClasses(variant, size, className)} />;
}

interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function LinkButton({ variant = "primary", size = "md", className, ...props }: LinkButtonProps) {
  return <a {...props} className={buttonClasses(variant, size, className)} />;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("surface-card rounded-3xl p-6 sm:p-10 card-hover", className)}>{children}</div>
  );
}

export function NeonCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("neon-card rounded-3xl p-6 sm:p-10 card-hover", className)}>{children}</div>
  );
}

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-brand/40 px-2.5 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider bg-brand/10", className)}>
      {children}
    </span>
  );
}

export function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1 text-[11px] font-medium text-muted", className)}>
      {children}
    </span>
  );
}

export function SectionHeadline({ eyebrow, title, copy, align = "center" }: { eyebrow?: string; title: React.ReactNode; copy?: string; align?: "center" | "left" }) {
  return (
    <div className={cn("max-w-3xl", align === "center" ? "mx-auto text-center" : "text-left", "space-y-4")}>
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 px-3 py-1 text-[11px] font-bold text-brand uppercase tracking-[0.18em] bg-brand/5 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-black leading-[1.02] tracking-[-0.03em] text-ink">{title}</h2>
      {copy && (
        <p className="mt-3 text-[clamp(1.05rem,2vw,1.2rem)] leading-relaxed text-muted max-w-xl">{copy}</p>
      )}
    </div>
  );
}
