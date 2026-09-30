import type { ButtonHTMLAttributes } from "react";

const variants: Record<string, string> = {
  primary: "bg-navy text-white hover:bg-navy-light",
  secondary: "bg-surface border border-border text-txt hover:bg-surface-alt",
  danger: "bg-red text-white hover:opacity-90",
  ghost: "bg-transparent text-txt2 hover:bg-surface-alt",
  gold: "bg-gold text-white hover:bg-gold-light",
};

const sizes: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-card)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
