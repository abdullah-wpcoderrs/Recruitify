"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  align?: "start" | "end";
  side?: "top" | "bottom";
}

export function DropdownMenu({ children, trigger, align = "end", side = "bottom" }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    let top = rect.bottom + scrollY + 4; // Add small gap
    let left = rect.left + scrollX;
    
    if (side === "top") {
      top = rect.top + scrollY - (menuRef.current?.offsetHeight || 0) - 4;
    }
    
    if (align === "end") {
      left = rect.right + scrollX - (menuRef.current?.offsetWidth || 0);
    }
    
    setPosition({ top, left });
  }, [align, side]);

  React.useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Dropdown state toggled
    setIsOpen(prev => !prev);
  };

  return (
    <>
      <div 
        ref={triggerRef} 
        onMouseDown={handleTriggerClick}
        data-dropdown-trigger="true"
        style={{ display: 'inline-block' }}
      >
        {trigger}
      </div>
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] min-w-[12rem] overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-xl"
            style={{
              top: position.top,
              left: position.left,
            }}
            data-dropdown-menu="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div onClick={() => setIsOpen(false)}>
              {children}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "destructive";
}

export function DropdownMenuItem({ 
  children, 
  onClick, 
  className,
  variant = "default"
}: DropdownMenuItemProps) {
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-gray-50 focus:bg-gray-50",
        variant === "destructive" && "text-red-600 hover:bg-red-50 focus:bg-red-50",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="-mx-1 my-1 h-px bg-gray-100" />;
}