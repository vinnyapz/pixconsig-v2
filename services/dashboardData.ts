export const loanChartData = [
    { month: 'Jan 2024', value: 3200000, servidorPublico: 2100000, contratados: 1100000 },
    { month: 'Fev 2024', value: 3450000, servidorPublico: 2250000, contratados: 1200000 },
    { month: 'Mar 2024', value: 3800000, servidorPublico: 2500000, contratados: 1300000 },
    { month: 'Abr 2024', value: 3600000, servidorPublico: 2350000, contratados: 1250000 },
    { month: 'Mai 2024', value: 4100000, servidorPublico: 2700000, contratados: 1400000 },
    { month: 'Jun 2024', value: 3900000, servidorPublico: 2550000, contratados: 1350000 },
    { month: 'Jul 2024', value: 4300000, servidorPublico: 2850000, contratados: 1450000 },
    { month: 'Ago 2024', value: 4500000, servidorPublico: 3000000, contratados: 1500000 },
    { month: 'Set 2024', value: 4200000, servidorPublico: 2800000, contratados: 1400000 },
    { month: 'Out 2024', value: 4600000, servidorPublico: 3050000, contratados: 1550000 },
    { month: 'Nov 2024', value: 4400000, servidorPublico: 2900000, contratados: 1500000 },
    { month: 'Dez 2024', value: 4250000, servidorPublico: 2800000, contratados: 1450000 }
];

export const prefeituraStats = {
    total: 210,
    active: 156,
    pending: 42,
    inactive: 12
};

export const masterPrefeituraStats = {
    total: 60,
    active: 45,
    pending: 12,
    inactive: 3
};

export const franqueadoPrefeituraStats = {
    total: 4,
    active: 3,
    pending: 1,
    inactive: 0
};

export const rankingData = {
    loanRanking: [
        { id: '1', name: 'João Silva (SP)', value: 'R$ 850.000', role: 'Master' },
        { id: '2', name: 'Maria Santos (RJ)', value: 'R$ 720.000', role: 'Master' },
        { id: '3', name: 'Pedro Oliveira (MG)', value: 'R$ 650.000', role: 'Master' },
        { id: '4', name: 'Ana Costa (RS)', value: 'R$ 580.000', role: 'Franqueado' },
        { id: '5', name: 'Carlos Souza (BA)', value: 'R$ 420.000', role: 'Franqueado' }
    ],
    cityRanking: [
        { id: '1', name: 'Maria Santos (RJ)', value: '8 prefeituras' },
        { id: '2', name: 'João Silva (SP)', value: '6 prefeituras' },
        { id: '3', name: 'Carlos Souza (BA)', value: '5 prefeituras' },
        { id: '4', name: 'Ana Costa (RS)', value: '4 prefeituras' },
        { id: '5', name: 'Pedro Oliveira (MG)', value: '3 prefeituras' }
    ]
};

export const masterPerformance = [
    { name: 'João Silva', loans: 850000, prefeituras: 12, goal: 800000, growth: 15 },
    { name: 'Maria Santos', loans: 720000, prefeituras: 9, goal: 750000, growth: 8 },
    { name: 'Pedro Oliveira', loans: 650000, prefeituras: 8, goal: 600000, growth: 12 },
    { name: 'Ana Costa', loans: 580000, prefeituras: 7, goal: 550000, growth: 5 },
    { name: 'Carlos Souza', loans: 420000, prefeituras: 5, goal: 500000, growth: -2 }
];

export const stateData = [
    { state: 'SP', loans: 12500000, servidorPublico: 8200000, contratados: 4300000, prefeituras: 45, avg: 277777, color: '#0066A1' },
    { state: 'RJ', loans: 8400000, servidorPublico: 5500000, contratados: 2900000, prefeituras: 32, avg: 262500, color: '#10B981' },
    { state: 'MG', loans: 6800000, servidorPublico: 4400000, contratados: 2400000, prefeituras: 28, avg: 242857, color: '#F59E0B' },
    { state: 'RS', loans: 5200000, servidorPublico: 3400000, contratados: 1800000, prefeituras: 22, avg: 236363, color: '#8B5CF6' },
    { state: 'BA', loans: 4100000, servidorPublico: 2700000, contratados: 1400000, prefeituras: 18, avg: 227777, color: '#EF4444' },
    { state: 'PR', loans: 3900000, servidorPublico: 2500000, contratados: 1400000, prefeituras: 16, avg: 243750, color: '#06B6D4' },
    { state: 'SC', loans: 3500000, servidorPublico: 2300000, contratados: 1200000, prefeituras: 14, avg: 250000, color: '#EC4899' },
    { state: 'PE', loans: 2800000, servidorPublico: 1850000, contratados: 950000, prefeituras: 12, avg: 233333, color: '#84CC16' }
];

