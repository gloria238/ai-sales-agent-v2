"use client";
import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onValueChange: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  items: string[];
  registerItem: (v: string) => void;
}

const SelectContext = createContext<SelectContextValue>({
  value: "", onValueChange: () => {}, open: false, setOpen: () => {},
  activeIndex: -1, setActiveIndex: () => {}, items: [], registerItem: () => {},
});

export function Select({ value, onValueChange, children }: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [items, setItems] = useState<string[]>([]);

  const registerItem = useCallback((v: string) => {
    setItems((prev) => (prev.includes(v) ? prev : [...prev, v]));
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, activeIndex, setActiveIndex, items, registerItem }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ placeholder, className }: { placeholder?: string; className?: string }) {
  const { value, setOpen, open, activeIndex, setActiveIndex, items } = useContext(SelectContext);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setOpen(true); setActiveIndex(0); }
      else setActiveIndex(Math.min(activeIndex + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setOpen(true); setActiveIndex(items.length - 1); }
      else setActiveIndex(Math.max(activeIndex - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(!open);
      if (!open) setActiveIndex(-1);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <button
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      onClick={() => { setOpen(!open); setActiveIndex(-1); }}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-full flex items-center justify-between rounded-xl border border-border bg-bg-card px-3.5 py-2.5 text-sm text-text",
        "hover:bg-bg-subtle transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        className,
      )}
    >
      <span className={value ? "" : "text-text-muted"}>{value || placeholder || "Select..."}</span>
      <span className={`text-xs text-text-muted ml-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>&#9660;</span>
    </button>
  );
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  const { open, setOpen, items } = useContext(SelectContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="listbox"
      className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-bg-card shadow-lg py-1 max-h-60 overflow-auto animate-scale-in origin-top"
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: selectedValue, onValueChange, setOpen, activeIndex, items, registerItem } = useContext(SelectContext);

  useEffect(() => {
    registerItem(value);
  }, [value, registerItem]);

  const isSelected = selectedValue === value;
  const itemIndex = items.indexOf(value);
  const isActive = activeIndex === itemIndex;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      className={cn(
        "px-3 py-2 text-sm cursor-pointer transition-colors duration-100",
        isSelected ? "bg-accent-soft text-accent" : isActive ? "bg-bg-subtle text-text" : "text-text hover:bg-bg-subtle",
      )}
      onClick={() => { onValueChange(value); setOpen(false); }}
    >
      {children}
      {isSelected && <span className="float-right text-accent">&#10003;</span>}
    </div>
  );
}
