import { cn } from "@/lib/cn";

export function cn2(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "lg" | "sm";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "text-white bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-500 shadow-[0_10px_36px_-10px_rgba(139,92,246,0.55)] hover:shadow-[0_16px_44px_-10px_rgba(139,92,246,0.65)] hover:brightness-[1.08] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
  secondary:
    "border border-line-strong bg-surface text-muted hover:text-ink hover:border-brand/50 hover:shadow-[0_10px_32px_-16px_var(--glow)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
  ghost: "text-muted hover:text-ink active:scale-[0.98]",
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