export const commissionHistory = [
    { month: 'Jan', value: 384000 },
    { month: 'Fev', value: 414000 },
    { month: 'Mar', value: 456000 },
    { month: 'Abr', value: 432000 },
    { month: 'Mai', value: 492000 },
    { month: 'Jun', value: 468000 },
    { month: 'Jul', value: 516000 },
    { month: 'Ago', value: 540000 },
    { month: 'Set', value: 504000 },
    { month: 'Out', value: 552000 },
    { month: 'Nov', value: 528000 },
    { month: 'Dez', value: 510000 }
];

export const commissionData = [
    { name: 'João Silva', role: 'Master', loans: 850000, rate: 12, commission: 102000 },
    { name: 'Maria Santos', role: 'Master', loans: 720000, rate: 12, commission: 86400 },
    { name: 'Pedro Oliveira', role: 'Master', loans: 650000, rate: 12, commission: 78000 },
    { name: 'Ana Costa', role: 'Franqueado', loans: 580000, rate: 10, commission: 58000 },
    { name: 'Carlos Souza', role: 'Franqueado', loans: 420000, rate: 10, commission: 42000 }
];

export const availableStates = ['SP', 'RJ', 'MG', 'RS', 'BA', 'PR', 'SC', 'PE', 'GO', 'ES', 'MT', 'MS', 'CE', 'PA', 'AM'];

import { Prefeitura, Master, Franqueado } from '@/types';

export const prefeiturasList: Prefeitura[] = [
    {
        id: '1',
        name: 'Prefeitura Municipal de São Paulo',
        city: 'São Paulo',
        state: 'SP',
        cnpj: '46.395.000/0001-39',
        status: 'ATIVA',
        registrationDate: '2024-01-15',
        contactName: 'Maria Silva',
        contactEmail: 'maria.silva@prefeitura.sp.gov.br',
        contactPhone: '(11) 3113-9000',
        address: 'Viaduto do Chá, 15',
        zipCode: '01002-020',
        master: 'João Silva',
        franqueado: 'Carlos Mendes',
        totalLoans: 2500000,
        loanCount: 45,
        loans: [
            {
                id: '1-1',
                date: '2024-01-20',
                amount: 50000,
                status: 'pago',
                loanType: 'servidor'
            },
            {
                id: '1-2',
                date: '2024-01-25',
                amount: 75000,
                status: 'pago',
                loanType: 'contratado'
            },
            {
                id: '1-3',
                date: '2024-02-10',
                amount: 120000,
                status: 'pendente',
                loanType: 'servidor'
            }
        ]
    },
    {
        id: '2',
        name: 'Prefeitura Municipal do Rio de Janeiro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        cnpj: '42.498.600/0001-70',
        status: 'ATIVA',
        registrationDate: '2024-02-10',
        contactName: 'Pedro Santos',
        contactEmail: 'pedro.santos@rio.rj.gov.br',
        contactPhone: '(21) 2976-1000',
        address: 'Rua Afonso Cavalcanti, 455',
        zipCode: '20211-110',
        master: 'Maria Santos',
        franqueado: 'Pedro Costa',
        totalLoans: 3200000,
        loanCount: 58,
        loans: [
            {
                id: '2-1',
                date: '2024-02-15',
                amount: 100000,
                status: 'pago',
                loanType: 'servidor'
            }
        ]
    },
    {
        id: '3',
        name: 'Prefeitura Municipal de Belo Horizonte',
        city: 'Belo Horizonte',
        state: 'MG',
        cnpj: '18.715.383/0001-40',
        status: 'PENDING',
        registrationDate: '2024-03-05',
        contactName: 'Ana Costa',
        contactEmail: 'ana.costa@pbh.gov.br',
        contactPhone: '(31) 3277-4000',
        address: 'Av. Afonso Pena, 1212',
        zipCode: '30130-009',
        master: 'Pedro Oliveira',
        franqueado: 'Fernanda Souza',
        totalLoans: 0,
        loanCount: 0,
        loans: []
    },
    {
        id: '4',
        name: 'Prefeitura Municipal de Curitiba',
        city: 'Curitiba',
        state: 'PR',
        cnpj: '76.416.940/0001-28',
        status: 'ATIVA',
        registrationDate: '2024-01-20',
        contactName: 'Carlos Oliveira',
        contactEmail: 'carlos.oliveira@curitiba.pr.gov.br',
        contactPhone: '(41) 3350-8000',
        address: 'Av. Cândido de Abreu, 817',
        zipCode: '80530-908',
        master: 'João Silva',
        franqueado: 'Ana Paula',
        totalLoans: 1800000,
        loanCount: 32,
        loans: []
    },
    {
        id: '5',
        name: 'Prefeitura Municipal de Salvador',
        city: 'Salvador',
        state: 'BA',
        cnpj: '13.927.801/0001-56',
        status: 'INATIVA',
        registrationDate: '2023-11-10',
        contactName: 'Juliana Ferreira',
        contactEmail: 'juliana.ferreira@salvador.ba.gov.br',
        contactPhone: '(71) 3202-3000',
        address: 'Praça Municipal, s/n',
        zipCode: '40020-000',
        master: 'Maria Santos',
        franqueado: 'Julia Oliveira',
        totalLoans: 950000,
        loanCount: 18,
        loans: []
    }
];

