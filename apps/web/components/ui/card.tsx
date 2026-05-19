import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return <div className={cn("rounded-xl border border-border bg-bg-card", className)} onClick={onClick}>{children}</div>;
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn("px-5 py-4 border-b border-border", className)}>{children}</div>;
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
