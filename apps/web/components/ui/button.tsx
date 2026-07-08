import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-40 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-hover",
        destructive: "bg-destructive text-white hover:bg-red-700 dark:hover:bg-red-800",
        outline: "border border-border bg-bg-card hover:bg-bg-subtle text-text",
        secondary: "bg-bg-subtle text-text hover:bg-bg-muted",
        ghost: "hover:bg-bg-subtle text-text-secondary",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 size-3.5 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
