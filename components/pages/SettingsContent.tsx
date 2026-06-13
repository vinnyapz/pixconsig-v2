"use client";
import React, { useState, useEffect } from "react";
import { Save, Bot, Users, Briefcase, Loader2, UserCog, Settings2, Target } from "lucide-react";
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
import { toast } from "sonner";

export function SettingsContent() {
  const { userType } = useAuth();
  const [activeTab, setActiveTab] = useState<"commissions" | "ai" | "users" | "goals" | "notifications">("commissions");

  // Configurações existentes
  const [settings, setSettings] = useState({
    // Comissão de Empréstimo para Servidor Público
    servidorPublicoMasterCommission: "15",
    servidorPublicoFranqueadoCommission: "10",
    // Comissão para Contratados
    contratadoMasterCommission: "12",
    contratadoFranqueadoCommission: "8",
    // AI Prompt
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
        console.error('Error fetching settings:', error);
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
      // Save AI Prompt
      const promptPromise = fetch('/api/settings/ai-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: settings.aiPrompt }),
      });

      // Save Commissions
      const commissionsPromise = fetch('/api/settings/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servidorPublicoMasterCommission: Number(settings.servidorPublicoMasterCommission),
          servidorPublicoFranqueadoCommission: Number(settings.servidorPublicoFranqueadoCommission),
          contratadoMasterCommission: Number(settings.contratadoMasterCommission),
          contratadoFranqueadoCommission: Number(settings.contratadoFranqueadoCommission),
        }),
      });

      const [promptRes, commissionsRes] = await Promise.all([promptPromise, commissionsPromise]);

      if (!promptRes.ok || !commissionsRes.ok) throw new Error('Falha ao salvar');

      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  if (!userType) return null;

  const isMaster = userType === "franqueado"; // Mantendo lógica original de tema

  // Estilos compartilhados com PrefeiturasContent para consistência
  const styles = isMaster
    ? {
      tabActive: "border-[#00D9FF] text-[#00D9FF] bg-[#00D9FF]/10",
      tabInactive: "border-transparent text-[#C0C0C0] hover:text-[#E5E4E2] hover:bg-white/5",
    }
    : {
      tabActive: "border-[#0066A1] text-[#0066A1] bg-blue-50/30",
      tabInactive: "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50",
    };

  return (
    <PageLayout
      title="Configurações"
      subtitle="Gerencie as configurações e usuários do sistema"
      containerClassName="max-w-5xl"
    >
      <div className={cn("space-y-6", isMaster && "dark")}>

        {/* Tabs Navigation */}
        <div className="rounded-xl shadow-sm border bg-card sticky top-0 z-20 overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            <Button
              variant="ghost"
              onClick={() => setActiveTab("commissions")}
              className={cn(
                "flex-1 justify-center rounded-none border-b-2 gap-2 h-auto py-4 px-6 text-sm font-medium transition-colors hover:bg-transparent min-w-[140px]",
                activeTab === "commissions" ? styles.tabActive : styles.tabInactive
              )}
            >
              <Settings2 className="h-4 w-4" />
              Comissões
            </Button>

            <Button
              variant="ghost"
              onClick={() => setActiveTab("ai")}
              className={cn(
                "flex-1 justify-center rounded-none border-b-2 gap-2 h-auto py-4 px-6 text-sm font-medium transition-colors hover:bg-transparent min-w-[140px]",
                activeTab === "ai" ? styles.tabActive : styles.tabInactive
              )}
            >
              <Bot className="h-4 w-4" />
              Inteligência Artificial
            </Button>

            {/* Apenas Admin vê usuários por enquanto, mas deixo aberto conforme solicitado */}
            <Button
              variant="ghost"
              onClick={() => setActiveTab("users")}
              className={cn(
                "flex-1 justify-center rounded-none border-b-2 gap-2 h-auto py-4 px-6 text-sm font-medium transition-colors hover:bg-transparent min-w-[140px]",
                activeTab === "users" ? styles.tabActive : styles.tabInactive
              )}
            >
              <UserCog className="h-4 w-4" />
              Usuários
            </Button>

            {userType === 'admin' || userType === 'superadmin' && (
              <Button
                variant="ghost"
                onClick={() => setActiveTab("goals")}
                className={cn(
                  "flex-1 justify-center rounded-none border-b-2 gap-2 h-auto py-4 px-6 text-sm font-medium transition-colors hover:bg-transparent min-w-[140px]",
                  activeTab === "goals" ? styles.tabActive : styles.tabInactive
                )}
              >
                <Target className="h-4 w-4" />
                Metas
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setActiveTab("notifications")}
              className={cn(
                "flex-1 justify-center rounded-none border-b-2 gap-2 h-auto py-4 px-6 text-sm font-medium transition-colors hover:bg-transparent min-w-[140px]",
                activeTab === "notifications" ? styles.tabActive : styles.tabInactive
              )}
            >
              Notificações ✨
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

          {activeTab === "commissions" && (
            <div className="space-y-6">
              {/* Comissão de Empréstimo para Servidor Público */}
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="px-6 py-4 flex items-center gap-2 border-b bg-muted/50">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">
                    Comissão de Empréstimo para Servidor Público
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Comissão dos Masters (%)</Label>
                      {loadingCommissions ? (
                        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
                      ) : (
                        <Input
                          type="number"
                          value={settings.servidorPublicoMasterCommission}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              servidorPublicoMasterCommission: e.target.value,
                            })
                          }
                          placeholder="Ex: 15"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Comissão dos Franqueados (%)</Label>
                      {loadingCommissions ? (
                        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
                      ) : (
                        <Input
                          type="number"
                          value={settings.servidorPublicoFranqueadoCommission}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              servidorPublicoFranqueadoCommission: e.target.value,
                            })
                          }
                          placeholder="Ex: 10"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comissão para Contratados */}
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="px-6 py-4 flex items-center gap-2 border-b bg-muted/50">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Comissão para Contratados</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Comissão dos Masters (%)</Label>
                      {loadingCommissions ? (
                        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
                      ) : (
                        <Input
                          type="number"
                          value={settings.contratadoMasterCommission}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              contratadoMasterCommission: e.target.value,
                            })
                          }
                          placeholder="Ex: 12"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Comissão dos Franqueados (%)</Label>
                      {loadingCommissions ? (
                        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
                      ) : (
                        <Input
                          type="number"
                          value={settings.contratadoFranqueadoCommission}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              contratadoFranqueadoCommission: e.target.value,
                            })
                          }
                          placeholder="Ex: 8"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão Salvar (Comum para configs) */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-5 w-5" />
                  )}
                  {isSaving ? "Salvando..." : "Salvar Comissões"}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-6">
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="px-6 py-4 flex items-center gap-2 border-b bg-muted/50">
                  <Bot className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">
                    Configurações da Inteligência Artificial
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label>Prompt de Instruções</Label>
                    {loadingPrompt ? (
                      <div className="h-32 w-full bg-muted animate-pulse rounded-md"></div>
                    ) : (
                      <Textarea
                        rows={10}
                        value={settings.aiPrompt}
                        onChange={(e) =>
                          setSettings({ ...settings, aiPrompt: e.target.value })
                        }
                        className="resize-none font-mono text-sm"
                        placeholder="Defina as instruções para o agente de IA..."
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      Este prompt define como a IA deve se comportar ao interagir com os usuários.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-5 w-5" />
                  )}
                  {isSaving ? "Salvando..." : "Salvar Configurações IA"}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <UsersTab />
          )}

          {activeTab === "goals" && (
            <GoalsTab />
          )}
          {activeTab === "notifications" && (
            <NotificationsTab />
          )}

        </div>
      </div>
    </PageLayout>
  );
}
