import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface PopoverProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  className?: string;
  /** When "right-edge", align popover's right edge to the viewport. */
  position?: "anchor" | "right-edge";
  children: React.ReactNode;
}

interface Position {
  top: number;
  right: number;
}

const VIEWPORT_RIGHT_GAP = 16;

export function Popover({ open, anchorRef, onClose, className, position = "anchor", children }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [positionState, setPositionState] = useState<Position | null>(null);

  // Position next to the anchor or flush to viewport right edge
  useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const top = rect.bottom + 8;
    const right =
      position === "right-edge"
        ? VIEWPORT_RIGHT_GAP
        : Math.max(VIEWPORT_RIGHT_GAP, viewportWidth - rect.right - 8);
    setPositionState({ top, right });
  }, [open, anchorRef, position]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !positionState) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "fixed z-50 rounded-[24px] shadow-2xl",
          className
        )}
        style={{ top: positionState.top, right: positionState.right }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body
  );
}

