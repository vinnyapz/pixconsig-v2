'use client';
import React, { useEffect, useState } from 'react';
import { Bell, MessageSquare, Paperclip, RefreshCw, Plus, Calendar, AlertTriangle, Users, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Prefs {
  onMessage: boolean;
  onFile: boolean;
  onStatusChange: boolean;
  onNewRequest: boolean;
  onFollowUp: boolean;
  onPrefeituraAlert: boolean;
}

interface UserWithPrefs {
  id: string;
  name: string;
  email: string;
  type: string;
  preferences: Prefs | null;
}

const NOTIF_TYPES = [
  { key: 'onMessage', label: 'Novas mensagens', desc: 'Quando alguém enviar uma mensagem em uma prefeitura', icon: MessageSquare, color: 'text-blue-500' },
  { key: 'onFile', label: 'Novos arquivos', desc: 'Quando um arquivo ou documento for anexado', icon: Paperclip, color: 'text-green-500' },
  { key: 'onStatusChange', label: 'Mudança de status', desc: 'Quando o status de uma prefeitura for alterado', icon: RefreshCw, color: 'text-purple-500' },
  { key: 'onNewRequest', label: 'Novas solicitações', desc: 'Quando uma nova prefeitura for cadastrada', icon: Plus, color: 'text-orange-500' },
  { key: 'onFollowUp', label: 'Follow-ups vencendo', desc: 'Quando um follow-up estiver próximo do vencimento', icon: Calendar, color: 'text-yellow-500' },
  { key: 'onPrefeituraAlert', label: 'Alertas de inatividade', desc: 'Quando uma prefeitura ficar parada há mais de 15 dias', icon: AlertTriangle, color: 'text-red-500' },
];

const TYPE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  MASTER: 'Master',
  FRANQUEADO: 'Franqueado',
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#0066A1]' : 'bg-gray-200'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function PrefsForm({ prefs, onChange }: { prefs: Prefs; onChange: (key: string, val: boolean) => void }) {
  return (
    <div className="space-y-3">
      {NOTIF_TYPES.map(({ key, label, desc, icon: Icon, color }) => (
        <div key={key} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className={`${color}`}><Icon className="h-4 w-4" /></div>
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </div>
          <Toggle
            checked={prefs[key as keyof Prefs]}
            onChange={(v) => onChange(key, v)}
          />
        </div>
      ))}
    </div>
  );
}

export function NotificationsTab() {
  const { userType } = useAuth();
  const isAdmin = userType === 'admin' || userType === 'superadmin';

  const [myPrefs, setMyPrefs] = useState<Prefs | null>(null);
  const [users, setUsers] = useState<UserWithPrefs[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'minhas' | 'usuarios'>('minhas');

  useEffect(() => {
    fetchMyPrefs();
    if (isAdmin) fetchUsers();
  }, []);

  const fetchMyPrefs = async () => {
    const r = await fetch('/api/notification-preferences');
    const data = await r.json();
    setMyPrefs(data);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const r = await fetch('/api/notification-preferences/users');
    const data = await r.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  const handleMyPrefChange = (key: string, val: boolean) => {
    if (!myPrefs) return;
    setMyPrefs({ ...myPrefs, [key]: val });
  };

  const handleUserPrefChange = (userId: string, key: string, val: boolean) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const current = u.preferences || { onMessage: true, onFile: true, onStatusChange: true, onNewRequest: true, onFollowUp: true, onPrefeituraAlert: true };
      return { ...u, preferences: { ...current, [key]: val } };
    }));
  };

  const saveMyPrefs = async () => {
    if (!myPrefs) return;
    setSaving(true);
    await fetch('/api/notification-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(myPrefs),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveUserPrefs = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user?.preferences) return;
    await fetch('/api/notification-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...user.preferences }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066A1]" /></div>;

  const defaultPrefs: Prefs = { onMessage: true, onFile: true, onStatusChange: true, onNewRequest: true, onFollowUp: true, onPrefeituraAlert: true };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg"><Bell className="h-5 w-5 text-blue-600" /></div>
        <div>
          <h2 className="text-base font-semibold text-gray-800">Preferências de Notificação</h2>
          <p className="text-sm text-gray-500">Configure quais notificações você deseja receber</p>
        </div>
      </div>

      {/* Tabs (apenas admin vê a aba de usuários) */}
      {isAdmin && (
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('minhas')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'minhas' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
          >
            Minhas notificações
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${activeTab === 'usuarios' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
          >
            <Users className="h-3.5 w-3.5" />
            Por usuário
          </button>
        </div>
      )}

      {/* Minhas preferências */}
      {activeTab === 'minhas' && myPrefs && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <PrefsForm prefs={myPrefs} onChange={handleMyPrefChange} />
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">As alterações afetam apenas suas notificações</p>
            <button
              onClick={saveMyPrefs}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#0066A1] text-white text-sm font-medium rounded-lg hover:bg-[#005580] transition-colors disabled:opacity-50"
            >
              {saved ? <><Check className="h-4 w-4" /> Salvo!</> : saving ? 'Salvando...' : 'Salvar preferências'}
            </button>
          </div>
        </div>
      )}

      {/* Preferências por usuário (admin only) */}
      {activeTab === 'usuarios' && isAdmin && (
        <div className="space-y-3">
          {['ADMIN', 'MASTER', 'FRANQUEADO'].map(type => {
            const group = users.filter(u => u.type === type);
            if (group.length === 0) return null;
            return (
              <div key={type}>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{TYPE_LABELS[type]}s ({group.length})</p>
                <div className="space-y-2">
                  {group.map(user => (
                    <div key={user.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0066A1]/10 flex items-center justify-center text-sm font-bold text-[#0066A1]">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-800">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {Object.values(user.preferences || defaultPrefs).filter(Boolean).length} ativas
                          </span>
                          {expandedUser === user.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </div>
                      </button>

                      {expandedUser === user.id && (
                        <div className="border-t border-gray-100 p-4">
                          <PrefsForm
                            prefs={user.preferences || defaultPrefs}
                            onChange={(key, val) => handleUserPrefChange(user.id, key, val)}
                          />
                          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                            <button
                              onClick={() => saveUserPrefs(user.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-[#0066A1] text-white text-sm font-medium rounded-lg hover:bg-[#005580] transition-colors"
                            >
                              <Check className="h-4 w-4" /> Salvar para {user.name.split(' ')[0]}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
