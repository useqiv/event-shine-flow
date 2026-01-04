import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PitchDeckSlideProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  isActive: boolean;
}

export const PitchDeckSlide = ({ 
  title, 
  subtitle, 
  children, 
  className,
  isActive 
}: PitchDeckSlideProps) => {
  return (
    <div 
      className={cn(
        "min-h-[560px] p-10 md:p-16 rounded-xl bg-card border border-border/50",
        "transition-all duration-300 ease-out",
        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute pointer-events-none",
        className
      )}
    >
      <div className="mb-10">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg text-muted-foreground mt-2 font-medium">{subtitle}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};
