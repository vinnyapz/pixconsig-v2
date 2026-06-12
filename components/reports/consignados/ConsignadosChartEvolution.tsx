import React from "react";
import { formatCurrency } from "@/lib/utils";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ConsignadosEvolutionItem } from "@/types/consignados-report";

interface ConsignadosChartEvolutionProps {
    data: ConsignadosEvolutionItem[];
    period: string;
    onPeriodChange: (value: string) => void;
}

export function ConsignadosChartEvolution({
    data,
    period,
    onPeriodChange,
}: ConsignadosChartEvolutionProps) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    Evolução de Empréstimos - {new Date().getFullYear()}
                </h3>
                <Select value={period} onValueChange={onPeriodChange}>
                    <SelectTrigger className="w-[120px] h-9">
                        <SelectValue placeholder="Mensal" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `R$${value / 1000000}M`}
                        />
                        <Tooltip
                            formatter={(value: number, name: string) => [
                                formatCurrency(value),
                                name === "servidorPublico"
                                    ? "Servidor Público"
                                    : "Contratados",
                            ]}
                            contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                        />
                        <Legend
                            formatter={(value) =>
                                value === "servidorPublico"
                                    ? "Servidor Público"
                                    : "Contratados"
                            }
                        />
                        <Bar
                            dataKey="servidorPublico"
                            name="servidorPublico"
                            fill="#0066A1"
                            radius={[4, 4, 0, 0]}
                            stackId="stack"
                        />
                        <Bar
                            dataKey="contratados"
                            name="contratados"
                            fill="#10B981"
                            radius={[4, 4, 0, 0]}
                            stackId="stack"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
