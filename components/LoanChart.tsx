'use client';
import React from 'react';
import { BarChart3 } from 'lucide-react';

interface MonthData {
    month: string;
    value: number;
}

interface LoanChartProps {
    data: MonthData[];
    userType?: string;
}

export function LoanChart({
    data,
    userType = 'franqueado'
}: LoanChartProps) {
    const isMaster = userType === 'master';
    const maxValue = Math.max(...data.map((d) => d.value));

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatShortCurrency = (value: number) => {
        if (value >= 1000000) {
            return `R$ ${(value / 1000000).toFixed(1)}M`;
        }
        return `R$ ${(value / 1000).toFixed(0)}K`;
    };

    // Generate Y-axis scale (5 levels)
    const yAxisLevels = Array.from({
        length: 5
    }, (_, i) => {
        return maxValue * (1 - i * 0.25);
    });

    const styles = isMaster ? {
        container: 'bg-[#1c1c1e] rounded-xl border border-gray-800 shadow-lg overflow-hidden',
        header: 'px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-[#36454F] to-[#4A5568] flex items-center justify-between',
        title: 'text-lg font-semibold text-white',
        subtitle: 'text-sm text-gray-400 mt-1',
        icon: 'h-5 w-5 text-[#00D9FF]',
        axisText: 'text-xs text-gray-400 text-right pr-2',
        gridLines: 'border-b border-l border-gray-700',
        barGradient: 'bg-gradient-to-t from-[#00D9FF] to-[#00A8E8] hover:from-[#00B4D8] hover:to-[#00D9FF]',
        monthLabel: 'text-[10px] font-medium text-gray-400 text-center whitespace-nowrap mt-2 pb-1'
    } : {
        container: 'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden',
        header: 'px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between',
        title: 'text-lg font-semibold text-gray-900',
        subtitle: 'text-sm text-gray-500 mt-1',
        icon: 'h-5 w-5 text-[#0066A1]',
        axisText: 'text-xs text-gray-500 text-right pr-2',
        gridLines: 'border-b border-l border-gray-200',
        barGradient: 'bg-gradient-to-t from-[#0066A1] to-[#0088CC] hover:from-[#005585] hover:to-[#0066A1]',
        monthLabel: 'text-[10px] font-medium text-gray-600 text-center whitespace-nowrap mt-2 pb-1'
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>
                        Consignado por Mês
                    </h3>
                    <p className={styles.subtitle}>Últimos 12 meses</p>
                </div>
                <BarChart3 className={styles.icon} />
            </div>

            <div className="p-6">
                <div className="flex gap-4">
                    {/* Y-axis scale */}
                    <div className="flex flex-col justify-between h-80 py-2">
                        {yAxisLevels.map((value, index) => (
                            <div key={index} className={styles.axisText}>
                                {formatShortCurrency(value)}
                            </div>
                        ))}
                    </div>

                    {/* Chart area */}
                    <div className={`flex-1 flex items-end justify-between gap-4 h-80 rounded-bl-lg ${styles.gridLines}`}>
                        {data.map((item, index) => {
                            const heightPercentage = item.value / maxValue * 100;
                            // Show only last 6 months on mobile, all on desktop
                            // Assuming data is sorted chronologically, we want the last 6 items
                            const isVisibleOnMobile = index >= data.length - 6;
                            return (
                                <div key={index} className={`flex-1 flex flex-col items-center group relative ${!isVisibleOnMobile ? 'hidden md:flex' : 'flex'}`} style={{
                                    height: '100%'
                                }}>

                                    {/* Bar Container - takes full height and aligns bar to bottom */}
                                    <div className="w-full flex-1 flex items-end justify-center pb-2">
                                        <div className={`w-full rounded-t-lg transition-all duration-300 ease-out cursor-pointer relative ${styles.barGradient}`} style={{
                                            height: `${heightPercentage}%`,
                                            minHeight: '8px'
                                        }}>

                                            {/* Tooltip on hover */}
                                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                {formatCurrency(item.value)}
                                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Month label */}
                                    <div className={styles.monthLabel}>
                                        {item.month.split(' ')[0]}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
