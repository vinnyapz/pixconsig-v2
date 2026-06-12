import { useState, useEffect, useCallback } from 'react';
import { ComissoesReportResponse } from '@/types/comissoes-report';

interface UseComissoesReportReturn {
    data: ComissoesReportResponse | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useComissoesReport(
    stateFilter: string,
    period: string
): UseComissoesReportReturn {
    const [data, setData] = useState<ComissoesReportResponse | null>(null);
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
                `/api/reports/comissoes?${params.toString()}`
            );

            if (!response.ok) {
                throw new Error('Erro ao carregar relatório de comissões');
            }

            const json: ComissoesReportResponse = await response.json();
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
