"use client";
import React, { useState, useEffect } from "react";
import { Save, Bot, Users, Briefcase, Loader2, UserCog, Settings2, Target, Bell, Megaphone, Shield, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { UsersTab } from "@/components/settings/UsersTab";
import { GoalsTab } from "@/components/settings/GoalsTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { SuperAdminTab } from "@/components/settings/SuperAdminTab";
import { ComunicadosTab } from "@/components/settings/ComunicadosTab";
import { SuporteTab } from "@/components/settings/SuporteTab";
import { toast } from "sonner";

type TabId = "commissions" | "ai" | "users" | "goals" | "notifications" | "superadmin" | "comunicados" | "suporte";

const NewBadge = () => (
  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-700 border border-green-200 leading-none">novo</span>
);

export function SettingsContent() {
  const { userType } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("commissions");

  const [settings, setSettings] = useState({
    servidorPublicoMasterCommission: "15",
    servidorPublicoFranqueadoCommission: "10",
    contratadoMasterCommission: "12",
    contratadoFranqueadoCommission: "8",
    aiPrompt: "",
  });

  const [loadingCommissions, setLoadingCommissions] = useState(true);
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [promptRes, commissionsRes] = await Promise.all([
          fetch('/api/settings/ai-prompt'),
          fetch('/api/settings/commissions')
        ]);
        if (promptRes.ok) {
          const data = await promptRes.json();
          setSettings(prev => ({ ...prev, aiPrompt: data.prompt }));
        }
        if (commissionsRes.ok) {
          const data = await commissionsRes.json();
          setSettings(prev => ({
            ...prev,
            servidorPublicoMasterCommission: data.servidorPublicoMasterCommission.toString(),
            servidorPublicoFranqueadoCommission: data.servidorPublicoFranqueadoCommission.toString(),
            contratadoMasterCommission: data.contratadoMasterCommission.toString(),
            contratadoFranqueadoCommission: data.contratadoFranqueadoCommission.toString(),
          }));
        }
      } catch (error) {
        toast.error("Erro ao carregar configurações");
      } finally {
        setLoadingPrompt(false);
        setLoadingCommissions(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const [promptRes, commissionsRes] = await Promise.all([
        fetch('/api/settings/ai-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: settings.aiPrompt }),
        }),
        fetch('/api/settings/commissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            servidorPublicoMasterCommission: Number(settings.servidorPublicoMasterCommission),
            servidorPublicoFranqueadoCommission: Number(settings.servidorPublicoFranqueadoCommission),
            contratadoMasterCommission: Number(settings.contratadoMasterCommission),
            contratadoFranqueadoCommission: Number(settings.contratadoFranqueadoCommission),
          }),
        }),
      ]);
      if (!promptRes.ok || !commissionsRes.ok) throw new Error('Falha ao salvar');
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  if (!userType) return null;

  // Definição das abas
  const tabs = [
    { id: "commissions" as TabId, label: "Comissões", icon: <Settings2 className="h-4 w-4 shrink-0" />, show: true },
    { id: "ai" as TabId, label: "Inteligência Artificial", icon: <Bot className="h-4 w-4 shrink-0" />, show: true },
    { id: "users" as TabId, label: "Usuários", icon: <UserCog className="h-4 w-4 shrink-0" />, show: true },
    { id: "goals" as TabId, label: "Metas", icon: <Target className="h-4 w-4 shrink-0" />, show: userType === "admin" || userType === "superadmin" },
    { id: "comunicados" as TabId, label: "Comunicados", icon: <Megaphone className="h-4 w-4 shrink-0" />, show: userType === "admin" || userType === "superadmin" || userType === "master", isNew: true },
    { id: "suporte" as TabId, label: "Suporte", icon: <MessageCircle className="h-4 w-4 shrink-0" />, show: userType === "admin" || userType === "superadmin", isNew: true },
    { id: "notifications" as TabId, label: "Notificações", icon: <Bell className="h-4 w-4 shrink-0" />, show: true, isNew: true },
    { id: "superadmin" as TabId, label: "SuperAdmin", icon: <Shield className="h-4 w-4 shrink-0 text-yellow-600" />, show: userType === "superadmin", isNew: true, isSpecial: true },
  ].filter(t => t.show);

  // Conteúdo de cada aba
  const tabContent: Record<TabId, React.ReactNode> = {
    commissions: (
      <div className="space-y-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="px-6 py-4 flex items-center gap-2 border-b bg-muted/50">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Comissão de Empréstimo para Servidor Público</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Comissão dos Masters (%)</Label>
                {loadingCommissions ? <div className="h-10 w-full bg-muted animate-pulse rounded-md" /> : (
                  <Input type="number" value={settings.servidorPublicoMasterCommission} placeholder="Ex: 15"
                    onChange={e => setSettings({ ...settings, servidorPublicoMasterCommission: e.target.value })} />
                )}
              </div>
              <div className="space-y-2">
                <Label>Comissão dos Franqueados (%)</Label>
                {loadingCommissions ? <div className="h-10 w-full bg-muted animate-pulse rounded-md" /> : (
                  <Input type="number" value={settings.servidorPublicoFranqueadoCommission} placeholder="Ex: 10"
                    onChange={e => setSettings({ ...settings, servidorPublicoFranqueadoCommission: e.target.value })} />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="px-6 py-4 flex items-center gap-2 border-b bg-muted/50">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Comissão para Contratados</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Comissão dos Masters (%)</Label>
                {loadingCommissions ? <div className="h-10 w-full bg-muted animate-pulse rounded-md" /> : (
                  <Input type="number" value={settings.contratadoMasterCommission} placeholder="Ex: 12"
                    onChange={e => setSettings({ ...settings, contratadoMasterCommission: e.target.value })} />
                )}
              </div>
              <div className="space-y-2">
                <Label>Comissão dos Franqueados (%)</Label>
                {loadingCommissions ? <div className="h-10 w-full bg-muted animate-pulse rounded-md" /> : (
                  <Input type="number" value={settings.contratadoFranqueadoCommission} placeholder="Ex: 8"
                    onChange={e => setSettings({ ...settings, contratadoFranqueadoCommission: e.target.value })} />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto" size="lg">
            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            {isSaving ? "Salvando..." : "Salvar Comissões"}
          </Button>
        </div>
      </div>
    ),
    ai: (
      <div className="space-y-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="px-6 py-4 flex items-center gap-2 border-b bg-muted/50">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Configurações da Inteligência Artificial</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label>Prompt de Instruções</Label>
              {loadingPrompt ? <div className="h-32 w-full bg-muted animate-pulse rounded-md" /> : (
                <Textarea rows={10} value={settings.aiPrompt} className="resize-none font-mono text-sm"
                  placeholder="Defina as instruções para o agente de IA..."
                  onChange={e => setSettings({ ...settings, aiPrompt: e.target.value })} />
              )}
              <p className="text-xs text-muted-foreground">Este prompt define como a IA deve se comportar ao interagir com os usuários.</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto" size="lg">
            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            {isSaving ? "Salvando..." : "Salvar Configurações IA"}
          </Button>
        </div>
      </div>
    ),
    users: <UsersTab />,
    goals: <GoalsTab />,
    notifications: <NotificationsTab />,
    superadmin: <SuperAdminTab />,
    comunicados: <ComunicadosTab />,
    suporte: <SuporteTab />,
  };

  return (
    <PageLayout title="Configurações" subtitle="Gerencie as configurações e usuários do sistema" containerClassName="max-w-6xl">

      {/* Mobile — select dropdown */}
      <div className="lg:hidden mb-4">
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <select
            value={activeTab}
            onChange={e => setActiveTab(e.target.value as TabId)}
            className="w-full px-4 py-3 text-sm font-medium bg-transparent focus:outline-none cursor-pointer"
          >
            {tabs.map(tab => (
              <option key={tab.id} value={tab.id}>
                {tab.label}{tab.isNew ? " ✦ novo" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 mt-4">
          {tabContent[activeTab]}
        </div>
      </div>

      {/* Desktop — sidebar lateral */}
      <div className="hidden lg:flex gap-6 items-start">
        <aside className="w-56 shrink-0 sticky top-4">
          <nav className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/40">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu</p>
            </div>
            <ul className="p-2 space-y-0.5">
              {tabs.map(tab => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                      activeTab === tab.id
                        ? tab.isSpecial
                          ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                          : "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {tab.icon}
                    <span className="flex-1 truncate">{tab.label}</span>
                    {tab.isNew && <NewBadge />}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {tabContent[activeTab]}
        </div>
      </div>

    </PageLayout>
  );
}
