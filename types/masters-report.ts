/** Performance individual de um Master */
export interface MasterPerformanceItem {
    id: string;
    name: string;
    totalLoans: number;          // Soma de loans PAID das prefeituras do master
    prefeituraCount: number;     // Qtd de prefeituras vinculadas
    franqueadoCount: number;     // Qtd de franqueados vinculados
    growth: number;              // % de crescimento vs período anterior
}

/** Resposta completa da API */
export interface MastersReportResponse {
    masters: MasterPerformanceItem[];
    summary: {
        totalMasters: number;
        totalLoans: number;
        totalPrefeituras: number;
        totalFranqueados: number;
    };
}
