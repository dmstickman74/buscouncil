import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-txt2">{label}</label>}
      <input
        className={`px-3 py-2 border border-border rounded-[var(--radius-card)] text-sm bg-surface text-txt placeholder:text-txt3 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy ${error ? "border-red" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red">{error}</span>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-txt2">{label}</label>}
      <textarea
        className={`px-3 py-2 border border-border rounded-[var(--radius-card)] text-sm bg-surface text-txt placeholder:text-txt3 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy resize-y ${error ? "border-red" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red">{error}</span>}
    </div>
  );
}
