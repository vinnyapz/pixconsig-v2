import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "dark"; // Dark for modernization/masters
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  variant = "default",
  maxWidth = "lg",
}: ModalProps) {
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

  if (!isOpen) return null;

  const styles =
    variant === "dark"
      ? {
          overlay: "bg-black/80 backdrop-blur-sm",
          content: "bg-[#1c1c1e] border border-[#4A5568]/50 text-[#E5E4E2]",
          title: "text-[#E5E4E2]",
          closeBtn: "text-gray-400 hover:text-white",
          headerBorder: "border-[#4A5568]/30",
        }
      : {
          overlay: "bg-black/60 backdrop-blur-sm",
          content: "bg-white shadow-2xl",
          title: "text-gray-900",
          closeBtn: "text-gray-400 hover:text-gray-600",
          headerBorder: "border-gray-200",
        };

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full m-4",
  };

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center z-50 p-4",
        styles.overlay,
      )}
    >
      <div
        className={cn(
          "w-full rounded-xl relative max-h-[90vh] flex flex-col",
          styles.content,
          maxWidthClasses[maxWidth],
          className,
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between p-6 border-b shrink-0",
            styles.headerBorder,
          )}
        >
          <h2 className={cn("text-xl font-bold", styles.title)}>{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={cn(
              "transition-colors rounded-lg hover:bg-gray-100/10 h-8 w-8",
              styles.closeBtn,
            )}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
