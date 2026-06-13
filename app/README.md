# PixConsig v2 — Sistema de Gestão de Franqueados

Plataforma de gestão para franqueados que captam prefeituras para convênios de consignado via cartão benefício.

## 🛠️ Stack
- **Next.js 16** (App Router) + **TypeScript**
- **PostgreSQL** + **Prisma ORM**
- **Tailwind CSS v4** + **Shadcn/UI**
- **JWT** para autenticação

## 👥 Perfis de Acesso
| Perfil | Acesso |
|---|---|
| **Admin** | Total — aprova prefeituras, configura comissões, gerencia masters |
| **Master** | Regional — gerencia franqueados, acompanha produção, valida empréstimos |
| **Franqueado** | Operacional — capta prefeituras, registra empréstimos |

## ✨ Novidades v2
- 📋 **Kanban de Prefeituras** — funil visual por etapa do processo
- 🎯 **Metas mensais** — por franqueado e master, com progresso visual
- 📅 **Follow-ups** — lembretes de próximas ações por prefeitura
- 💰 **Extrato de comissões** — detalhado por prefeitura e empréstimo
- 📊 **Exportação** — relatórios em PDF e Excel

## ⚙️ Como rodar localmente

```bash
# 1. Copie o .env.example e preencha
cp .env.example .env

# 2. Instale as dependências
npm install

# 3. Aplique o schema no banco
npx prisma db push

# 4. Popule dados iniciais (admin padrão)
npm run prisma:seed

# 5. Inicie o servidor
npm run dev
```

Acesse: `http://localhost:3000`

## 🚀 Deploy no EasyPanel

1. No EasyPanel, crie um novo **Project** → **App** → fonte: **GitHub**
2. Aponte para este repositório (`pixconsig-v2`)
3. EasyPanel detecta o `Dockerfile` automaticamente
4. Configure as variáveis de ambiente (copie do `.env.example`)
5. Clique em **Deploy**

## 📁 Estrutura
```
app/          → Rotas Next.js (App Router)
components/   → Componentes React
├── dashboards/   → Dashboards por perfil
├── pages/        → Conteúdo das páginas
├── layout/       → TopBar, PageLayout
└── ui/           → Componentes base (Shadcn)
hooks/        → Hooks customizados
lib/          → Utilitários, auth, prisma
prisma/       → Schema e migrations
types/        → Tipos TypeScript
```
