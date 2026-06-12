export interface FranqueadoSummary {
    id: string;
    name: string;
    email?: string;
    citiesRegistered: number;
    loanAmount: number;
    commissionRate: number;
}

export interface Master {
    id: string;
    name: string;
    email: string;
    phone: string;
    document?: string;
    commissionRate: number;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    registrationDate?: string;
    franqueados: FranqueadoSummary[];
}
