'use client';

import React from 'react';
import { Building2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { UserType } from '@/types';

interface ConsolidatedPrefeiturasCardProps {
    total: number;
    pending: number;
    active: number;
    inactive?: number;
    userType?: UserType;
    title?: string;
}

export function ConsolidatedPrefeiturasCard({
    total,
    pending,
    active,
    inactive = 0,
    userType = 'admin',
    title = 'Total Prefeituras'
}: ConsolidatedPrefeiturasCardProps) {
    const isMaster = userType === 'master';

    const styles = isMaster ? {
        card: "bg-gradient-to-br from-[#36454F] to-[#1c1c1e] border-[#4A5568]/50 shadow-lg shadow-[#00D9FF]/10 hover:shadow-[#00D9FF]/20",
        statsIconBg: "bg-[#00D9FF]/10 text-[#00D9FF]",
        statsIconBgContainer: "bg-gradient-to-br from-[#00D9FF] to-[#00A8CC] shadow-lg shadow-[#00D9FF]/30",
        statsIcon: "text-[#1c1c1e]",
        textPrimary: "text-[#E5E4E2]",
        textSecondary: "text-[#C0C0C0]",
        footer: "bg-gradient-to-r from-[#36454F] to-[#4A5568] border-t border-[#4A5568]/30",
        badgePending: "bg-yellow-500/20 border border-yellow-500/30 text-yellow-400",
        badgeActive: "bg-[#00D9FF]/20 border border-[#00D9FF]/30 text-[#00D9FF]",
        badgeInactive: "bg-red-500/20 border border-red-500/30 text-red-400",
        iconPending: "text-yellow-400",
        iconActive: "text-[#00D9FF]",
        iconInactive: "text-red-400",
    } : {
        card: "bg-white border-gray-200 shadow-sm hover:shadow-md",
        statsIconBg: "bg-[#0066A1]/10 text-[#0066A1]",
        statsIconBgContainer: "bg-[#0066A1]/10 text-[#0066A1]",
        statsIcon: "text-[#0066A1]",
        textPrimary: "text-gray-900",
        textSecondary: "text-gray-500",
        footer: "bg-gray-50 border-t border-gray-100",
        badgePending: "bg-yellow-100",
        badgeActive: "bg-green-100",
        badgeInactive: "bg-red-100",
        iconPending: "text-yellow-600",
        iconActive: "text-green-600",
        iconInactive: "text-red-600",
    };

    return (
        <div className={`overflow-hidden rounded-xl border transition-all duration-200 ${styles.card}`}>
            <div className="p-5">
                <div className="flex items-center">
                    <div className={`flex-shrink-0 p-3 rounded-lg ${isMaster ? styles.statsIconBgContainer : styles.statsIconBg}`}>
                        <Building2 className={`h-6 w-6 ${isMaster ? styles.statsIcon : ''}`} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className={`text-sm font-medium truncate ${styles.textSecondary}`}>
                                {title}
                            </dt>
                            <dd>
                                <div className={`text-2xl font-bold ${styles.textPrimary}`}>
                                    {total}
                                </div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
            <div className={`px-5 py-3 ${styles.footer}`}>
                <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full ${styles.badgePending}`}>
                            <Clock className={`h-3 w-3 ${styles.iconPending}`} />
                        </div>
                        <span className={`font-medium ${styles.iconPending.replace('text-', 'text-').replace('600', '700').replace('400', '400')}`}>
                            {pending}
                        </span>
                        <span className={styles.textSecondary}>Andamento</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full ${styles.badgeActive}`}>
                            <CheckCircle2 className={`h-3 w-3 ${styles.iconActive}`} />
                        </div>
                        <span className={`font-medium ${styles.iconActive.replace('text-', 'text-').replace('600', '700').replace('400', '400')}`}>
                            {active}
                        </span>
                        <span className={styles.textSecondary}>Ativas</span>
                    </div>

                </div>
            </div>
        </div>
    );
}
