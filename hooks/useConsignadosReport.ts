import { useState, useEffect, useCallback } from 'react';
import { ConsignadosReportResponse } from '@/types/consignados-report';

interface UseConsignadosReportReturn {
    data: ConsignadosReportResponse | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useConsignadosReport(
    stateFilter: string,
    period: string
): UseConsignadosReportReturn {
    const [data, setData] = useState<ConsignadosReportResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (stateFilter !== 'all') params.set('state', stateFilter);
            if (period !== 'monthly') params.set('period', period);

            const response = await fetch(
                `/api/reports/consignados?${params.toString()}`
            );

            if (!response.ok) {
                throw new Error('Erro ao carregar relatório');
            }

            const json: ConsignadosReportResponse = await response.json();
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, [stateFilter, period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}
