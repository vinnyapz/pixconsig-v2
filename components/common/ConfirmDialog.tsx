import React, { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    title: string;
    description: React.ReactNode;
    cancelText?: string;
    confirmText?: string;
    variant?: "default" | "destructive"; // Controls the confirm button style
    theme?: "default" | "dark"; // Controls the modal theme (light/dark mode)
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    cancelText = "Cancelar",
    confirmText = "Confirmar",
    variant = "default",
    theme = "default",
    loading = false,
}: ConfirmDialogProps) {
    const [internalLoading, setInternalLoading] = useState(false);

    // If external loading prop is provided, use it. Otherwise, manage internal loading state if onConfirm returns a promise.
    const isLoading = loading || internalLoading;

    const handleConfirm = async () => {
        try {
            setInternalLoading(true);
            await onConfirm();
        } catch (error) {
            console.error("Error in confirmation:", error);
        } finally {
            setInternalLoading(false);
            // We don't close automatically here because the parent might want to handle success/error state or close manually.
            // But typically a confirm dialog closes on success.
            // Let's assume the parent handles closing, or we close if no error?
            // Usually better to let parent control `isOpen`.
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            variant={theme}
            maxWidth="sm"
        >
            <div className="flex flex-col gap-6">
                <div className="text-sm text-muted-foreground">
                    {description}
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className={theme === "dark" ? "bg-transparent border-input hover:bg-white/10 text-white" : ""}
                    >
                        {cancelText}
                    </Button>

                    <Button
                        variant={variant}
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={theme === "dark" && variant === "default" ? "bg-[#00D9FF] text-[#1c1c1e] hover:bg-[#00A8CC]" : ""}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            confirmText
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
