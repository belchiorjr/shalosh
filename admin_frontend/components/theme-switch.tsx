"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import clsx from "clsx";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = useMemo(() => {
    if (!mounted) {
      return "light";
    }

    return (resolvedTheme || theme || "light") as "light" | "dark";
  }, [mounted, resolvedTheme, theme]);

  const onChange = () => {
    setTheme(currentTheme === "light" ? "dark" : "light");
  };

  return (
    <button
      type="button"
      aria-label={`Alternar para tema ${currentTheme === "light" ? "escuro" : "claro"}`}
      title={`Tema ${currentTheme === "light" ? "escuro" : "claro"}`}
      onClick={onChange}
      className={clsx(
        "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-default-600 transition-opacity hover:opacity-80",
        className,
      )}
    >
      {currentTheme === "light" ? <MoonFilledIcon size={20} /> : <SunFilledIcon size={20} />}
    </button>
  );
};
