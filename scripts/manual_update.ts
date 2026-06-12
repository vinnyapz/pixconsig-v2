import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Migração Corrigida (CASE WHEN) ---');

    /* 
       A coluna status é Enum. Não podemos dar UPDATE com valores que não existem no Enum atual.
       Temos que fazer a transição no ALTER COLUMN ... USING.
    */

    try {
        // 1. Renomear Enum Antigo (se ainda existir com nome original)
        // Se já foi renomeado no script anterior, tratar erro.
        // Se a coluna já mudou de tipo, tratar erro.

        // Vamos checar/criar o novo tipo primeiro.
        await prisma.$executeRawUnsafe(`
            DO $$ BEGIN
                CREATE TYPE "PrefeituraStatus_new" AS ENUM ('AGUARDANDO_ANALISE', 'AGUARDANDO_DECRETO', 'PROCESSO_EM_ANDAMENTO', 'ATIVA', 'INATIVA', 'REPROVADA');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        console.log('Enum novo garantido.');

        // 2. Alterar a coluna usando mapeamento
        // Se der erro 'column "status" cannot be cast automatically', é pq já tentou antes mal sucedido ou tipos incompatíveis.
        // O ::text cast resolve.

        await prisma.$executeRawUnsafe(`ALTER TABLE "prefeituras" ALTER COLUMN "status" DROP DEFAULT`);

        await prisma.$executeRawUnsafe(`
            ALTER TABLE "prefeituras" 
            ALTER COLUMN "status" 
            TYPE "PrefeituraStatus_new" 
            USING (
                CASE 
                    WHEN "status"::text = 'PENDING' THEN 'AGUARDANDO_ANALISE'::"PrefeituraStatus_new"
                    WHEN "status"::text = 'ACTIVE' THEN 'ATIVA'::"PrefeituraStatus_new"
                    WHEN "status"::text = 'INACTIVE' THEN 'INATIVA'::"PrefeituraStatus_new"
                    WHEN "status"::text = 'EM_NEGOCIACAO' THEN 'PROCESSO_EM_ANDAMENTO'::"PrefeituraStatus_new"
                    WHEN "status"::text = 'DOCUMENTACAO' THEN 'PROCESSO_EM_ANDAMENTO'::"PrefeituraStatus_new"
                    -- Se já estiver convertido (caso reinicie script), manter valor se for válido no novo, ou converter
                    WHEN "status"::text = 'AGUARDANDO_ANALISE' THEN 'AGUARDANDO_ANALISE'::"PrefeituraStatus_new"
                    WHEN "status"::text = 'ATIVA' THEN 'ATIVA'::"PrefeituraStatus_new"
                    WHEN "status"::text = 'INATIVA' THEN 'INATIVA'::"PrefeituraStatus_new"
                    WHEN "status"::text = 'PROCESSO_EM_ANDAMENTO' THEN 'PROCESSO_EM_ANDAMENTO'::"PrefeituraStatus_new"
                    ELSE 'AGUARDANDO_ANALISE'::"PrefeituraStatus_new"
                END
            )
        `);
        console.log('Coluna status migrada com sucesso.');

        await prisma.$executeRawUnsafe(`ALTER TABLE "prefeituras" ALTER COLUMN "status" SET DEFAULT 'AGUARDANDO_ANALISE'`);

        // 3. Limpeza
        // Se o antigo era "PrefeituraStatus", agora ele está solto (desconectado da coluna).
        // Se o novo é "PrefeituraStatus_new", precisamos renomear... 
        // MAS espere, se o script anterior falhou no ALTER COLUMN, o tipo velho "PrefeituraStatus" AINDA É O DA COLUNA.
        // Se o script anterior renomeou o velho para _old MAS falhou ao mudar a coluna, a coluna pode estar apontando para _new ou _old?
        // Se falhou no ALTER COLUMN, nada mudou na coluna. Mas o script anterior rodou comandos soltos.

        // Vamos tentar dropar o _old e renomear o _new para o nome oficial.
        // Se o nome oficial "PrefeituraStatus" ainda estiver ocupado pelo velho, dropamos ele primeiro.
        // Mas o comando de drop type com cascade pode ser perigoso se a coluna depender dele.
        // Felizmente já mudamos a coluna para _new acima.

        await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "PrefeituraStatus" CASCADE`);
        // Agora "PrefeituraStatus" está livre. Renomear _new para ele.
        await prisma.$executeRawUnsafe(`ALTER TYPE "PrefeituraStatus_new" RENAME TO "PrefeituraStatus"`);
        console.log('Tipos limpos e renomeados.');

    } catch (e: any) {
        console.error('Erro na migração (pode ser pq já foi feita):', e.meta?.message || e.message);
    }

    console.log('Migração Corrigida Concluída.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
