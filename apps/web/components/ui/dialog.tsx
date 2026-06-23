"use client";
import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

interface DialogContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const DialogContext = createContext<DialogContextValue>({ open: false, setOpen: () => {} });

export function Dialog({ children, open: controlledOpen, onOpenChange }: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback((v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  }, [isControlled, onOpenChange]);

  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ children }: { children: React.ReactNode }) {
  const { setOpen } = useContext(DialogContext);
  return (
    <div onClick={() => setOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } }}>
      {children}
    </div>
  );
}

export function DialogContent({ children, title }: { children: React.ReactNode; title?: string }) {
  const { open, setOpen } = useContext(DialogContext);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Open animation
  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setClosing(false));
    }
  }, [open]);

  useEffect(() => {
    if (!open && !mounted) return;
    if (!open && mounted) {
      // Trigger close animation
      setClosing(true);
      const timer = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open, mounted]);

  // Keyboard: Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!mounted) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${closing ? "opacity-0" : "opacity-100 animate-fade-in"}`}
      onMouseDown={(e) => { if (e.target === overlayRef.current) setOpen(false); }}
    >
      <div className={`glass-card rounded-xl shadow-xl w-full max-w-md mx-4 overflow-visible transition-all duration-200 ${closing ? "opacity-0 scale-95" : "opacity-100 animate-scale-in"}`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-lp-border/30">
            <h3 className="font-semibold text-text">{title}</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-text-muted hover:text-text text-lg leading-none transition-colors p-1 rounded hover:bg-white/[0.04]"
              aria-label="Close dialog"
            >&times;</button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
