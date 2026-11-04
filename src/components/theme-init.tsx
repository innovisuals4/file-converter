"use client";

import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => {
    try {
      const t = localStorage.getItem("tm-theme");
      const d = t ? t === "dark" : true;
      document.documentElement.classList.toggle("dark", d);
    } catch {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return null;
}