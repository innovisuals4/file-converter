import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "lg" | "sm";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "text-white bg-gradient-to-br from-brand via-brand-strong to-accent shadow-[0_10px_30px_-8px_rgba(99,102,241,0.45)] hover:shadow-[0_16px_40px_-10px_rgba(99,102,241,0.55)] hover:brightness-[1.05] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
  secondary:
    "border border-line-strong bg-surface text-muted hover:text-ink hover:border-brand/40 hover:bg-surface-2/80 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
  ghost: "text-muted hover:text-ink active:scale-[0.97]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-[10px]",
  md: "h-11 px-5 text-sm rounded-xl",
  lg: "h-13 px-7 text-[15px] rounded-2xl",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 font-medium tracking-[-0.01em] transition-all duration-300 cursor-pointer",
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
    <div className={cn("surface-card rounded-3xl p-6 sm:p-8 card-hover", className)}>{children}</div>
  );
}

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium border-line bg-surface-2/50", className)}>
      {children}
    </span>
  );
}
