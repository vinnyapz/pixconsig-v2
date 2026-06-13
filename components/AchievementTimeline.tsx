'use client';
import React from 'react';
import { Check, Lock, Trophy } from 'lucide-react';

interface Achievement {
    id: number;
    target: number;
    label: string;
    icon: string;
}

interface AchievementTimelineProps {
    currentAmount: number;
    userType?: 'superadmin' | 'admin' | 'master' | 'franqueado';
}

export function AchievementTimeline({
    currentAmount,
    userType = 'franqueado'
}: AchievementTimelineProps) {
    const isMaster = userType === 'master'; // 'master' is the ID for Master user type

    const achievements: Achievement[] = [
        {
            id: 1,
            target: 100000,
            label: '100K',
            icon: '🥉'
        },
        {
            id: 2,
            target: 300000,
            label: '300K',
            icon: '🥈'
        },
        {
            id: 3,
            target: 500000,
            label: '500K',
            icon: '🥇'
        },
        {
            id: 4,
            target: 1000000,
            label: '1M',
            icon: '💎'
        },
        {
            id: 5,
            target: 3000000,
            label: '3M',
            icon: '💠'
        },
        {
            id: 6,
            target: 5000000,
            label: '5M',
            icon: '👑'
        }
    ];

    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return `R$ ${(value / 1000000).toFixed(1)}M`;
        }
        return `R$ ${(value / 1000).toFixed(0)}K`;
    };

    const getCurrentLevel = () => {
        for (let i = achievements.length - 1; i >= 0; i--) {
            if (currentAmount >= achievements[i].target) {
                return i;
            }
        }
        return -1;
    };

    const getNextLevel = () => {
        const currentLevel = getCurrentLevel();
        if (currentLevel < achievements.length - 1) {
            return currentLevel + 1;
        }
        return achievements.length - 1;
    };

    const currentLevel = getCurrentLevel();
    const nextLevel = getNextLevel();
    const nextTarget = achievements[nextLevel].target;
    const previousTarget =
        currentLevel >= 0 ? achievements[currentLevel].target : 0;
    const progressInCurrentRange = currentAmount - previousTarget;
    const rangeSize = nextTarget - previousTarget;
    const progressPercentage = Math.min(
        progressInCurrentRange / rangeSize * 100,
        100
    );

    // Calculate the width of the progress bar based on completed levels + current progress
    const getProgressBarWidth = () => {
        if (currentAmount >= achievements[achievements.length - 1].target) {
            return 100; // All levels completed
        }
        // Calculate the percentage width for each segment
        const segmentWidth = 100 / (achievements.length - 1);
        // Width for completed levels
        const completedWidth = currentLevel >= 0 ? currentLevel * segmentWidth : 0;
        // Width for current progress within the current segment
        const currentSegmentProgress = progressPercentage / 100 * segmentWidth;
        return completedWidth + currentSegmentProgress;
    };

    // Styles based on user type
    const styles = isMaster ?
        {
            container:
                'bg-[#1c1c1e] rounded-xl border border-gray-800 shadow-lg overflow-hidden',
            header:
                'px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800 bg-gradient-to-r from-[#36454F] to-[#4A5568]',
            iconBg: 'bg-white/10 rounded-lg backdrop-blur-sm',
            iconColor: 'text-[#00D9FF]',
            titleColor: 'text-white',
            subtitleColor: 'text-gray-300',
            textColor: 'text-gray-400',
            highlightColor: 'text-[#00D9FF]',
            progressBg: 'bg-gray-700',
            progressFill:
                'bg-gradient-to-r from-[#00D9FF] to-[#00A8E8] shadow-[0_0_10px_rgba(0,217,255,0.5)]',
            nodeCompleted:
                'bg-[#00D9FF]/20 border-[#00D9FF] shadow-[0_0_15px_rgba(0,217,255,0.3)]',
            nodeCurrent:
                'bg-[#36454F] border-[#00D9FF] shadow-[0_0_15px_rgba(0,217,255,0.5)]',
            nodeLocked: 'bg-[#2d2d2d] border-gray-600',
            checkColor: 'text-white',
            checkBg: 'bg-green-500',
            badgeCompleted:
                'bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20',
            badgeCurrent: 'bg-white/10 text-white border border-white/20'
        } :
        {
            container:
                'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden',
            header:
                'px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-[#0066A1] to-[#0088CC]',
            iconBg: 'bg-white/20 rounded-lg',
            iconColor: 'text-white',
            titleColor: 'text-white',
            subtitleColor: 'text-white/80',
            textColor: 'text-gray-600',
            highlightColor: 'text-[#0066A1]',
            progressBg: 'bg-gray-200',
            progressFill: 'bg-gradient-to-r from-[#0066A1] to-[#0088CC]',
            nodeCompleted:
                'bg-green-500 border-green-600 shadow-md sm:shadow-lg shadow-green-500/50',
            nodeCurrent:
                'bg-[#0066A1] border-[#0088CC] shadow-md sm:shadow-lg shadow-blue-500/50',
            nodeLocked: 'bg-gray-100 border-gray-300',
            checkColor: 'text-white',
            checkBg: '',
            badgeCompleted: 'bg-green-100 text-green-700',
            badgeCurrent: 'bg-blue-100 text-[#0066A1]'
        };

    return (
        <div className={`${styles.container} h-full flex flex-col`}>
            <div className={styles.header}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`p-1.5 sm:p-2 ${styles.iconBg}`}>
                            <Trophy className={`h-4 w-4 sm:h-6 sm:w-6 ${styles.iconColor}`} />
                        </div>
                        <div>
                            <h3
                                className={`text-sm sm:text-lg font-semibold ${styles.titleColor}`}>
                                Suas Conquistas
                            </h3>
                            <p className={`text-xs sm:text-sm ${styles.subtitleColor}`}>
                                {formatCurrency(currentAmount)} realizados
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div
                            className={`text-xl sm:text-2xl font-bold ${styles.titleColor}`}>
                            {currentLevel >= 0 ? achievements[currentLevel].icon : '🎯'}
                        </div>
                        <p
                            className={`text-[10px] sm:text-xs ${styles.subtitleColor} mt-0.5 sm:mt-1`}>
                            {currentLevel >= 0 ? `Nível ${currentLevel + 1}` : 'Iniciante'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-3 sm:p-4 flex-1 flex flex-col justify-center">
                {/* Progress Info */}
                <div className="mb-3 sm:mb-4 text-center">
                    <p className={`text-xs sm:text-sm ${styles.textColor} mb-1`}>
                        {currentLevel === achievements.length - 1 ?
                            <span className="text-green-600 font-semibold">
                                🎉 Parabéns! Você completou todos os níveis!
                            </span> :
                            <>
                                Faltam{' '}
                                <span className={`font-semibold ${styles.highlightColor}`}>
                                    {formatCurrency(nextTarget - currentAmount)}
                                </span>{' '}
                                para{' '}
                                <span
                                    className={`font-semibold ${isMaster ? 'text-white' : ''}`}>
                                    {achievements[nextLevel].icon} {achievements[nextLevel].label}
                                </span>
                            </>
                        }
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-gray-500">
                        <span>{Math.round(progressPercentage)}% completo</span>
                    </div>
                </div>

                {/* Timeline */}
                <div className="relative">
                    {/* Progress Bar Background */}
                    <div
                        className={`absolute top-5 sm:top-6 left-0 right-0 h-0.5 sm:h-1 ${styles.progressBg} rounded-full`} />

                    {/* Animated Progress Bar */}
                    <div
                        className={`absolute top-5 sm:top-6 left-0 h-0.5 sm:h-1 ${styles.progressFill} rounded-full transition-all duration-1000 ease-out`}
                        style={{
                            width: `${getProgressBarWidth()}%`
                        }} />

                    {/* Achievement Nodes */}
                    <div className="relative flex justify-between items-start">
                        {achievements.map((achievement, index) => {
                            const isCompleted = currentAmount >= achievement.target;
                            const isCurrent =
                                index === nextLevel && currentLevel !== achievements.length - 1;
                            const isLocked = currentAmount < achievement.target;
                            return (
                                <div
                                    key={achievement.id}
                                    className="flex flex-col items-center"
                                    style={{
                                        width: '16.666%'
                                    }}>

                                    {/* Node Circle */}
                                    <div
                                        className={`
                      relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                      transition-all duration-300 border-2 sm:border-3
                      ${isCompleted ? styles.nodeCompleted : isCurrent ? styles.nodeCurrent : styles.nodeLocked}
                      ${isMaster && isCompleted ? styles.checkBg : ''}
                    `}>
                                        {isCompleted ?
                                            <Check
                                                className={`h-5 w-5 sm:h-6 sm:w-6 ${styles.checkColor}`}
                                                strokeWidth={3} /> :
                                            isCurrent ?
                                                <span
                                                    className={`text-base sm:text-xl ${isMaster ? 'drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : ''}`}>
                                                    {achievement.icon}
                                                </span> :
                                                <Lock
                                                    className={`h-4 w-4 sm:h-5 sm:w-5 ${isMaster ? 'text-gray-500' : 'text-gray-400'}`} />
                                        }
                                    </div>

                                    {/* Label */}
                                    <div className="mt-1.5 sm:mt-2 text-center">
                                        <p
                                            className={`
                        text-[10px] sm:text-xs font-semibold
                        ${isCompleted ? isMaster ? 'text-[#00D9FF]' : 'text-green-600' : isCurrent ? isMaster ? 'text-white' : 'text-[#0066A1]' : isMaster ? 'text-gray-500' : 'text-gray-400'}
                      `}>
                                            {achievement.label}
                                        </p>
                                    </div>

                                    {/* Status Badge - Hidden on mobile for space */}
                                    {isCompleted &&
                                        <div
                                            className={`hidden sm:block mt-1 px-2 py-0.5 ${styles.badgeCompleted} text-[10px] font-medium rounded-full`}>
                                            Completo
                                        </div>
                                    }
                                    {isCurrent &&
                                        <div
                                            className={`hidden sm:block mt-1 px-2 py-0.5 ${styles.badgeCurrent} text-[10px] font-medium rounded-full`}>
                                            Atual
                                        </div>
                                    }
                                </div>);

                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
