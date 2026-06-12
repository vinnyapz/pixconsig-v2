import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { StateReportItem } from '@/types/regional-report';

interface RegionalPieChartProps {
    states: StateReportItem[];
}

export function RegionalPieChart({ states }: RegionalPieChartProps) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Concentração de Empréstimos por Estado
            </h3>
            <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Donut Chart - Consolidado */}
                <div className="w-full lg:w-1/2 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={states}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={2}
                                dataKey="totalLoans"
                                nameKey="state"
                            >
                                {states.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="w-full lg:w-1/2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {states.map((state) => (
                            <div
                                key={state.state}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all"
                            >
                                <div
                                    className="w-4 h-4 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: state.color }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-gray-900">
                                            {state.state}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {state.prefeituras} pref.
                                        </span>
                                    </div>
                                    <div className="text-sm font-semibold text-[#0066A1]">
                                        {formatCurrency(state.totalLoans)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
