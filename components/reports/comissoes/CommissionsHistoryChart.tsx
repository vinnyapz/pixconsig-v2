import React from "react";
import { formatCurrency } from "@/lib/utils";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer,
} from "recharts";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ComissoesHistoryItem } from "@/types/comissoes-report";

interface CommissionsHistoryChartProps {
    data: ComissoesHistoryItem[];
    period: string;
    onPeriodChange: (value: string) => void;
}

export function CommissionsHistoryChart({
    data, period, onPeriodChange,
}: CommissionsHistoryChartProps) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    Histórico de Comissões
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
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `R$${value / 1000}k`}
                        />
                        <Tooltip
                            formatter={(value: number, name: string) => [
                                formatCurrency(value),
                                name === "masterCommission" ? "Masters" : "Franqueados",
                            ]}
                            contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                        />
                        <Legend
                            formatter={(value) =>
                                value === "masterCommission" ? "Masters" : "Franqueados"
                            }
                        />
                        <Area
                            type="monotone"
                            dataKey="masterCommission"
                            name="masterCommission"
                            stroke="#8B5CF6"
                            fill="#8B5CF6"
                            fillOpacity={0.1}
                            stackId="stack"
                        />
                        <Area
                            type="monotone"
                            dataKey="franqueadoCommission"
                            name="franqueadoCommission"
                            stroke="#0066A1"
                            fill="#0066A1"
                            fillOpacity={0.1}
                            stackId="stack"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
