/** Dados agregados por estado */
export interface StateReportItem {
    state: string;               // Ex: "SP", "RJ"
    totalLoans: number;          // Soma de loans PAID
    servidorPublico: number;     // Soma de loans PAID tipo SERVIDOR
    contratados: number;         // Soma de loans PAID tipo CONTRATADO
    prefeituras: number;         // Count de prefeituras com loans no estado
    color: string;               // Cor para o PieChart (atribuída no backend)
}

/** Resposta completa da API */
export interface RegionalReportResponse {
    states: StateReportItem[];
    summary: {
        totalLoans: number;
        totalServidor: number;
        totalContratados: number;
        totalPrefeituras: number;
    };
}
