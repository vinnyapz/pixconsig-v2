
'use client';

import React, { useState, useEffect } from 'react';
import { Target, Save, Loader2, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { GoalSettingItem } from '@/types/dashboard';

export function GoalsTab() {
    const [goals, setGoals] = useState<GoalSettingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const res = await fetch('/api/settings/goals');
            if (res.ok) {
                const data = await res.json();
                setGoals(data.goals);
            }
        } catch (error) {
            console.error('Error fetching goals:', error);
            toast.error('Erro ao carregar metas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveGoal = async (item: GoalSettingItem) => {
        setSavingId(item.entityId);
        try {
            const res = await fetch('/api/settings/goals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entityId: item.entityId,
                    entityType: item.entityType,
                    goalPrefeituras: item.goalPrefeituras
                })
            });
            if (!res.ok) throw new Error('Falha ao salvar');
            toast.success(`Meta de ${item.entityName} atualizada!`);
        } catch (error) {
            console.error('Error saving goal:', error);
            toast.error('Erro ao salvar meta');
        } finally {
            setSavingId(null);
        }
    };

    const updateGoal = (entityId: string, value: number) => {
        setGoals(prev => prev.map(g =>
            g.entityId === entityId ? { ...g, goalPrefeituras: value } : g
        ));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const masterGoals = goals.filter(g => g.entityType === 'master');
    const franqueadoGoals = goals.filter(g => g.entityType === 'franqueado');

    // Renderiza uma seção de tabela (Masters ou Franqueados)
    const renderSection = (
        title: string,
        icon: React.ReactNode,
        items: GoalSettingItem[]
    ) => (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="px-6 py-4 flex items-center gap-2 border-b bg-muted/50">
                {icon}
                <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <div className="divide-y">
                {items.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                        Nenhum registro encontrado.
                    </div>
                ) : (
                    items.map(item => (
                        <div key={item.entityId} className="p-4 flex items-center gap-4">
                            <div className="flex-1">
                                <p className="font-medium">{item.entityName}</p>
                                <p className="text-sm text-muted-foreground">
                                    Prefeituras atuais: {item.currentPrefeituras}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-sm text-muted-foreground whitespace-nowrap">
                                    Meta:
                                </div>
                                <Input
                                    type="number"
                                    value={item.goalPrefeituras}
                                    onChange={(e) => updateGoal(
                                        item.entityId,
                                        parseInt(e.target.value) || 0
                                    )}
                                    className="w-24"
                                    min={1}
                                />
                                <Button
                                    size="sm"
                                    onClick={() => handleSaveGoal(item)}
                                    disabled={savingId === item.entityId}
                                >
                                    {savingId === item.entityId ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {renderSection(
                'Metas de Masters',
                <Users className="h-5 w-5 text-primary" />,
                masterGoals
            )}
            {renderSection(
                'Metas de Franqueados',
                <Briefcase className="h-5 w-5 text-primary" />,
                franqueadoGoals
            )}
        </div>
    );
}
