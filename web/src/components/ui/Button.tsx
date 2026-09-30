import type { ButtonHTMLAttributes } from "react";

const variants: Record<string, string> = {
  primary: "bg-navy text-white hover:bg-navy-light shadow-sm hover:shadow-md",
  secondary: "bg-surface border border-border text-txt hover:bg-surface-alt hover:border-navy/20",
  danger: "bg-red text-white hover:opacity-90",
  ghost: "bg-transparent text-txt2 hover:bg-surface-alt",
  green: "bg-green text-white hover:bg-green-dark shadow-sm",
  gold: "bg-gold text-white hover:bg-gold-light",
};

const sizes: Record<string, string> = {
  sm: "px-3.5 py-1.5 text-sm",
  md: "px-5 py-2 text-sm",
  lg: "px-6 py-2.5 text-base",
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
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-pill)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
