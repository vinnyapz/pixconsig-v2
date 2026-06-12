"use client";
import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  headerActions?: React.ReactNode;
}

const sizeClasses = {
  sm: "max-w-sm", // 384px
  md: "max-w-md", // 448px
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl", // 1280px
};

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className,
  size = "lg",
  headerActions,
}: DrawerProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl",
          "w-full transition-transform duration-300 ease-out",
          sizeClasses[size],
          isOpen ? "translate-x-0" : "translate-x-full",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/80 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-gray-500 truncate">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            {headerActions}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Fechar painel"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}

// Tab component for use inside the Drawer
interface DrawerTabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function DrawerTabs({ tabs, activeTab, onTabChange }: DrawerTabsProps) {
  return (
    <div className="flex border-b border-gray-200 px-6 bg-white sticky top-0 z-10">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant="ghost"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-3 h-auto rounded-none text-sm font-medium border-b-2 transition-colors -mb-px hover:bg-transparent",
            activeTab === tab.id
              ? "border-[#0066A1] text-[#0066A1]"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
          )}
        >
          {tab.icon}
          {tab.label}
        </Button>
      ))}
    </div>
  );
}

// Card component for displaying items in Drawer
interface DrawerCardProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string;
  value?: string | React.ReactNode;
}

export function DrawerCard({
  children,
  className,
  onClick,
  icon,
  label,
  value,
}: DrawerCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow",
        onClick && "cursor-pointer hover:border-[#0066A1]/30",
        className,
      )}
    >
      {icon || label || value ? (
        <div className="flex items-start gap-3">
          {icon && <div className="text-[#0066A1] shrink-0">{icon}</div>}
          <div className="min-w-0 flex-1">
            {label && <p className="text-xs text-gray-500 mb-0.5">{label}</p>}
            {value && (
              <p className="text-sm font-medium text-gray-900 truncate">
                {value}
              </p>
            )}
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
