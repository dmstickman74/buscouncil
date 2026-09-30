import type { HTMLAttributes } from "react";

const colors: Record<string, string> = {
  green: "bg-green/10 text-green-dark border border-green/20",
  red: "bg-red/10 text-red border border-red/20",
  blue: "bg-blue/10 text-blue border border-blue/20",
  gold: "bg-gold/10 text-gold border border-gold/20",
  gray: "bg-txt3/8 text-txt2 border border-border-light",
  navy: "bg-navy/8 text-navy border border-navy/15",
  sage: "bg-sage/60 text-navy-dark border border-sage",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: keyof typeof colors;
}

export function Badge({ color = "gray", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]} ${className}`}
      {...props}
    />
  );
}
