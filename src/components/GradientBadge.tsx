import { cn } from "@/lib/utils";

interface GradientBadgeProps {
  variant: "true" | "false" | "uncertain";
  children: React.ReactNode;
  className?: string;
}

const variants = {
  true: "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/25",
  false: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/25",
  uncertain: "bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-yellow-500/25",
};

export function GradientBadge({ variant, children, className }: GradientBadgeProps) {
  return (
    <span 
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold shadow-lg",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
