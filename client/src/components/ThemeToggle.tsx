import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ThemeToggleProps {
  variant?: "icon" | "button";
  showLabel?: boolean;
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = "icon", 
  showLabel = false,
  className = ""
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "button") {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={toggleTheme}
        className={`flex items-center gap-2 ${className}`}
      >
        {isDark ? (
          <>
            <Sun className="h-4 w-4" />
            {showLabel && <span>Light Mode</span>}
          </>
        ) : (
          <>
            <Moon className="h-4 w-4" />
            {showLabel && <span>Dark Mode</span>}
          </>
        )}
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={`rounded-full w-9 h-9 ${className}`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isDark ? "Switch to light mode" : "Switch to dark mode"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ThemeToggle;