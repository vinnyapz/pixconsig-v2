'use client';
import React from 'react';
import { Trophy } from 'lucide-react';

interface RankingItem {
    id: string;
    name: string;
    value: string | number;
    avatar?: string;
}

interface RankingCardProps {
    title: string;
    items: RankingItem[];
    type: 'money' | 'count';
    userType?: 'superadmin' | 'admin' | 'master' | 'franqueado';
}

export function RankingCard({
    title,
    items,
    type,
    userType = 'franqueado'
}: RankingCardProps) {
    const isMaster = userType === 'master';

    const styles = isMaster ? {
        container: 'bg-[#1c1c1e] rounded-xl border border-gray-800 shadow-lg overflow-hidden h-full',
        header: 'px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-[#36454F] to-[#4A5568] flex items-center justify-between',
        title: 'text-lg font-semibold text-white',
        icon: 'h-5 w-5 text-[#00D9FF]',
        list: 'divide-y divide-gray-800',
        itemHover: 'hover:bg-white/5',
        name: 'text-sm font-medium text-gray-200',
        value: 'text-sm font-semibold text-[#00D9FF]',
        rank: (index: number) => {
            if (index === 0) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
            if (index === 1) return 'bg-gray-400/20 text-gray-300 border border-gray-400/30';
            if (index === 2) return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
            return 'bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20';
        }
    } : {
        container: 'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full',
        header: 'px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between',
        title: 'text-lg font-semibold text-gray-900',
        icon: 'h-5 w-5 text-yellow-500',
        list: 'divide-y divide-gray-100',
        itemHover: 'hover:bg-gray-50',
        name: 'text-sm font-medium text-gray-900',
        value: 'text-sm font-semibold text-[#0066A1]',
        rank: (index: number) => {
            if (index === 0) return 'bg-yellow-100 text-yellow-700';
            if (index === 1) return 'bg-gray-100 text-gray-700';
            if (index === 2) return 'bg-orange-100 text-orange-700';
            return 'bg-blue-50 text-[#0066A1]';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>{title}</h3>
                <Trophy className={styles.icon} />
            </div>
            <ul className={styles.list}>
                {items.map((item, index) => (
                    <li key={item.id} className={`px-6 py-4 transition-colors ${styles.itemHover}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${styles.rank(index)}`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <p className={styles.name}>
                                        {item.name}
                                    </p>
                                </div>
                            </div>
                            <div className={styles.value}>
                                {item.value}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
