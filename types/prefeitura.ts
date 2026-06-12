import { FranqueadoSummary } from './master';

export interface Loan {
    id: string;
    date: string;
    amount: number;
    status: 'PAID' | 'PENDING' | 'REJECTED' | string;
    type?: 'SERVIDOR' | 'CONTRATADO' | string;
    loanType?: string;
    observations?: string;
    prefeituraId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface PrefeituraFile {
    id: string;
    name: string;
    url: string;
    type: string;
    uploadDate: string;
    size: number;
    prefeituraId: string;
}

export interface Master {
    id: string;
    name: string;
    email: string;
    phone: string;
    document?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    commissionRate: number;
    registrationDate?: string;
    franqueados?: FranqueadoSummary[];
}

export interface Franqueado {
    id: string;
    name: string;
    email: string;
    phone: string;
    document?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    commissionRate: number;
    masterId: string;
    status?: 'active' | 'inactive';
    registrationDate?: string;
    citiesRegistered?: number;
    loanAmount?: number;
}

export interface Prefeitura {
    id: string;
    city: string;
    state: string;
    ibgeCode?: string;
    cnpj?: string | null;
    status: 'AGUARDANDO_ANALISE' | 'AGUARDANDO_DECRETO' | 'PROCESSO_EM_ANDAMENTO' | 'ATIVA' | 'INATIVA' | 'REPROVADA';
    name?: string;
    mayorName?: string;
    population?: number | string | string;
    registrationDate?: string;
    address?: string;
    zipCode?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    masterId?: string;
    master?: Master | string;
    franqueadoId?: string;
    franqueado?: Franqueado | string;
    loans?: Loan[] | LoanLegacy[];
    files?: PrefeituraFile[];
    rejectionReason?: string;
    messages?: PrefeituraMessage[];
    totalLoans?: number;
    loanCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface PrefeituraMessage {
    id: string;
    content: string;
    senderName: string;
    senderType: 'ADMIN' | 'MASTER' | 'FRANQUEADO';
    senderId: string;
    isSystemMessage?: boolean;
    prefeituraId: string;
    createdAt: string;
}

// Legacy type for backward compatibility with mock data
interface LoanLegacy {
    id: string;
    date: string;
    amount: number;
    status: string;
    loanType: string;
    type?: string;
}

export interface PrefeituraRequest {
    id: string;
    city: string;
    state: string;
    ibgeCode?: string;
    requesterType: 'MASTER' | 'FRANQUEADO';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    masterId?: string;
    master?: Master;
    franqueadoId?: string;
    franqueado?: Franqueado;
    prefeituraId?: string;
    createdAt: string;
    updatedAt: string;
}
