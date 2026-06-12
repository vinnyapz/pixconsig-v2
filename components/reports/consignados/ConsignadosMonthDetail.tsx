import React from "react";
import { formatCurrency } from "@/lib/utils";
import {
    Calendar,
    UserCheck,
    Briefcase,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { ConsignadosCurrentMonth } from "@/types/consignados-report";

interface ConsignadosMonthDetailProps {
    data: ConsignadosCurrentMonth;
}

export function ConsignadosMonthDetail({ data }: ConsignadosMonthDetailProps) {
    const getVariationIcon = () => {
        return data.variationVsPrevious.direction === "up" ? (
            <ArrowUpRight className="h-3 w-3 mr-1" />
        ) : (
            <ArrowDownRight className="h-3 w-3 mr-1" />
        );
    };

    const getVariationColor = () => {
        return data.variationVsPrevious.direction === "up" ? "text-green-600" : "text-red-600";
    };

    const getVariationText = () => {
        return data.variationVsPrevious.direction === "up" ? "aumento" : "redução";
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Mês Atual - {data.monthLabel}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Total</span>
                        <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(data.total)}
                    </p>
                    <span
                        className={`text-sm font-medium flex items-center mt-1 ${getVariationColor()}`}
                    >
                        {getVariationIcon()}
                        {data.variationVsPrevious.value}% vs. mês anterior
                    </span>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[#0066A1]">Servidor Público</span>
                        <UserCheck className="h-4 w-4 text-[#0066A1]" />
                    </div>
                    <p className="text-xl font-bold text-[#0066A1]">
                        {formatCurrency(data.servidorPublico)}
                    </p>
                    <span className="text-sm text-gray-500 mt-1">
                        {data.total > 0
                            ? ((data.servidorPublico / data.total) * 100).toFixed(1)
                            : "0.0"}
                        % do mês
                    </span>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-green-700">Contratados</span>
                        <Briefcase className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-xl font-bold text-green-700">
                        {formatCurrency(data.contratados)}
                    </p>
                    <span className="text-sm text-gray-500 mt-1">
                        {data.total > 0
                            ? ((data.contratados / data.total) * 100).toFixed(1)
                            : "0.0"}
                        % do mês
                    </span>
                </div>
            </div>
        </div>
    );
}
