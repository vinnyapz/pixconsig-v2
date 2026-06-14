'use client';
import React, { useEffect, useState } from 'react';
import { Building2, Clock, AlertCircle, CheckCircle2, XCircle, FileText, X, MessageSquare, Upload, Activity, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PrefeituraKanban {
  id: string;
  city: string;
  state: string;
  status: string;
  franqueado?: { name: string } | null;
  master?: { name: string } | null;
  updatedAt: string;
  createdAt: string;
  mayorName?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  messages?: { id: string; content: string; senderName: string; senderType: string; createdAt: string; isSystemMessage: boolean }[];
  files?: { id: string; name: string; uploadDate: string }[];
}

const COLUNAS = [
  { key: 'AGUARDANDO_ANALISE', label: 'Aguardando Análise', color: 'border-yellow-400', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800', icon: Clock },
  { key: 'AGUARDANDO_DECRETO', label: 'Aguardando Decreto', color: 'border-blue-400', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800', icon: FileText },
  { key: 'PROCESSO_EM_ANDAMENTO', label: 'Em Andamento', color: 'border-purple-400', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800', icon: AlertCircle },
  { key: 'ATIVA', label: 'Ativa', color: 'border-green-400', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  { key: 'INATIVA', label: 'Inativa', color: 'border-gray-400', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-700', icon: XCircle },
  { key: 'REPROVADA', label: 'Reprovada', color: 'border-red-400', bg: 'bg-red-50', badge: 'bg-red-100 text-red-800', icon: XCircle },
];

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_ANALISE: 'Aguardando Análise',
  AGUARDANDO_DECRETO: 'Aguardando Decreto',
  PROCESSO_EM_ANDAMENTO: 'Processo em Andamento',
  ATIVA: 'Ativa',
  INATIVA: 'Inativa',
  REPROVADA: 'Reprovada',
};

const STATUS_COLORS: Record<string, string> = {
  AGUARDANDO_ANALISE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  AGUARDANDO_DECRETO: 'bg-blue-100 text-blue-800 border-blue-300',
  PROCESSO_EM_ANDAMENTO: 'bg-purple-100 text-purple-800 border-purple-300',
  ATIVA: 'bg-green-100 text-green-800 border-green-300',
  INATIVA: 'bg-gray-100 text-gray-700 border-gray-300',
  REPROVADA: 'bg-red-100 text-red-800 border-red-300',
};

function diasDesdeAtualizacao(updatedAt: string) {
  const diff = Date.now() - new Date(updatedAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface TimelineItem {
  id: string;
  type: 'status' | 'message' | 'file';
  date: string;
  content: string;
  author?: string;
  isSystem?: boolean;
}

function PrefeituraModal({ prefeitura, onClose }: { prefeitura: PrefeituraKanban; onClose: () => void }) {
  const [detail, setDetail] = useState<PrefeituraKanban | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgTarget, setMsgTarget] = useState<'franqueado' | 'master' | 'ambos'>('franqueado');
  const { userType } = useAuth();
  const isAdmin = userType === 'admin' || userType === 'superadmin';

  const handleSendDirectMessage = async () => {
    if (!msgSubject.trim() || !msgBody.trim()) {
      toast.error('Preencha o assunto e a mensagem');
      return;
    }
    setSendingMsg(true);
    try {
      const res = await fetch('/api/mensagem-direta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefeituraId: prefeitura.id, subject: msgSubject, message: msgBody, target: msgTarget }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao enviar');
      }
      const data = await res.json();
      const names = data.sentTo.map((r: any) => `${r.name} (${r.role})`).join(', ');
      toast.success(`Mensagem enviada para: ${names}`);
      setShowMsgModal(false);
      setMsgSubject('');
      setMsgBody('');
      setMsgTarget('franqueado');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar mensagem');
    } finally {
      setSendingMsg(false);
    }
  };

  useEffect(() => {
    fetch(`/api/prefeituras/${prefeitura.id}`)
      .then(r => r.json())
      .then(data => { setDetail(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [prefeitura.id]);

  // Monta linha do tempo
  const timeline: TimelineItem[] = [];

  if (detail) {
    // Criação
    timeline.push({
      id: 'created',
      type: 'status',
      date: detail.createdAt,
      content: 'Prefeitura cadastrada no sistema',
      isSystem: true,
    });

    // Mensagens como eventos
    (detail.messages || []).forEach(m => {
      timeline.push({
        id: m.id,
        type: m.isSystemMessage ? 'status' : 'message',
        date: m.createdAt,
        content: m.content,
        author: m.isSystemMessage ? undefined : m.senderName,
        isSystem: m.isSystemMessage,
      });
    });

    // Arquivos
    (detail.files || []).forEach(f => {
      timeline.push({
        id: f.id,
        type: 'file',
        date: f.uploadDate,
        content: `Arquivo enviado: ${f.name}`,
      });
    });

    // Ordena por data
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-[#0066A1]" />
              <h2 className="text-lg font-bold text-gray-900">{prefeitura.city} - {prefeitura.state}</h2>
            </div>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', STATUS_COLORS[prefeitura.status])}>
              {STATUS_LABELS[prefeitura.status]}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <button
                onClick={() => setShowMsgModal(true)}
                title="Enviar mensagem direta ao responsável"
                className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Info rápida */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-2 gap-3 text-sm">
          {prefeitura.franqueado && (
            <div><span className="text-gray-400 text-xs">Franqueado</span><p className="font-medium text-gray-700">{prefeitura.franqueado.name}</p></div>
          )}
          {prefeitura.master && (
            <div><span className="text-gray-400 text-xs">Master</span><p className="font-medium text-gray-700">{prefeitura.master.name}</p></div>
          )}
          {detail?.mayorName && (
            <div><span className="text-gray-400 text-xs">Prefeito</span><p className="font-medium text-gray-700">{detail.mayorName}</p></div>
          )}
          {detail?.contactName && (
            <div><span className="text-gray-400 text-xs">Contato</span><p className="font-medium text-gray-700">{detail.contactName}</p></div>
          )}
        </div>

        {/* Linha do tempo */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-[#0066A1]" />
            <h3 className="text-sm font-semibold text-gray-700">Histórico do Trâmite</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0066A1]" />
            </div>
          ) : timeline.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum histórico encontrado</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
              <div className="space-y-4">
                {timeline.map((item, i) => (
                  <div key={item.id} className="flex gap-3 relative">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white',
                      item.type === 'status' ? 'bg-blue-100' : item.type === 'file' ? 'bg-green-100' : 'bg-purple-100'
                    )}>
                      {item.type === 'status' && <Activity className="h-3.5 w-3.5 text-blue-600" />}
                      {item.type === 'file' && <Upload className="h-3.5 w-3.5 text-green-600" />}
                      {item.type === 'message' && <MessageSquare className="h-3.5 w-3.5 text-purple-600" />}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3 min-w-0">
                      {item.author && (
                        <p className="text-xs font-semibold text-gray-600 mb-0.5">{item.author}</p>
                      )}
                      <p className="text-sm text-gray-700 break-words">{item.content}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(item.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mini modal mensagem direta */}
      {showMsgModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMsgModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base">Mensagem Direta</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Para o responsável por <strong>{prefeitura.city} - {prefeitura.state}</strong>
                </p>
              </div>
              <button onClick={() => setShowMsgModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Enviar para</label>
                <div className="flex gap-2">
                  {(['franqueado', 'master', 'ambos'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setMsgTarget(t)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        msgTarget === t
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {t === 'franqueado' ? '🏪 Franqueado' : t === 'master' ? '🏆 Master' : '👥 Ambos'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Assunto</label>
                <input
                  type="text"
                  placeholder="Ex: Pendência de documentação"
                  value={msgSubject}
                  onChange={e => setMsgSubject(e.target.value)}
                  maxLength={80}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Mensagem</label>
                <textarea
                  placeholder="Detalhe o aviso, cobrança ou instrução..."
                  value={msgBody}
                  onChange={e => setMsgBody(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowMsgModal(false)}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendDirectMessage}
                disabled={sendingMsg || !msgSubject.trim() || !msgBody.trim()}
                className="flex-1 px-4 py-2 text-sm bg-[#0066A1] text-white rounded-lg hover:bg-[#005591] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMsg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sendingMsg ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function KanbanBoard({ searchQuery = '', stateFilter = 'all' }: { searchQuery?: string; stateFilter?: string }) {
  const [prefeituras, setPrefeituras] = useState<PrefeituraKanban[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PrefeituraKanban | null>(null);

  useEffect(() => {
    fetch('/api/prefeituras?limit=500')
      .then(r => r.json())
      .then(data => {
        setPrefeituras(Array.isArray(data) ? data : data.prefeituras || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066A1]" />
      </div>
    );
  }

  return (
    <>
      {selected && <PrefeituraModal prefeitura={selected} onClose={() => setSelected(null)} />}

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {COLUNAS.map(col => {
            const Icon = col.icon;
            const itens = prefeituras.filter(p => {
              if (p.status !== col.key) return false;
              if (stateFilter !== 'all' && p.state !== stateFilter) return false;
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const cityMatch = p.city?.toLowerCase().includes(q);
                const stateMatch = p.state?.toLowerCase().includes(q);
                const franqueadoMatch = p.franqueado?.name?.toLowerCase().includes(q);
                const masterMatch = p.master?.name?.toLowerCase().includes(q);
                if (!cityMatch && !stateMatch && !franqueadoMatch && !masterMatch) return false;
              }
              return true;
            });
            return (
              <div key={col.key} className="w-64 flex-shrink-0">
                <div className={cn('rounded-t-xl px-4 py-3 border-t-4 bg-white flex items-center justify-between', col.color)}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                  </div>
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', col.badge)}>
                    {itens.length}
                  </span>
                </div>
                <div className={cn('rounded-b-xl min-h-[200px] p-2 space-y-2 border border-t-0 border-gray-200', col.bg)}>
                  {itens.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-8">Nenhuma prefeitura</p>
                  )}
                  {itens.map(p => {
                    const dias = diasDesdeAtualizacao(p.updatedAt);
                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#0066A1]/30 transition-all cursor-pointer"
                        onClick={() => setSelected(p)}
                      >
                        <div className="flex items-start gap-2">
                          <Building2 className="h-4 w-4 text-[#0066A1] mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{p.city}</p>
                            <p className="text-xs text-gray-500">{p.state}</p>
                          </div>
                        </div>
                        {(p.franqueado || p.master) && (
                          <div className="mt-2 text-xs text-gray-500 truncate">
                            {p.franqueado ? `👤 ${p.franqueado.name}` : p.master ? `👑 ${p.master.name}` : ''}
                          </div>
                        )}
                        <div className={cn('mt-2 text-xs', dias > 30 ? 'text-red-500 font-medium' : dias > 14 ? 'text-yellow-600' : 'text-gray-400')}>
                          {dias === 0 ? 'Atualizado hoje' : `${dias}d sem atualização`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
