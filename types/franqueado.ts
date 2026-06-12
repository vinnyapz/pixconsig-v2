export interface Franqueado {
    id: string;
    name: string;
    email: string;
    phone: string;
    document?: string;
    commissionRate: number;
    registrationDate?: string;
    citiesRegistered?: number;
    loanAmount?: number;
    status?: 'ATIVA' | 'INATIVA' | 'active' | 'inactive';
    masterId?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
}
