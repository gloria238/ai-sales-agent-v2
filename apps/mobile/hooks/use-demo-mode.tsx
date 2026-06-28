import { createContext, useContext, useState, useMemo, type ReactNode } from "react";

type DemoMode = "demo" | "live";

interface DemoContextValue {
  mode: DemoMode;
  setMode: (m: DemoMode) => void;
  isDemo: boolean;
  /** Base URL for live API calls. Defaults to http://localhost:3000 in dev. */
  apiBaseUrl: string;
}

const DEFAULT_API_URL = "http://localhost:3000";

const DemoContext = createContext<DemoContextValue>({
  mode: "demo",
  setMode: () => {},
  isDemo: true,
  apiBaseUrl: DEFAULT_API_URL,
});

export function DemoModeProvider({
  children,
  apiBaseUrl,
}: {
  children: ReactNode;
  apiBaseUrl?: string;
}) {
  // Default to "live" in production builds (__DEV__ is Expo global)
  const [mode, setMode] = useState<DemoMode>(
    typeof __DEV__ !== "undefined" && !__DEV__ ? "live" : "demo",
  );

  const value = useMemo(
    () => ({ mode, setMode, isDemo: mode === "demo", apiBaseUrl: apiBaseUrl || DEFAULT_API_URL }),
    [mode, apiBaseUrl],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoMode() {
  return useContext(DemoContext);
}
