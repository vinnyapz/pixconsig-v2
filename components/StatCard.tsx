'use client';
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    icon: React.ReactNode;
    description?: string;
    footerDetails?: React.ReactNode;
    userType?: 'superadmin' | 'admin' | 'master' | 'franqueado';
}

export function StatCard({
    title,
    value,
    trend,
    icon,
    description,
    footerDetails,
    userType = 'franqueado'
}: StatCardProps) {
    const isMaster = userType === 'master';

    const styles = isMaster ? {
        container: 'bg-gradient-to-br from-[#36454F] to-[#1c1c1e] overflow-hidden rounded-xl border border-[#4A5568]/50 shadow-lg shadow-[#00D9FF]/10 hover:shadow-[#00D9FF]/20 transition-all duration-200',
        iconContainer: 'bg-gradient-to-br from-[#00D9FF] to-[#00A8CC] shadow-lg shadow-[#00D9FF]/30 text-[#1c1c1e]',
        title: 'text-sm font-medium text-[#C0C0C0] truncate',
        value: 'text-2xl font-bold text-[#E5E4E2]',
        footer: 'bg-gradient-to-r from-[#36454F] to-[#4A5568] px-5 py-3 border-t border-[#4A5568]/30',
        trendPositive: 'text-[#00D9FF]',
        trendNegative: 'text-red-400',
        description: 'text-[#C0C0C0] ml-2'
    } : {
        container: 'bg-white overflow-hidden rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200',
        iconContainer: 'bg-[#0066A1]/10 text-[#0066A1]',
        title: 'text-sm font-medium text-gray-500 truncate',
        value: 'text-2xl font-bold text-gray-900',
        footer: 'bg-gray-50 px-5 py-3 border-t border-gray-100',
        trendPositive: 'text-green-600',
        trendNegative: 'text-red-600',
        description: 'text-gray-500 ml-2'
    };

    return (
        <div className={styles.container}>
            <div className="p-5">
                <div className="flex items-center">
                    <div className={`flex-shrink-0 p-3 rounded-lg ${styles.iconContainer}`}>
                        {icon}
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className={styles.title}>
                                {title}
                            </dt>
                            <dd>
                                <div className={styles.value}>{value}</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
            {(trend || description || footerDetails) && (
                <div className={styles.footer}>
                    {footerDetails ? (
                        footerDetails
                    ) : (
                        <div className="text-sm">
                            {trend && (
                                <span className={`font-medium inline-flex items-center ${trend.isPositive ? styles.trendPositive : styles.trendNegative}`}>
                                    {trend.isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                                    {Math.abs(trend.value)}%
                                </span>
                            )}
                            {trend && description && <span className="mx-2 text-gray-400">|</span>}
                            {description && <span className={styles.description}>{description}</span>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
