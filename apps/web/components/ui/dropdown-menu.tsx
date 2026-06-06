"use client";
import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface DropdownContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  itemCount: number;
  registerItem: () => void;
  onSelect: (() => void) | null;
  setOnSelect: (fn: (() => void) | null) => void;
}

const DropdownContext = createContext<DropdownContextValue>({
  open: false, setOpen: () => {}, activeIndex: -1, setActiveIndex: () => {},
  itemCount: 0, registerItem: () => {}, onSelect: null, setOnSelect: () => {},
});

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [itemCount, setItemCount] = useState(0);
  const [onSelect, setOnSelect] = useState<(() => void) | null>(null);
  const itemsRef = useRef<number>(0);

  const registerItem = useCallback(() => {
    itemsRef.current += 1;
    setItemCount(itemsRef.current);
  }, []);

  return (
    <DropdownContext.Provider value={{ open, setOpen, activeIndex, setActiveIndex, itemCount, registerItem, onSelect, setOnSelect }}>
      {children}
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { setOpen, open, setActiveIndex } = useContext(DropdownContext);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) { setOpen(true); setActiveIndex(0); }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      onClick={() => { setOpen(!open); setActiveIndex(-1); }}
      onKeyDown={handleKeyDown}
      className="inline-flex cursor-pointer"
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-haspopup="menu"
    >
      {children}
    </div>
  );
}

export function DropdownMenuContent({ children, align = "start" }: { children: React.ReactNode; align?: "start" | "end" }) {
  const { open, setOpen, activeIndex, setActiveIndex, itemCount, onSelect } = useContext(DropdownContext);
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
    } else if (mounted) {
      const timer = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(timer);
    }
  }, [open, mounted]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, setOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex(Math.min(activeIndex + 1, itemCount - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex(Math.max(activeIndex - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0) onSelect?.();
          break;
        case "Escape":
          setOpen(false);
          break;
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, activeIndex, setActiveIndex, itemCount, onSelect, setOpen]);

  if (!mounted) return null;

  return (
    <div
      ref={ref}
      role="menu"
      className={cn(
        "absolute z-50 min-w-[8rem] rounded-xl border border-border bg-bg-card shadow-lg py-1 mt-1 animate-scale-in origin-top",
        align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left",
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const { setOpen, activeIndex, setActiveIndex, registerItem, itemCount, setOnSelect } = useContext(DropdownContext);
  const [myIndex] = useState(() => {
    registerItem();
    return itemCount;
  });

  const isActive = activeIndex === myIndex;

  // Register onSelect handler for keyboard activation
  useEffect(() => {
    if (isActive) {
      setOnSelect(() => {
        onClick?.();
        setOpen(false);
      });
    }
  }, [isActive, onClick, setOpen, setOnSelect]);

  return (
    <div
      role="menuitem"
      tabIndex={-1}
      className={cn(
        "px-3 py-2 text-sm transition-colors duration-100 cursor-pointer",
        isActive ? "bg-bg-subtle text-text" : "text-text hover:bg-bg-subtle",
      )}
      onMouseEnter={() => setActiveIndex(myIndex)}
      onClick={() => { onClick?.(); setOpen(false); }}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="h-px bg-border my-1" role="separator" />;
}
