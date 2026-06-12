'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function PendingActionsAlert() {
    const { userType } = useAuth();
    const [count, setCount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/prefeituras/pending')
            .then(res => res.json())
            .then(data => setCount(data.count))
            .catch(console.error);
    }, []);

    if (count === 0) return null;

    const isMaster = userType === 'master';

    return (
        <div className={cn(
            "mb-6 p-4 rounded-lg border-l-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm",
            isMaster
                ? "bg-yellow-500/10 border-yellow-500 text-yellow-500"
                : "bg-orange-50 border-orange-400 text-orange-900"
        )}>
            <div className={cn(
                "p-2 rounded-full shrink-0",
                isMaster ? "bg-yellow-500/20" : "bg-orange-100 text-orange-600"
            )}>
                <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-sm">Ação Necessária</h3>
                <p className="text-sm mt-0.5 opacity-90">
                    Você tem <strong>{count}</strong> {count === 1 ? 'prefeitura aguardando' : 'prefeituras aguardando'} sua análise ou aprovação no workflow.
                </p>
            </div>
            <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(userType === 'admin' ? '/prefeituras/gestao?tab=pending' : '/prefeituras?tab=pending')}
                className={cn(
                    "whitespace-nowrap transition-colors",
                    isMaster
                        ? "border-yellow-500/50 hover:bg-yellow-500/20 text-yellow-500 hover:text-yellow-400"
                        : "bg-white border-orange-200 hover:bg-orange-50 text-orange-700 hover:text-orange-900 hover:border-orange-300"
                )}
            >
                Resolver Agora &rarr;
            </Button>
        </div>
    );
}
