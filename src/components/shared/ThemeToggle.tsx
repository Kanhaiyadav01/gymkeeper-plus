import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn("h-9 gap-2 px-2 text-muted-foreground", className)}
    >
      {dark ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
      <span className="text-xs font-medium">{dark ? "Dark" : "Light"}</span>
    </Button>
  );
}
