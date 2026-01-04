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
        "min-h-[600px] p-8 md:p-12 rounded-2xl bg-card border border-border shadow-xl",
        "transition-all duration-500 ease-out",
        isActive ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95 absolute pointer-events-none",
        className
      )}
    >
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};
