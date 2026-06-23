import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const variantStyles = {
  default: "bg-white/[0.05] text-text-secondary border border-lp-border/20",
  success: "bg-success-soft text-success border border-success/20",
  warning: "bg-warning-soft text-warning border border-warning/20",
  danger: "bg-danger-soft text-danger border border-danger/20",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variantStyles[variant], className)}>
      {children}
    </span>
  );
}
