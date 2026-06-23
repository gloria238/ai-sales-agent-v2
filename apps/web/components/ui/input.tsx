import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, ...props }: InputProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-text mb-1.5">{label}</label>}
      <input
        className={cn(
          "w-full rounded-xl border border-lp-border/30 bg-lp-card/60 backdrop-blur-sm px-3.5 py-2.5 text-sm text-text",
          "placeholder:text-text-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent",
          "transition-colors duration-150",
          "disabled:opacity-50 disabled:pointer-events-none",
          className,
        )}
        {...props}
      />
    </div>
  );
}
