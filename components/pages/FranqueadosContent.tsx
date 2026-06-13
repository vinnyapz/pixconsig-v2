"use client";
import React, { useMemo, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { Settings, Plus, Users, Search, TrendingUp, DollarSign, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Franqueado } from "@/types";
import { formatCurrency, cn, formatPhone, formatDocument, formatCEP } from "@/lib/utils";
import { PageLayout } from "@/components/layout/PageLayout";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Modal } from "@/components/common/Modal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export function FranqueadosContent() {
  const { userType, user } = useAuth();
  const effectiveType = (userType === 'superadmin' ? 'admin' : userType) || 'admin';
  const isMaster = userType === "master";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", document: "", commissionRate: "10",
    address: "", city: "", state: "", zipCode: "", sendEmail: true,
  });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ userId: "", newPassword: "", confirmPassword: "" });
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [franqueados, setFranqueados] = useState<Franqueado[]>([]);
  const [selectedFranqueado, setSelectedFranqueado] = useState<Franqueado | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<Franqueado | null>(null);

  const fetchFranqueados = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const response = await fetch(`/api/franqueados?masterId=${user.id}`);
      if (!response.ok) throw new Error("Falha ao buscar franqueados");
      const data = await response.json();
      setFranqueados(data);
    } catch (error) {
      console.error("Error fetching franqueados:", error);
      toast.error("Erro ao carregar lista de franqueados");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => { fetchFranqueados(); }, [user?.id]);

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.document) {
      toast.error("Por favor, preencha os campos obrigatórios (*)");
      return;
    }
    if (!user?.id) { toast.error("Erro de autenticação"); return; }
    try {
      setIsLoading(true);
      const response = await fetch("/api/franqueados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, masterId: user.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao cadastrar franqueado");
      await fetchFranqueados();
      if (data.generatedPassword) {
        setGeneratedPassword(data.generatedPassword);
      } else {
        toast.success("Franqueado cadastrado com sucesso!");
      }
      setIsModalOpen(false);
      setFormData({ name: "", email: "", phone: "", document: "", commissionRate: "10", address: "", city: "", state: "", zipCode: "", sendEmail: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao cadastrar");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) { toast.error("As senhas não coincidem"); return; }
    if (passwordData.newPassword.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
    try {
      setIsLoading(true);
      const response = await fetch("/api/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedFranqueado?.id, email: selectedFranqueado?.email, newPassword: passwordData.newPassword }),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Erro ao alterar senha"); }
      toast.success("Senha alterada com sucesso!");
      setIsPasswordModalOpen(false);
      setPasswordData({ userId: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error("Erro ao alterar senha");
    } finally {
      setIsLoading(false);
    }
  };

  const styles = isMaster ? {
    container: "bg-gradient-to-br from-[#36454F] to-[#1c1c1e] border-[#4A5568]/50 shadow-lg shadow-[#00D9FF]/10",
    header: "bg-gradient-to-r from-[#36454F] to-[#4A5568] border-b border-[#4A5568]/30",
    headerText: "text-[#C0C0C0]", row: "border-[#4A5568]/20 hover:bg-white/5", rowSelected: "bg-[#00D9FF]/10",
    text: "text-[#E5E4E2]", subtext: "text-[#C0C0C0]", iconBg: "bg-[#00D9FF]/10 text-[#00D9FF] group-hover:bg-[#00D9FF]/20",
    buttonEdit: "text-gray-400 hover:text-[#00D9FF] hover:bg-[#00D9FF]/10",
    input: "bg-[#1c1c1e] border-[#4A5568]/50 text-[#E5E4E2] focus-visible:ring-[#00D9FF] placeholder:text-gray-500",
    buttonPrimary: "bg-[#00D9FF] text-[#1c1c1e] hover:bg-[#00A8CC]",
  } : {
    container: "bg-white border-gray-200 shadow-sm", header: "bg-gray-50/50", headerText: "text-gray-500",
    row: "hover:bg-gray-50/80", rowSelected: "bg-blue-50", text: "text-gray-900", subtext: "text-gray-500",
    iconBg: "bg-blue-50 text-blue-600 group-hover:bg-blue-100", buttonEdit: "text-gray-400 hover:text-[#0066A1] hover:bg-blue-50",
    input: "bg-white border-gray-300 text-gray-900 focus-visible:ring-[#0066A1]",
    buttonPrimary: "bg-[#0066A1] text-white hover:bg-[#005585]",
  };

  const handleToggleStatus = (franqueado: Franqueado) => setUserToToggleStatus(franqueado);

  const confirmStatusChange = async () => {
    if (!userToToggleStatus) return;
    const currentStatus = userToToggleStatus.status === "active" ? "ACTIVE" : "INACTIVE";
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const response = await fetch("/api/users/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userToToggleStatus.email, status: newStatus })
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Erro ao atualizar status"); }
      toast.success(`Acesso ${newStatus === "ACTIVE" ? "ativado" : "desativado"} com sucesso!`);
      await fetchFranqueados();
      setUserToToggleStatus(null);
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const filteredFranqueados = useMemo(() => {
    let filtered = franqueados;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => f.name.toLowerCase().includes(query) || f.email.toLowerCase().includes(query));
    }
    if (statusFilter !== "all") filtered = filtered.filter(f => f.status === statusFilter);
    return filtered;
  }, [searchQuery, statusFilter, franqueados]);

  if (!userType) return null;

  return (
    <PageLayout title="Franqueados" subtitle="Gerencie os franqueados da sua franquia">
      <div className={cn(isMaster && "dark")}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard title="Total" value={franqueados.length} icon={<Users className="h-6 w-6" />} description="cadastrados" userType={effectiveType} />
          <StatCard title="Ativos" value={franqueados.filter(f => f.status === "active").length} icon={<TrendingUp className="h-6 w-6" />} description="na equipe" userType={effectiveType} />
          <StatCard title="Consignados" value={formatCurrency(franqueados.reduce((acc, f) => acc + (f.loanAmount ?? 0), 0))} icon={<DollarSign className="h-6 w-6" />} description="total" userType={effectiveType} />
          <StatCard title="Prefeituras" value={franqueados.reduce((acc, f) => acc + (f.citiesRegistered ?? 0), 0)} icon={<Building2 className="h-6 w-6" />} description="cadastradas" userType={effectiveType} />
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Input placeholder="Pesquisar por nome ou email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={cn("w-full pl-10", styles.input)} />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className={cn("flex items-center gap-2", styles.buttonPrimary)}>
            <Plus className="h-5 w-5" /><span>Novo Franqueado</span>
          </Button>
        </div>

        <div className={`rounded-xl border overflow-hidden ${styles.container}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className={styles.header}>
                <tr>
                  {["Nome", "Email", "Consignados", "Comissão", "Status", "Ações"].map(h => (
                    <th key={h} className={`px-6 py-3 font-medium uppercase ${styles.headerText}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFranqueados.map(f => (
                  <tr key={f.id} className={`transition-colors ${styles.row}`}>
                    <td className="px-6 py-4"><div className={`font-medium ${styles.text}`}>{f.name}</div><div className={`text-xs ${styles.subtext}`}>{f.document}</div></td>
                    <td className={`px-6 py-4 ${styles.subtext}`}>{f.email}</td>
                    <td className={`px-6 py-4 font-semibold ${styles.text}`}>{formatCurrency(f.loanAmount ?? 0)}</td>
                    <td className={`px-6 py-4 font-semibold ${styles.text}`}>
                      <div className="flex flex-col">
                        <span>{formatCurrency((f.loanAmount ?? 0) * (f.commissionRate / 100))}</span>
                        <span className={`text-xs ${styles.subtext}`}>{f.commissionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={f.status ?? "inactive"} variant={isMaster ? "modern" : "default"} /></td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className={styles.buttonEdit}><Settings className="h-5 w-5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => { setSelectedFranqueado(f); setFormData({ name: f.name, email: f.email, phone: f.phone, document: f.document || "", commissionRate: f.commissionRate.toString(), address: f.address || "", city: f.city || "", state: f.state || "", zipCode: f.zipCode || "", sendEmail: false }); setIsModalOpen(true); }}>Editar Dados</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedFranqueado(f); setIsPasswordModalOpen(true); }}>Alterar Senha</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className={f.status === "active" ? "text-red-600" : "text-green-600"} onClick={() => handleToggleStatus(f)}>
                            {f.status === "active" ? "Desativar Acesso" : "Ativar Acesso"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Franqueado" variant={isMaster ? "dark" : "default"} maxWidth="md">
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome Completo *</Label><Input placeholder="Ex: Carlos Mendes" className="bg-background" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" placeholder="Ex: carlos@email.com" className="bg-background" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Telefone *</Label><Input placeholder="Ex: (11) 99999-9999" className="bg-background" value={formData.phone} onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Documento (CPF/CNPJ) *</Label><Input placeholder="Ex: 000.000.000-00" className="bg-background" value={formData.document} onChange={e => setFormData({ ...formData, document: formatDocument(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Comissão (%)</Label><Input type="number" placeholder="Ex: 10" className="bg-background" value={formData.commissionRate} onChange={e => setFormData({ ...formData, commissionRate: e.target.value })} /></div>
              <div className="space-y-2"><Label>CEP</Label><Input placeholder="Ex: 00000-000" className="bg-background" value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: formatCEP(e.target.value) })} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Endereço</Label><Input placeholder="Ex: Av. Paulista, 1000" className="bg-background" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
              <div className="space-y-2"><Label>Cidade</Label><Input placeholder="Ex: São Paulo" className="bg-background" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} /></div>
              <div className="space-y-2"><Label>Estado</Label><Input placeholder="Ex: SP" maxLength={2} className="bg-background" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })} /></div>
              <div className="md:col-span-2 flex items-center space-x-2 pt-2">
                <Checkbox id="sendEmail" checked={formData.sendEmail} onCheckedChange={checked => setFormData({ ...formData, sendEmail: checked as boolean })} />
                <label htmlFor="sendEmail" className="text-sm font-medium leading-none">Enviar email com as credenciais de acesso</label>
              </div>
            </div>
            <Button className="w-full mt-6" onClick={handleRegister} disabled={isLoading}>{isLoading ? "Salvando..." : "Confirmar"}</Button>
          </div>
        </Modal>

        <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Alterar Senha" variant={isMaster ? "dark" : "default"} maxWidth="sm">
          <div className="space-y-4 pt-4">
            <div className="space-y-2"><Label>Nova Senha</Label><Input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} /></div>
            <div className="space-y-2"><Label>Confirmar Senha</Label><Input type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} /></div>
            <Button className="w-full mt-4" onClick={handlePasswordChange} disabled={isLoading}>{isLoading ? "Alterando..." : "Alterar Senha"}</Button>
          </div>
        </Modal>

        <Dialog open={!!generatedPassword} onOpenChange={() => setGeneratedPassword(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Acesso Criado com Sucesso</DialogTitle>
              <DialogDescription>Como a opção de envio de email não foi selecionada, copie a senha abaixo e envie para o franqueado manualmente.</DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-muted rounded-md text-center">
              <p className="text-sm text-gray-500 mb-1">Senha Provisória:</p>
              <p className="text-xl font-bold tracking-wider select-all">{generatedPassword}</p>
            </div>
            <DialogFooter><Button onClick={() => setGeneratedPassword(null)}>Fechar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          isOpen={!!userToToggleStatus}
          onClose={() => setUserToToggleStatus(null)}
          onConfirm={confirmStatusChange}
          title={userToToggleStatus?.status === "active" ? "Desativar Acesso" : "Ativar Acesso"}
          description={userToToggleStatus?.status === "active" ? `Tem certeza que deseja desativar o acesso de ${userToToggleStatus?.name}?` : `Tem certeza que deseja ativar o acesso de ${userToToggleStatus?.name}?`}
          confirmText={userToToggleStatus?.status === "active" ? "Desativar" : "Ativar"}
          variant={userToToggleStatus?.status === "active" ? "destructive" : "default"}
          theme={isMaster ? "dark" : "default"}
        />
      </div>
    </PageLayout>
  );
}