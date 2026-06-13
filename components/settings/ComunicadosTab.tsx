"use client";
import React, { useState, useEffect } from "react";
import { Send, Megaphone, Loader2, Users, Clock, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { RichEditor } from "./RichEditor";
import { useAuth } from "@/contexts/AuthContext";

interface Comunicado {
    id: string;
    title: string;
    message: string;
    target: string;
    sentAt: string;
    totalSent: number;
}

interface Franqueado {
    id: string;
    name: string;
    state: string;
    email: string;
}

const TARGET_OPTIONS = [
    { value: 'ALL', label: '👥 Todos', color: 'bg-blue-500/15 text-blue-600' },
    { value: 'MASTER', label: '🏆 Masters', color: 'bg-purple-500/15 text-purple-600' },
    { value: 'FRANQUEADO', label: '🏪 Franqueados', color: 'bg-green-500/15 text-green-600' },
    { value: 'ADMIN', label: '🔐 Admins', color: 'bg-orange-500/15 text-orange-600' },
];

const REGIOES: Record<string, string[]> = {
    'Norte': ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'],
    'Nordeste': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
    'Centro-Oeste': ['DF', 'GO', 'MS', 'MT'],
    'Sudeste': ['ES', 'MG', 'RJ', 'SP'],
    'Sul': ['PR', 'RS', 'SC'],
};

function targetLabel(target: string) {
    return TARGET_OPTIONS.find(t => t.value === target) || TARGET_OPTIONS[0];
}

export function ComunicadosTab() {
    const { userType } = useAuth();
    const isMaster = userType === 'master';

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState(isMaster ? 'FRANQUEADO' : 'ALL');
    const [sending, setSending] = useState(false);
    const [historico, setHistorico] = useState<Comunicado[]>([]);
    const [loadingHistorico, setLoadingHistorico] = useState(true);

    // Filtros
    const [estadosDisponiveis, setEstadosDisponiveis] = useState<string[]>([]);
    const [estadosSelecionados, setEstadosSelecionados] = useState<string[]>([]);
    const [franqueadosDisponiveis, setFranqueadosDisponiveis] = useState<Franqueado[]>([]);
    const [franqueadosSelecionados, setFranqueadosSelecionados] = useState<string[]>([]);
    const [loadingFiltros, setLoadingFiltros] = useState(true);
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    const fetchFiltros = async () => {
        try {
            const res = await fetch('/api/comunicados/filtros');
            if (res.ok) {
                const data = await res.json();
                setEstadosDisponiveis(data.estados || []);
                setFranqueadosDisponiveis(data.franqueados || []);
            }
        } catch {
            console.error('Erro ao carregar filtros');
        } finally {
            setLoadingFiltros(false);
        }
    };

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

    useEffect(() => {
        fetchFiltros();
        fetchHistorico();
    }, []);

    const toggleEstado = (uf: string) => {
        setEstadosSelecionados(prev =>
            prev.includes(uf) ? prev.filter(e => e !== uf) : [...prev, uf]
        );
    };

    const toggleRegiao = (estados: string[]) => {
        const disponiveis = estados.filter(e => estadosDisponiveis.includes(e));
        const todosSelecionados = disponiveis.every(e => estadosSelecionados.includes(e));
        if (todosSelecionados) {
            setEstadosSelecionados(prev => prev.filter(e => !disponiveis.includes(e)));
        } else {
            setEstadosSelecionados(prev => [...new Set([...prev, ...disponiveis])]);
        }
    };

    const toggleFranqueado = (id: string) => {
        setFranqueadosSelecionados(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleSend = async () => {
        if (!title.trim() || !message.trim() || message === '<br>') {
            toast.error('Preencha o título e a mensagem');
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/comunicados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    message,
                    target,
                    estados: estadosSelecionados,
                    franqueadoIds: franqueadosSelecionados,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao enviar');
            }

            const data = await res.json();
            toast.success(`Comunicado enviado para ${data.totalSent} usuário(s)!`);
            setTitle('');
            setMessage('');
            setEstadosSelecionados([]);
            setFranqueadosSelecionados([]);
            setMostrarFiltros(false);
            fetchHistorico();
        } catch (e: any) {
            toast.error(e.message || 'Erro ao enviar comunicado');
        } finally {
            setSending(false);
        }
    };

    const totalFiltros = estadosSelecionados.length + franqueadosSelecionados.length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="rounded-xl border bg-card shadow-sm">
                <div className="px-6 py-4 flex items-center gap-2 border-b bg-muted/50">
                    <Megaphone className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Novo Comunicado</h2>
                </div>
                <div className="p-6 space-y-5">

                    {/* Destinatários — só Admin vê */}
                    {!isMaster && (
                        <div className="space-y-2">
                            <Label>Destinatários</Label>
                            <div className="flex flex-wrap gap-2">
                                {TARGET_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setTarget(opt.value); setEstadosSelecionados([]); }}
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
                    )}

                    {/* Botão de filtros */}
                    {(target === 'MASTER' || target === 'FRANQUEADO' || isMaster) && (
                        <div>
                            <button
                                onClick={() => setMostrarFiltros(f => !f)}
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                                <Filter className="h-4 w-4" />
                                {mostrarFiltros ? 'Ocultar filtros' : 'Filtrar destinatários'}
                                {totalFiltros > 0 && (
                                    <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5">
                                        {totalFiltros}
                                    </span>
                                )}
                            </button>

                            {mostrarFiltros && (
                                <div className="mt-3 p-4 rounded-lg border bg-muted/20 space-y-4">

                                    {/* Filtro por franqueado (só master) */}
                                    {isMaster && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Selecionar Franqueados</Label>
                                                <button
                                                    className="text-xs text-primary hover:underline"
                                                    onClick={() => setFranqueadosSelecionados(
                                                        franqueadosSelecionados.length === franqueadosDisponiveis.length
                                                            ? []
                                                            : franqueadosDisponiveis.map(f => f.id)
                                                    )}
                                                >
                                                    {franqueadosSelecionados.length === franqueadosDisponiveis.length ? 'Desmarcar todos' : 'Selecionar todos'}
                                                </button>
                                            </div>
                                            {loadingFiltros ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                                    {franqueadosDisponiveis.map(f => (
                                                        <button
                                                            key={f.id}
                                                            onClick={() => toggleFranqueado(f.id)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                                franqueadosSelecionados.includes(f.id)
                                                                    ? 'border-primary bg-primary/10 text-primary'
                                                                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                                            }`}
                                                        >
                                                            {f.name}
                                                            {f.state && <span className="ml-1 opacity-60">({f.state})</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {franqueadosSelecionados.length === 0 && (
                                                <p className="text-xs text-muted-foreground">Nenhum selecionado = envia para todos os seus franqueados</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Filtro por estado */}
                                    {estadosDisponiveis.length > 0 && (
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Filtrar por Estado</Label>

                                            {/* Botões de região */}
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {Object.entries(REGIOES).map(([regiao, ufs]) => {
                                                    const disponiveis = ufs.filter(e => estadosDisponiveis.includes(e));
                                                    if (disponiveis.length === 0) return null;
                                                    const todos = disponiveis.every(e => estadosSelecionados.includes(e));
                                                    return (
                                                        <button
                                                            key={regiao}
                                                            onClick={() => toggleRegiao(ufs)}
                                                            className={`px-2 py-1 rounded text-xs border transition-all ${
                                                                todos
                                                                    ? 'border-primary bg-primary/10 text-primary'
                                                                    : 'border-border text-muted-foreground hover:bg-muted'
                                                            }`}
                                                        >
                                                            {regiao}
                                                        </button>
                                                    );
                                                })}
                                                {estadosSelecionados.length > 0 && (
                                                    <button
                                                        onClick={() => setEstadosSelecionados([])}
                                                        className="px-2 py-1 rounded text-xs border border-red-200 text-red-500 hover:bg-red-50 flex items-center gap-1"
                                                    >
                                                        <X className="h-3 w-3" /> Limpar
                                                    </button>
                                                )}
                                            </div>

                                            {/* UFs individuais */}
                                            <div className="flex flex-wrap gap-1.5">
                                                {estadosDisponiveis.map(uf => (
                                                    <button
                                                        key={uf}
                                                        onClick={() => toggleEstado(uf)}
                                                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                                                            estadosSelecionados.includes(uf)
                                                                ? 'border-primary bg-primary/10 text-primary'
                                                                : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                                        }`}
                                                    >
                                                        {uf}
                                                    </button>
                                                ))}
                                            </div>
                                            {estadosSelecionados.length === 0 && (
                                                <p className="text-xs text-muted-foreground">Nenhum estado selecionado = envia para todos os estados</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Resumo dos filtros ativos */}
                    {(estadosSelecionados.length > 0 || franqueadosSelecionados.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <span className="text-xs text-primary font-medium w-full mb-1">Enviando para:</span>
                            {franqueadosSelecionados.map(id => {
                                const f = franqueadosDisponiveis.find(x => x.id === id);
                                return f ? (
                                    <span key={id} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                        {f.name}
                                        <button onClick={() => toggleFranqueado(id)}><X className="h-3 w-3" /></button>
                                    </span>
                                ) : null;
                            })}
                            {estadosSelecionados.map(uf => (
                                <span key={uf} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                    {uf}
                                    <button onClick={() => toggleEstado(uf)}><X className="h-3 w-3" /></button>
                                </span>
                            ))}
                        </div>
                    )}

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

                    {/* Editor rico */}
                    <div className="space-y-2">
                        <Label>Mensagem</Label>
                        <RichEditor
                            value={message}
                            onChange={setMessage}
                            placeholder="Escreva aqui o conteúdo do comunicado..."
                        />
                    </div>

                    <Button
                        onClick={handleSend}
                        disabled={sending || !title.trim() || !message.trim()}
                        className="w-full gap-2"
                        size="lg"
                    >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
                        <p className="text-center text-muted-foreground py-8 text-sm">Nenhum comunicado enviado ainda.</p>
                    ) : (
                        <div className="space-y-3">
                            {historico.map(c => {
                                const tgt = targetLabel(c.target);
                                return (
                                    <div key={c.id} className="rounded-lg border p-4 space-y-2 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium text-sm">{c.title}</p>
                                            <Badge className={`${tgt.color} border-0 shrink-0 text-xs`}>{tgt.label}</Badge>
                                        </div>
                                        <div
                                            className="text-sm text-muted-foreground line-clamp-2 [&_img]:hidden"
                                            dangerouslySetInnerHTML={{ __html: c.message }}
                                        />
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />{c.totalSent} enviado(s)
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
