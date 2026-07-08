import { cn } from "@/lib/utils";

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border overflow-hidden", className)}>
      <table className="w-full">{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="bg-white/[0.03] border-b border-border">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children, className, onClick }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr className={cn("border-b border-border last:border-b-0 hover:bg-white/[0.03] transition-colors", className)} onClick={onClick}>
      {children}
    </tr>
  );
}

interface ThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  className?: string;
}

export function TableHead({ children, className, ...props }: ThProps) {
  return <th className={cn("text-left px-4 py-3 text-sm font-medium text-text-secondary", className)} {...props}>{children}</th>;
}

interface TdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  className?: string;
}

export function TableCell({ children, className, ...props }: TdProps) {
  return <td className={cn("px-4 py-3 text-sm text-text", className)} {...props}>{children}</td>;
}
