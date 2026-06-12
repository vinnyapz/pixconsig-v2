"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string; // Class for the trigger button
  variant?: "default" | "dark";
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  disabled = false,
  isLoading = false,
  className,
  variant = "default",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((op) => op.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter((op) => op.label.toLowerCase().includes(query));
  }, [options, searchQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (!open) {
      setSearchQuery(""); // Reset search on close
    }
  }, [open]);

  const toggleOpen = () => {
    if (disabled || isLoading) return;
    setOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  // Styles based on variant
  const styles =
    variant === "dark"
      ? {
          trigger:
            "bg-[#1c1c1e] border-[#4A5568]/50 text-[#E5E4E2] hover:bg-[#2d2d2d]",
          dropdown: "bg-[#1c1c1e] border-[#4A5568]/50 text-[#E5E4E2]",
          search: "bg-[#2d2d2d] text-[#E5E4E2] placeholder-gray-500",
          option: "hover:bg-[#2d2d2d] text-[#C0C0C0] hover:text-[#E5E4E2]",
          optionSelected: "bg-[#2d2d2d] text-[#00D9FF]",
          highlight: "text-[#00D9FF]",
        }
      : {
          trigger: "bg-white border-gray-300 text-gray-900 hover:bg-gray-50",
          dropdown: "bg-white border-gray-200 text-gray-900",
          search:
            "bg-gray-50 text-gray-900 placeholder-gray-400 border-gray-200",
          option: "hover:bg-gray-100 text-gray-700",
          optionSelected: "bg-blue-50 text-[#0066A1]",
          highlight: "text-[#0066A1]",
        };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        disabled={disabled || isLoading}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          styles.trigger,
          className,
        )}
      >
        <span
          className={cn("block truncate", !selectedOption && "text-gray-500")}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </div>
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border shadow-lg py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm",
            styles.dropdown,
          )}
        >
          <div className="sticky top-0 z-10 px-2 py-2 border-b border-gray-200/10 bg-inherit">
            <div className="relative">
              <Search
                className={cn(
                  "absolute left-2 top-2.5 h-4 w-4 opacity-50",
                  styles.highlight,
                )}
              />
              <input
                ref={searchInputRef}
                type="text"
                className={cn(
                  "w-full rounded-md py-2 pl-8 pr-4 text-sm outline-none",
                  styles.search,
                )}
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                Nenhum resultado encontrado.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative cursor-default select-none py-2 pl-3 pr-9 transition-colors",
                    option.value === value
                      ? styles.optionSelected
                      : styles.option,
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <span
                    className={cn(
                      "block truncate",
                      option.value === value && "font-semibold",
                    )}
                  >
                    {option.label}
                  </span>
                  {option.value === value && (
                    <span
                      className={cn(
                        "absolute inset-y-0 right-0 flex items-center pr-4",
                        styles.highlight,
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
