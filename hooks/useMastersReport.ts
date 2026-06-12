import { useState, useEffect, useCallback } from 'react';
import { MastersReportResponse } from '@/types/masters-report';

interface UseMastersReportReturn {
    data: MastersReportResponse | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useMastersReport(period: string): UseMastersReportReturn {
    const [data, setData] = useState<MastersReportResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (period !== 'monthly') params.set('period', period);
            const response = await fetch(`/api/reports/masters?${params.toString()}`);
            if (!response.ok) throw new Error('Erro ao carregar relatório de masters');
            const json: MastersReportResponse = await response.json();
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, [period]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}
