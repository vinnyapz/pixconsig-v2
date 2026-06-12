import React from "react";
import { formatCurrency, cn } from "@/lib/utils";
import {
    DollarSign,
    UserCheck,
    Briefcase,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
} from "lucide-react";
import { PercentageVariation } from "@/types/consignados-report";

interface ConsignadosMetricsProps {
    totalGeral: number;
    totalPendentes: number;
    totalServidorPublico: number;
    pendingServidor: number;
    totalContratados: number;
    pendingContratados: number;
    variationTotal: PercentageVariation;
    variationServidorPublico: PercentageVariation;
    variationContratados: PercentageVariation;
}

export function ConsignadosMetrics({
    totalGeral,
    totalPendentes,
    totalServidorPublico,
    pendingServidor,
    totalContratados,
    pendingContratados,
    variationTotal,
    variationServidorPublico,
    variationContratados,
}: ConsignadosMetricsProps) {
    const getVariationIcon = (variation: PercentageVariation) => {
        return variation.direction === "up" ? (
            <ArrowUpRight className="h-3 w-3 mr-1" />
        ) : (
            <ArrowDownRight className="h-3 w-3 mr-1" />
        );
    };

    const getVariationColor = (variation: PercentageVariation) => {
        return variation.direction === "up" ? "text-green-600" : "text-red-600";
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Geral */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">
                        Total em Empréstimos (Pago)
                    </h3>
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <DollarSign className="h-5 w-5 text-[#0066A1]" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(totalGeral)}
                    </span>
                    <span
                        className={cn(
                            "text-sm font-medium flex items-center",
                            getVariationColor(variationTotal)
                        )}
                    >
                        {getVariationIcon(variationTotal)}
                        {variationTotal.value}%
                    </span>
                </div>

                {/* Seção de Pendentes */}
                <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-yellow-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                        Pendente: {formatCurrency(totalPendentes)}
                    </span>
                </div>
            </div>

            {/* Servidor Público */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-[#0066A1]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">
                        Servidor Público
                    </h3>
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <UserCheck className="h-5 w-5 text-[#0066A1]" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(totalServidorPublico)}
                    </span>
                    <span
                        className={cn(
                            "text-sm font-medium flex items-center",
                            getVariationColor(variationServidorPublico)
                        )}
                    >
                        {getVariationIcon(variationServidorPublico)}
                        {variationServidorPublico.value}%
                    </span>
                </div>

                {/* Seção de Pendentes */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                            {formatCurrency(pendingServidor)}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500">
                        {totalGeral > 0
                            ? ((totalServidorPublico / totalGeral) * 100).toFixed(1)
                            : "0.0"}
                        % do total pago
                    </p>
                </div>
            </div>

            {/* Contratados */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-green-500">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Contratados</h3>
                    <div className="p-2 bg-green-50 rounded-lg">
                        <Briefcase className="h-5 w-5 text-green-600" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(totalContratados)}
                    </span>
                    <span
                        className={cn(
                            "text-sm font-medium flex items-center",
                            getVariationColor(variationContratados)
                        )}
                    >
                        {getVariationIcon(variationContratados)}
                        {variationContratados.value}%
                    </span>
                </div>

                {/* Seção de Pendentes */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                            {formatCurrency(pendingContratados)}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500">
                        {totalGeral > 0
                            ? ((totalContratados / totalGeral) * 100).toFixed(1)
                            : "0.0"}
                        % do total pago
                    </p>
                </div>
            </div>
        </div>
    );
}
