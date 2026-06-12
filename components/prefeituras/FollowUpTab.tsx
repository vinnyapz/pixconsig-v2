'use client';
import React, { useEffect, useState } from 'react';
import { Calendar, Plus, CheckCircle2, Circle, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FollowUp {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  done: boolean;
  createdAt: string;
}

interface FollowUpTabProps {
  prefeituraId: string;
}

function diasRestantes(dueDate: string) {
  const diff = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function FollowUpTab({ prefeituraId }: FollowUpTabProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '' });
  const [saving, setSaving] = useState(false);

  const fetchFollowUps = () => {
    setLoading(true);
    fetch(`/api/follow-ups?prefeituraId=${prefeituraId}`)
      .then(r => r.json())
      .then(data => { setFollowUps(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchFollowUps(); }, [prefeituraId]);

  const handleToggle = async (id: string, done: boolean) => {
    await fetch(`/api/follow-ups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !done }),
    });
    fetchFollowUps();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/follow-ups/${id}`, { method: 'DELETE' });
    fetchFollowUps();
  };

  const handleSave = async () => {
    if (!form.title || !form.dueDate) return;
    setSaving(true);
    await fetch('/api/follow-ups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefeituraId, ...form }),
    });
    setForm({ title: '', description: '', dueDate: '' });
    setShowForm(false);
    setSaving(false);
    fetchFollowUps();
  };

  const pendentes = followUps.filter(f => !f.done);
  const concluidos = followUps.filter(f => f.done);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Follow-ups</h4>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="h-7 text-xs gap-1 bg-[#0066A1] hover:bg-[#005580]">
          <Plus className="h-3 w-3" /> Novo
        </Button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          <input
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0066A1]"
            placeholder="Título do follow-up *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <input
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0066A1]"
            placeholder="Descrição (opcional)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <input
            type="date"
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0066A1]"
            value={form.dueDate}
            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs bg-[#0066A1] hover:bg-[#005580]">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-7 text-xs">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0066A1]" />
        </div>
      ) : followUps.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum follow-up cadastrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pendentes.map(f => {
            const dias = diasRestantes(f.dueDate);
            const atrasado = dias < 0;
            const urgente = dias >= 0 && dias <= 3;
            return (
              <div key={f.id} className={cn(
                'flex items-start gap-2 p-3 rounded-lg border transition-colors',
                atrasado ? 'bg-red-50 border-red-200' : urgente ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'
              )}>
                <button onClick={() => handleToggle(f.id, f.done)} className="mt-0.5 flex-shrink-0">
                  <Circle className={cn('h-4 w-4', atrasado ? 'text-red-400' : urgente ? 'text-yellow-500' : 'text-gray-300')} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{f.title}</p>
                  {f.description && <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>}
                  <div className="flex items-center gap-1 mt-1">
                    {atrasado ? (
                      <span className="text-xs text-red-500 font-medium flex items-center gap-0.5">
                        <AlertCircle className="h-3 w-3" /> {Math.abs(dias)}d atrasado
                      </span>
                    ) : (
                      <span className={cn('text-xs', urgente ? 'text-yellow-600 font-medium' : 'text-gray-400')}>
                        {dias === 0 ? 'Vence hoje' : `${dias}d restantes`}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDelete(f.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}

          {concluidos.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-gray-400 mb-1">Concluídos ({concluidos.length})</p>
              {concluidos.map(f => (
                <div key={f.id} className="flex items-start gap-2 p-2 rounded-lg opacity-50">
                  <button onClick={() => handleToggle(f.id, f.done)} className="mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </button>
                  <p className="text-sm text-gray-500 line-through">{f.title}</p>
                  <button onClick={() => handleDelete(f.id)} className="ml-auto text-gray-300 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
