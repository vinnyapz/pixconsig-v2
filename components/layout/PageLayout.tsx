'use client';
import React from 'react';
import { TopBar } from '@/components/TopBar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { UserType } from '@/types';

interface PageLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode; // Button or extra controls in header
    className?: string;
    containerClassName?: string;
}

export function PageLayout({
    children,
    title,
    subtitle,
    actions,
    className,
    containerClassName
}: PageLayoutProps) {
    const { userType, logout, user } = useAuth();

    if (!userType) return null;

    const isDark = userType === 'master'; // Logic based on current usage

    const styles = isDark ? {
        container: 'min-h-screen bg-[#1c1c1e]',
        title: 'text-[#E5E4E2]',
        subtitle: 'text-[#C0C0C0]'
    } : {
        container: 'min-h-screen bg-gray-50',
        title: 'text-gray-900',
        subtitle: 'text-gray-500'
    };

    return (
        <div className={cn(styles.container, className)}>
            <TopBar userType={userType} userEmail={user?.email} onLogout={logout} />

            <main className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500", containerClassName)}>
                {(title || actions) && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            {title && <h1 className={cn("text-2xl font-bold", styles.title)}>{title}</h1>}
                            {subtitle && <p className={cn("mt-1", styles.subtitle)}>{subtitle}</p>}
                        </div>
                        {actions && (
                            <div className="flex items-center gap-3">
                                {actions}
                            </div>
                        )}
                    </div>
                )}

                {children}
            </main>
        </div>
    );
}
