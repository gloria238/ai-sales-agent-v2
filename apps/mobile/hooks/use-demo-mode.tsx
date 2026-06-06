import { createContext, useContext, useState, type ReactNode } from "react";

type DemoMode = "demo" | "live";

interface DemoContextValue {
  mode: DemoMode;
  setMode: (m: DemoMode) => void;
  isDemo: boolean;
}

const DemoContext = createContext<DemoContextValue>({
  mode: "demo",
  setMode: () => {},
  isDemo: true,
});

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DemoMode>("demo");
  return (
    <DemoContext.Provider value={{ mode, setMode, isDemo: mode === "demo" }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoContext);
}
