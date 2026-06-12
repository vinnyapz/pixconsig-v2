/** Item de evolução temporal para o AreaChart */
export interface ComissoesHistoryItem {
    month: string;          // Ex: "Jan", "Fev" (mensal) ou "2024" (anual)
    year: number;           // Ex: 2026
    totalCommission: number; // Soma de comissões de Master + Franqueado naquele período
    masterCommission: number;
    franqueadoCommission: number;
    originalDate: Date;     // Para ordenação e formatação
}

/** Item individual de agente (Master ou Franqueado) para a tabela */
export interface CommissionByAgent {
    id: string;
    name: string;
    role: 'Master' | 'Franqueado';
    commissionRate: number;     // Ex: 15
    totalLoans: number;         // Soma dos empréstimos PAID vinculados
    totalCommission: number;    // totalLoans * (commissionRate / 100)
}

/** Resposta completa da API */
export interface ComissoesReportResponse {
    summary: {
        totalCommission: number;         // Soma geral de comissões
        totalMasterCommission: number;   // Comissões de Masters
        totalFranqueadoCommission: number; // Comissões de Franqueados
        totalLoansValue: number;         // Valor total dos empréstimos PAID
    };
    history: ComissoesHistoryItem[];       // Para o AreaChart
    agents: CommissionByAgent[];           // Para a tabela de detalhamento
    availableStates: string[];             // Lista de UFs com dados (para filtro)
}
