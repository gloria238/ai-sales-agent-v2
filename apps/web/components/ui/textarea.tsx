import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-text mb-1.5">{label}</label>}
      <textarea
        className={cn(
          "w-full rounded-xl border border-border bg-bg-card px-3.5 py-2.5 text-sm text-text min-h-[80px] resize-y",
          "placeholder:text-text-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
          "transition-colors duration-150",
          className,
        )}
        {...props}
      />
    </div>
  );
}
