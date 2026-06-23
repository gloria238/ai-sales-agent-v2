import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className, onClick, hoverable }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-lp-border/30 glass-card",
        hoverable && "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass-hover hover:border-accent/30",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn("px-5 py-4 border-b border-lp-border/30", className)}>{children}</div>;
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
