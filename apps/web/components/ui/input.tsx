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
          "w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-primary",
          "placeholder:text-text-disabled",
          "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent",
          "transition-colors duration-150",
          "disabled:opacity-50 disabled:pointer-events-none",
          className,
        )}
        {...props}
      />
    </div>
  );
}
