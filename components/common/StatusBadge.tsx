import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status?: string;
    className?: string;
    variant?: "default" | "modern";
    label?: string; // Optional override
    color?: string; // Optional override for color classes
}

const statusConfig: Record<
    string,
    { label: string; color: string; modernColor: string }
> = {
    aguardando_analise: {
        label: "Aguardando Análise",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        modernColor: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    },
    aguardando_decreto: {
        label: "Aguardando Decreto",
        color: "bg-orange-100 text-orange-800 border-orange-200",
        modernColor: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    },
    processo_em_andamento: {
        label: "Em Andamento",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        modernColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    },
    ativa: {
        label: "Ativa",
        color: "bg-green-100 text-green-800 border-green-200",
        modernColor: "bg-green-500/20 text-green-400 border border-green-500/30",
    },
    inativa: {
        label: "Inativa",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        modernColor: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
    },
    reprovada: {
        label: "Reprovada",
        color: "bg-red-100 text-red-800 border-red-200",
        modernColor: "bg-red-500/20 text-red-400 border border-red-500/30",
    },
};

export function StatusBadge({
    status,
    className,
    variant = "default",
    label,
    color,
}: StatusBadgeProps) {
    const normalizedStatus = status?.toLowerCase() || "";
    const config = (statusConfig[normalizedStatus] as {
        label: string;
        color: string;
        modernColor: string;
    }) || {
        label: status || label || "",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        modernColor: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
    };

    const baseStyles =
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border";
    let colorStyles = variant === "modern" ? config.modernColor : config.color;

    if (color) {
        colorStyles = color;
    }

    return (
        <span className={cn(baseStyles, colorStyles, className)}>
            {label || config.label}
        </span>
    );
}
