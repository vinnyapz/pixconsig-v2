export type UserType = 'admin' | 'master' | 'franqueado';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    type: UserType;
    status: string;
}

export type Page =
    | 'dashboard'
    | 'franqueados'
    | 'vendedores'
    | 'prefeituras'
    | 'gestao-prefeituras'
    | 'academy'
    | 'settings'
    | 'reports';

// Re-export from master first (has full definitions)
export * from './master';
// Re-export from prefeitura (excludes Master and Franqueado which are defined in master.ts)
export {
    type Loan,
    type PrefeituraFile,
    type Prefeitura,
    type PrefeituraRequest
} from './prefeitura';
// Franqueado extended type
export * from './franqueado';
export * from './consignados-report';
export * from './dashboard';
export * from './notification';
