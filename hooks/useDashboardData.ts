
'use client';

import { useState, useEffect } from 'react';
import { DashboardSummaryResponse } from '@/types/dashboard';

interface UseDashboardDataReturn {
    data: DashboardSummaryResponse | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useDashboardData(): UseDashboardDataReturn {
    const [data, setData] = useState<DashboardSummaryResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/dashboard/summary');
            if (!res.ok) {
                throw new Error('Falha ao carregar dados do dashboard');
            }
            const json: DashboardSummaryResponse = await res.json();
            setData(json);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return { data, isLoading, error, refetch: fetchData };
}
