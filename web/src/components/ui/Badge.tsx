import type { HTMLAttributes } from "react";

const colors: Record<string, string> = {
  green: "bg-green/10 text-green",
  red: "bg-red/10 text-red",
  blue: "bg-blue/10 text-blue",
  gold: "bg-gold/10 text-gold",
  gray: "bg-txt3/10 text-txt2",
  navy: "bg-navy/10 text-navy",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: keyof typeof colors;
}

export function Badge({ color = "gray", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]} ${className}`}
      {...props}
    />
  );
}
