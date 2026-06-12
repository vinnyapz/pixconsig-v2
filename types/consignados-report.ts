/** Item de evolução mensal para o gráfico de barras */
export interface ConsignadosEvolutionItem {
    month: string;           // Ex: "Jan", "Fev", "Mar"
    year: number;            // Ex: 2026
    servidorPublico: number; // Soma de PAID + type=SERVIDOR no mês
    contratados: number;     // Soma de PAID + type=CONTRATADO no mês
    total: number;           // servidorPublico + contratados
}

/** Item de distribuição para o gráfico de pizza */
export interface ConsignadosDistributionItem {
    name: string;   // "Servidor Público" | "Contratados"
    value: number;  // Soma total
    color: string;  // "#0066A1" | "#10B981"
}

/** Variação percentual comparativa */
export interface PercentageVariation {
    value: number;      // Ex: 12.5
    direction: "up" | "down"; // Para escolher ArrowUpRight ou ArrowDownRight
}

/** Detalhe do mês atual */
export interface ConsignadosCurrentMonth {
    monthLabel: string;        // Ex: "Fevereiro 2026"
    total: number;
    servidorPublico: number;
    contratados: number;
    variationVsPrevious: PercentageVariation; // vs mês anterior
}

/** Resposta completa da API */
export interface ConsignadosReportResponse {
    summary: {
        totalGeral: number;
        totalServidorPublico: number;
        totalContratados: number;
        variationTotal: PercentageVariation;        // vs ano/mês anterior
        variationServidorPublico: PercentageVariation;
        variationContratados: PercentageVariation;

        // Novos campos para Pendentes
        totalPendentes: number;
        pendingServidor: number;
        pendingContratados: number;
    };
    evolution: ConsignadosEvolutionItem[];
    distribution: ConsignadosDistributionItem[];
    currentMonth: ConsignadosCurrentMonth;
    availableStates: string[];  // Lista de UFs com dados
}
