"use client";
import React, { useState, useEffect } from "react";
import { Send, Megaphone, Loader2, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";

interface Comunicado {
    id: string;
    title: string;
    message: string;
    target: string;
    sentAt: string;
    totalSent: number;
}

const TARGET_OPTIONS = [
    { value: 'ALL', label: '👥 Todos os usuários', color: 'bg-blue-500/15 text-blue-600' },
    { value: 'MASTER', label: '🏆 Apenas Masters', color: 'bg-purple-500/15 text-purple-600' },
    { value: 'FRANQUEADO', label: '🏪 Apenas Franqueados', color: 'bg-green-500/15 text-green-600' },
    { value: 'ADMIN', label: '🔐 Apenas Admins', color: 'bg-orange-500/15 text-orange-600' },
];

function targetLabel(target: string) {
    return TARGET_OPTIONS.find(t => t.value === target) || TARGET_OPTIONS[0];
}

export function ComunicadosTab() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState('ALL');
    const [sending, setSending] = useState(false);
    const [historico, setHistorico] = useState<Comunicado[]>([]);
    const [loadingHistorico, setLoadingHistorico] = useState(true);

    const fetchHistorico = async () => {
        try {
            const res = await fetch('/api/comunicados');
            if (res.ok) setHistorico(await res.json());
        } catch {
            console.error('Erro ao carregar histórico');
        } finally {
            setLoadingHistorico(false);
        }
    };

    useEffect(() => { fetchHistorico(); }, []);

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error('Preencha o título e a mensagem');
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/comunicados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, message, target }),
            });

            if (!res.ok) throw new Error('Erro ao enviar');

            const data = await res.json();
            toast.success(`Comunicado enviado para ${data.totalSent} usuário(s)!`);
            setTitle('');
            setMessage('');
            setTarget('ALL');
            fetchHistorico();
        } catch {
            toast.error('Erro ao enviar comunicado');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Formulário de envio */}
            <div className="rounded-xl border bg-card shadow-sm">
                <div className="px-6 py-4 flex items-center gap-2 border-b bg-muted/50">
                    <Megaphone className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Novo Comunicado</h2>
                </div>
                <div className="p-6 space-y-5">
                    {/* Destinatários */}
                    <div className="space-y-2">
                        <Label>Destinatários</Label>
                        <div className="flex flex-wrap gap-2">
                            {TARGET_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setTarget(opt.value)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                                        target === opt.value
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Título */}
                    <div className="space-y-2">
                        <Label>Título do comunicado</Label>
                        <Input
                            placeholder="Ex: Nova funcionalidade disponível!"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            maxLength={100}
                        />
                        <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
                    </div>

                    {/* Mensagem */}
                    <div className="space-y-2">
                        <Label>Mensagem</Label>
                        <Textarea
                            placeholder="Escreva aqui o conteúdo do comunicado, novidades, campanhas, avisos..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={6}
                            className="resize-none"
                        />
                    </div>

                    {/* Preview */}
                    {(title || message) && (
                        <div className="rounded-lg border border-dashed p-4 bg-muted/30 space-y-2">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pré-visualização</p>
                            {title && <p className="font-semibold text-sm">{title}</p>}
                            {message && <p className="text-sm text-muted-foreground whitespace-pre-line">{message}</p>}
                        </div>
                    )}

                    <Button
                        onClick={handleSend}
                        disabled={sending || !title.trim() || !message.trim()}
                        className="w-full gap-2"
                        size="lg"
                    >
                        {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        {sending ? 'Enviando...' : 'Enviar Comunicado'}
                    </Button>
                </div>
            </div>

            {/* Histórico */}
            <div className="rounded-xl border bg-card shadow-sm">
                <div className="px-6 py-4 flex items-center gap-2 border-b bg-muted/50">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">Histórico de Comunicados</h2>
                </div>
                <div className="p-6">
                    {loadingHistorico ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : historico.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8 text-sm">
                            Nenhum comunicado enviado ainda.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {historico.map(c => {
                                const tgt = targetLabel(c.target);
                                return (
                                    <div key={c.id} className="rounded-lg border p-4 space-y-2 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium text-sm">{c.title}</p>
                                            <Badge className={`${tgt.color} border-0 shrink-0 text-xs`}>
                                                {tgt.label}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{c.message}</p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {c.totalSent} enviado(s)
                                            </span>
                                            <span>•</span>
                                            <span>{new Date(c.sentAt).toLocaleString('pt-BR')}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
