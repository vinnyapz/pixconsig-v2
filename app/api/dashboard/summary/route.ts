
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { getDashboardSummary } from '@/lib/services/dashboard.service';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await getDashboardSummary(session.type, session.email);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        return NextResponse.json(
            { error: 'Erro interno ao processar dashboard' },
            { status: 500 }
        );
    }
}
