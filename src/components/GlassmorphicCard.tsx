import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassmorphicCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  gradient?: boolean;
}

export function GlassmorphicCard({ 
  title, 
  description, 
  children, 
  className,
  headerClassName,
  gradient = false 
}: GlassmorphicCardProps) {
  return (
    <Card 
      className={cn(
        "backdrop-blur-md bg-card/80 border-border/50 shadow-lg transition-all duration-300 hover:shadow-xl",
        gradient && "bg-gradient-to-br from-primary/5 via-card/80 to-accent/5",
        className
      )}
    >
      {(title || description) && (
        <CardHeader className={headerClassName}>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}