export const mastersList: Master[] = [
    {
        id: '1',
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 98765-4321',
        document: '123.456.789-00',
        commissionRate: 15,
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        registrationDate: '2024-01-15',
        franqueados: [{
            id: '1-1',
            name: 'Carlos Mendes',
            citiesRegistered: 5,
            loanAmount: 450000,
            commissionRate: 10
        }, {
            id: '1-2',
            name: 'Ana Paula',
            citiesRegistered: 3,
            loanAmount: 320000,
            commissionRate: 10
        }]
    }, {
        id: '2',
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        phone: '(21) 99876-5432',
        document: '987.654.321-00',
        commissionRate: 15,
        address: 'Av. Atlântica, 456',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '22021-001',
        registrationDate: '2024-02-10',
        franqueados: [{
            id: '2-1',
            name: 'Pedro Costa',
            citiesRegistered: 8,
            loanAmount: 720000,
            commissionRate: 12
        }, {
            id: '2-2',
            name: 'Julia Oliveira',
            citiesRegistered: 4,
            loanAmount: 380000,
            commissionRate: 10
        }, {
            id: '2-3',
            name: 'Roberto Lima',
            citiesRegistered: 2,
            loanAmount: 180000,
            commissionRate: 8
        }]
    }, {
        id: '3',
        name: 'Pedro Oliveira',
        email: 'pedro.oliveira@email.com',
        phone: '(31) 97654-3210',
        document: '456.789.123-00',
        commissionRate: 15,
        address: 'Rua da Bahia, 789',
        city: 'Belo Horizonte',
        state: 'MG',
        zipCode: '30160-011',
        registrationDate: '2024-03-05',
        franqueados: [{
            id: '3-1',
            name: 'Fernanda Souza',
            citiesRegistered: 6,
            loanAmount: 650000,
            commissionRate: 11
        }]
    }
];

export const franqueadosList: Franqueado[] = [
    {
        id: '1',
        name: 'Carlos Mendes',
        email: 'carlos.mendes@email.com',
        phone: '(11) 98765-4321',
        document: '123.456.789-00',
        commissionRate: 10,
        registrationDate: '2024-01-15',
        citiesRegistered: 12,
        loanAmount: 650000,
        status: 'ATIVA',
        masterId: '1'
    }, {
        id: '2',
        name: 'Ana Paula',
        email: 'ana.paula@email.com',
        phone: '(11) 99876-5432',
        document: '987.654.321-00',
        commissionRate: 10,
        registrationDate: '2024-02-10',
        citiesRegistered: 9,
        loanAmount: 480000,
        status: 'ATIVA',
        masterId: '1'
    }, {
        id: '3',
        name: 'Roberto Silva',
        email: 'roberto@email.com',
        phone: '(11) 97654-3210',
        document: '111.222.333-44',
        commissionRate: 12,
        registrationDate: '2024-03-05',
        citiesRegistered: 7,
        loanAmount: 390000,
        status: 'ATIVA',
        masterId: '2'
    }
];
