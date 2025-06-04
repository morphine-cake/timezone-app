"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for saved theme preference or default to system
    const savedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | "system"
      | null;
    if (savedTheme) {
      applyTheme(savedTheme);
    } else {
      applyTheme("system");
    }
  }, []);

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    const root = document.documentElement;

    if (newTheme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", newTheme === "dark");
    }
  };

  const toggleTheme = () => {
    const currentIsDark = document.documentElement.classList.contains("dark");
    let newTheme: "light" | "dark" | "system";

    // Simplified toggle logic: always switch to opposite of current visual state
    if (currentIsDark) {
      newTheme = "light";
    } else {
      newTheme = "dark";
    }

    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 p-0" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      title={
        document.documentElement.classList.contains("dark")
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >
      {document.documentElement.classList.contains("dark") ? (
        <Sun className="h-4 w-4 text-slate-600 dark:text-slate-400" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
      )}
    </Button>
  );
}
