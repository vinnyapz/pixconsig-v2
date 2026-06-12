import { useState, useEffect, useCallback } from 'react';
import { RegionalReportResponse } from '@/types/regional-report';

interface UseRegionalReportReturn {
    data: RegionalReportResponse | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useRegionalReport(): UseRegionalReportReturn {
    const [data, setData] = useState<RegionalReportResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/reports/regional');
            if (!response.ok) throw new Error('Erro ao carregar relatório regional');
            const json: RegionalReportResponse = await response.json();
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}
