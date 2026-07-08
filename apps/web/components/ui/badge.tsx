import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const variantStyles = {
  default: "bg-bg-subtle text-text-secondary",
  success: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium", variantStyles[variant], className)}>
      {children}
    </span>
  );
}
