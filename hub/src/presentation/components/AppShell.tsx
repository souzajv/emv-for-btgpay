"use client";

import { NavigationProgressProvider } from "@/presentation/components/NavigationProgress";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <NavigationProgressProvider>{children}</NavigationProgressProvider>;
}
