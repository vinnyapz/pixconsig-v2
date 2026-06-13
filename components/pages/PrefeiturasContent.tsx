"use client";
import React, { useMemo, useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import {
  Building2,
  DollarSign,
  Plus,
  Search,
  Users,
  FileInput,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Loan, Prefeitura } from "@/types/prefeitura";

import { PrefeituraList } from "@/components/prefeituras/PrefeituraList";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { PrefeituraDetails } from "@/components/prefeituras/PrefeituraDetails";
import { PrefeituraForm } from "@/components/prefeituras/PrefeituraForm";
import { ConsignadoForm } from "@/components/prefeituras/ConsignadoForm";

import { formatCurrency, cn } from "@/lib/utils";
import { PageLayout } from "@/components/layout/PageLayout";
import { ConsolidatedPrefeiturasCard } from "@/components/ConsolidatedPrefeiturasCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

import { BRAZILIAN_STATES } from "@/lib/constants";

export function PrefeiturasContent() {
  const { userType } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("prefeituras");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // API state
  const [prefeituras, setPrefeituras] = useState<Prefeitura[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Details Drawer State
  const [selectedPrefeitura, setSelectedPrefeitura] =
    useState<Prefeitura | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Form Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPrefeitura, setEditingPrefeitura] = useState<Prefeitura | null>(
    null,
  );
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  useEffect(() => {
    fetchPrefeituras();
  }, []);

  const fetchPrefeituras = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/prefeituras");
      if (!response.ok) throw new Error("Falha ao carregar prefeituras");
      const data = await response.json();
      setPrefeituras(data);

      // Atualiza selectedPrefeitura com dados frescos do servidor
      setSelectedPrefeitura((prev) => {
        if (!prev) return null;
        const updated = data.find((p: Prefeitura) => p.id === prev.id);
        return updated || null;
      });
    } catch (error) {
      console.error("Error fetching prefeituras:", error);
    } finally {
      setIsLoading(false);
    }
  };


  // Calculate statistics
  const stats = useMemo(() => {
    const total = prefeituras.filter(
      (p) => p.status !== "AGUARDANDO_ANALISE"
    ).length;
    const active = prefeituras.filter(
      (p) => p.status === "ATIVA",
    ).length;
    // "pending" = itens que exigem ação do usuário logado
    const pending = prefeituras.filter((p) => {
      if (userType === 'admin') return p.status === 'AGUARDANDO_ANALISE' || p.status === 'PROCESSO_EM_ANDAMENTO';
      if (userType === 'franqueado' || userType === 'master') return p.status === 'AGUARDANDO_DECRETO';
      return false;
    }).length;
    const inactive = prefeituras.filter(
      (p) => p.status === "INATIVA",
    ).length;
    const totalLoans = prefeituras.reduce(
      (sum, p) => sum + (p.loans?.reduce((lsum, l) => lsum + l.amount, 0) || 0),
      0,
    );

    const totalPaidLoans = prefeituras.reduce(
      (sum, p) =>
        sum +
        (p.loans
          ?.filter((l) => l.status === "PAID")
          .reduce((lsum, l) => lsum + l.amount, 0) || 0),
      0,
    );

    const totalPendingLoans = prefeituras.reduce(
      (sum, p) =>
        sum +
        (p.loans
          ?.filter((l) => l.status === "PENDING")
          .reduce((lsum, l) => lsum + l.amount, 0) || 0),
      0,
    );

    return {
      total,
      active,
      pending,
      inactive,
      totalLoans,
      totalPaidLoans,
      totalPendingLoans,
      totalFranqueadoCommission: prefeituras.reduce((sum, p) => {
        const paidLoans = p.loans?.filter(l => l.status === "PAID").reduce((lsum, l) => lsum + l.amount, 0) || 0;
        const rate = typeof p.franqueado === 'object' && p.franqueado ? p.franqueado.commissionRate : 0;
        return sum + (paidLoans * (rate / 100));
      }, 0),
      totalMasterCommission: prefeituras.reduce((sum, p) => {
        const paidLoans = p.loans?.filter(l => l.status === "PAID").reduce((lsum, l) => lsum + l.amount, 0) || 0;
        const rate = typeof p.master === 'object' && p.master ? p.master.commissionRate : 0;
        return sum + (paidLoans * (rate / 100));
      }, 0),
      totalFranqueadoPendingCommission: prefeituras.reduce((sum, p) => {
        const pendingLoans = p.loans?.filter(l => l.status === "PENDING").reduce((lsum, l) => lsum + l.amount, 0) || 0;
        const rate = typeof p.franqueado === 'object' && p.franqueado ? p.franqueado.commissionRate : 0;
        return sum + (pendingLoans * (rate / 100));
      }, 0),
      totalMasterPendingCommission: prefeituras.reduce((sum, p) => {
        const pendingLoans = p.loans?.filter(l => l.status === "PENDING").reduce((lsum, l) => lsum + l.amount, 0) || 0;
        const rate = typeof p.master === 'object' && p.master ? p.master.commissionRate : 0;
        return sum + (pendingLoans * (rate / 100));
      }, 0)
    };
  }, [prefeituras]);

  // Filter prefeituras
  const filteredPrefeituras = useMemo(() => {
    let filtered = prefeituras;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.city.toLowerCase().includes(query) ||
          p.state.toLowerCase().includes(query) ||
          p.cnpj?.includes(query),
      );
    }

    if (activeTab !== "all") {
      const tabStatuses: Record<string, string[]> = {
        prefeituras: ["ATIVA", "INATIVA"],
        pending: ["AGUARDANDO_ANALISE", "AGUARDANDO_DECRETO", "PROCESSO_EM_ANDAMENTO", "REPROVADA"],
      };

      const allowed = tabStatuses[activeTab];
      if (allowed) {
        filtered = filtered.filter((p) => allowed.includes(p.status));
      }
    }

    if (stateFilter !== "all") {
      filtered = filtered.filter((p) => p.state === stateFilter);
    }

    if (statusFilter !== "all") {
      if (statusFilter === "ACTIVE") {
        filtered = filtered.filter((p) => p.status === "ATIVA" || p.status === "PROCESSO_EM_ANDAMENTO");
      } else if (statusFilter === "INACTIVE") {
        filtered = filtered.filter((p) => p.status === "INATIVA" || p.status === "REPROVADA");
      } else if (statusFilter === "PENDING") {
        filtered = filtered.filter((p) => ["AGUARDANDO_ANALISE", "AGUARDANDO_DECRETO"].includes(p.status));
      } else {
        filtered = filtered.filter((p) => p.status === statusFilter);
      }
    }

    // Sort pending actions to top
    return filtered.sort((a, b) => {
      // Determine if 'a' needs action
      const aNeedAction = (userType === 'admin' && (a.status === 'AGUARDANDO_ANALISE' || a.status === 'PROCESSO_EM_ANDAMENTO')) ||
        ((userType === 'franqueado' || userType === 'master') && a.status === 'AGUARDANDO_DECRETO');

      // Determine if 'b' needs action
      const bNeedAction = (userType === 'admin' && (b.status === 'AGUARDANDO_ANALISE' || b.status === 'PROCESSO_EM_ANDAMENTO')) ||
        ((userType === 'franqueado' || userType === 'master') && b.status === 'AGUARDANDO_DECRETO');

      if (aNeedAction && !bNeedAction) return -1;
      if (!aNeedAction && bNeedAction) return 1;

      // Secondary sort: createdAt desc (newest first)
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [searchQuery, activeTab, stateFilter, statusFilter, prefeituras, userType]);

  // Get unique states for filter
  const states = useMemo(() => {
    return Array.from(new Set(prefeituras.map((p) => p.state))).sort();
  }, [prefeituras]);

  // Compute duplicates map for UI alerts
  const duplicatesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    // Incluir AGUARDANDO_ANALISE para detectar duplicidade entre solicitações pendentes também
    const checkStatuses = ["AGUARDANDO_DECRETO", "PROCESSO_EM_ANDAMENTO", "ATIVA", "AGUARDANDO_ANALISE"];

    // Filter only those that need alert (AGUARDANDO_ANALISE)
    const pendingAnalise = prefeituras.filter(p => p.status === 'AGUARDANDO_ANALISE');

    pendingAnalise.forEach(p => {
      // Find matches in global list
      const matches = prefeituras.filter(other =>
        other.id !== p.id &&
        checkStatuses.includes(other.status) &&
        (
          (other.cnpj && p.cnpj && other.cnpj === p.cnpj) ||
          (other.city.toLowerCase() === p.city.toLowerCase() && other.state === p.state)
        )
      );

      if (matches.length > 0) {
        map[p.id] = matches.map(m => `${m.city} (${m.status})`);
      }
    });

    return map;
  }, [prefeituras]);

  // IDs de prefeituras que exigem ação do usuário logado
  const myActionIds = useMemo(() => {
    const ids = new Set<string>();
    prefeituras.forEach(p => {
      if (userType === 'admin' && (p.status === 'AGUARDANDO_ANALISE' || p.status === 'PROCESSO_EM_ANDAMENTO')) {
        ids.add(p.id);
      }
      if ((userType === 'franqueado' || userType === 'master') && p.status === 'AGUARDANDO_DECRETO') {
        ids.add(p.id);
      }
    });
    return ids;
  }, [prefeituras, userType]);

  const handleManage = (prefeitura: Prefeitura) => {
    setSelectedPrefeitura(prefeitura);
    setIsDetailsOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDetailsOpen(false);
    setSelectedPrefeitura(null);
  };

  const handleOpenFormForCreate = () => {
    setEditingPrefeitura(null);
    setIsFormModalOpen(true);
  };

  const handleOpenFormForEdit = (prefeitura: Prefeitura) => {
    setEditingPrefeitura(prefeitura);
    setIsFormModalOpen(true);
    setIsDetailsOpen(false);
  };

  const handleCloseForm = () => {
    setIsFormModalOpen(false);
    setEditingPrefeitura(null);
  };

  const handleSubmit = async (data: Partial<Prefeitura>): Promise<void> => {
    if (editingPrefeitura) {
      // Update
      const response = await fetch(`/api/prefeituras/${editingPrefeitura.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Falha ao atualizar prefeitura");
        throw new Error(errorData.error || "Falha ao atualizar prefeitura");
      }
      toast.success("Prefeitura atualizada com sucesso!");
    } else {
      // Create (Unified flow)
      const response = await fetch("/api/prefeituras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Falha ao criar prefeitura");
        throw new Error(errorData.error || "Falha ao criar prefeitura");
      }
      const successMessage = "Prefeitura cadastrada com sucesso!";
      toast.success(successMessage);
    }

    await refreshData();
    handleCloseForm();
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/prefeituras/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Falha ao excluir prefeitura");

      await fetchPrefeituras();
      setIsDetailsOpen(false);
      setSelectedPrefeitura(null);
    } catch (error) {
      console.error("Error deleting prefeitura:", error);
      toast.error("Erro ao excluir prefeitura");
    }
  };

  const refreshData = async () => {
    const res = await fetch("/api/prefeituras");
    if (res.ok) {
      const data = await res.json();
      setPrefeituras(data);

      if (selectedPrefeitura) {
        const updated = data.find((p: any) => p.id === selectedPrefeitura.id);
        if (updated) setSelectedPrefeitura(updated);
      }
    }
  };

  const handleEditLoan = (loan: Loan) => {
    setEditingLoan(loan);
    setIsLoanModalOpen(true);
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (!confirm("Tem certeza que deseja excluir este consignado?")) return;

    try {
      const response = await fetch(`/api/consignados/${loanId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Falha ao excluir consignado");

      await refreshData();
    } catch (error) {
      console.error("Error deleting loan:", error);
      toast.error("Erro ao excluir consignado");
    }
  };

  const handleSaveLoan = async (loanData: any) => {
    try {
      const isEdit = !!loanData.id;
      const url = isEdit
        ? `/api/consignados/${loanData.id}`
        : "/api/consignados";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loanData),
      });

      if (!response.ok)
        throw new Error(
          `Falha ao ${isEdit ? "atualizar" : "criar"} consignado`,
        );

      await refreshData();
      setIsLoanModalOpen(false);
      setEditingLoan(null);
    } catch (error) {
      console.error("Error saving loan:", error);
      toast.error(`Erro ao ${loanData.id ? "atualizar" : "criar"} consignado`);
    }
  };

  if (!userType) return null;

  const isMaster = userType === "master";

  const styles = isMaster
    ? {
      card: "bg-gradient-to-br from-[#36454F] to-[#1c1c1e] text-[#E5E4E2] border-[#4A5568]/50 shadow-lg shadow-[#00D9FF]/10",
      cardHover: "hover:shadow-[#00D9FF]/20",
      statsIconBg: "bg-[#00D9FF]/10 text-[#00D9FF]",
      textPrimary: "text-[#E5E4E2]",
      textSecondary: "text-[#C0C0C0]",
      footer:
        "bg-gradient-to-r from-[#36454F] to-[#4A5568] border-t border-[#4A5568]/30",
      input:
        "bg-[#1c1c1e] border-[#4A5568]/50 text-[#E5E4E2] focus-visible:ring-[#00D9FF] placeholder:text-gray-500",
      buttonPrimary: "bg-[#00D9FF] text-[#1c1c1e] hover:bg-[#00A8CC]",
      buttonText: "text-[#00D9FF] hover:text-[#00A8CC] hover:bg-[#00D9FF]/10",
      select:
        "bg-[#1c1c1e] border-[#4A5568]/50 text-[#E5E4E2] focus-visible:ring-[#00D9FF]",
      tabActive: "border-[#00D9FF] text-[#00D9FF] bg-[#00D9FF]/10",
      tabInactive:
        "border-transparent text-[#C0C0C0] hover:text-[#E5E4E2] hover:bg-white/5",
    }
    : {
      card: "bg-white text-gray-900 border-gray-200 shadow-sm",
      cardHover: "hover:shadow-md",
      statsIconBg: "bg-[#0066A1]/10 text-[#0066A1]",
      textPrimary: "text-gray-900",
      textSecondary: "text-gray-500",
      footer: "bg-gray-50 border-t border-gray-100",
      input:
        "bg-white border-gray-300 text-gray-900 focus-visible:ring-[#0066A1]",
      buttonPrimary: "bg-[#0066A1] text-white hover:bg-[#005585]",
      buttonText: "text-[#0066A1] hover:text-[#005585]",
      select:
        "bg-white border-gray-300 text-gray-900 focus-visible:ring-[#0066A1]",
      tabActive: "border-[#0066A1] text-[#0066A1] bg-blue-50/30",
      tabInactive:
        "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50",
    };

  return (
    <PageLayout
      title="Gestão de Prefeituras"
      subtitle="Gerencie prefeituras, empréstimos e solicitações"
      actions={
        <Button
          onClick={handleOpenFormForCreate}
          className={cn("gap-2 shadow-sm", styles.buttonPrimary)}
        >
          <Plus className="h-5 w-5" />
          Solicitar Prefeitura
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066A1]"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Consolidated Prefeituras Card */}
            <ConsolidatedPrefeiturasCard
              total={stats.total}
              pending={stats.pending}
              active={stats.active}
              inactive={stats.inactive}
              userType={userType}
            />



            <StatCard
              title="Comissões Franqueados"
              value={formatCurrency(stats.totalFranqueadoCommission)}
              icon={<DollarSign className="h-6 w-6" />}
              userType={userType}
              footerDetails={
                <div className="flex justify-between items-center w-full text-xs">
                  <span className={isMaster ? "text-yellow-500" : "text-yellow-600"}>Pendente:</span>
                  <span className={`font-medium ${isMaster ? "text-yellow-400" : "text-yellow-700"}`}>
                    {formatCurrency(stats.totalFranqueadoPendingCommission)}
                  </span>
                </div>
              }
            />

            {(userType === 'admin' || userType === 'master') && (
              <StatCard
                title="Comissões Masters"
                value={formatCurrency(stats.totalMasterCommission)}
                icon={<DollarSign className="h-6 w-6" />}
                userType={userType}
                footerDetails={
                  <div className="flex justify-between items-center w-full text-xs">
                    <span className={isMaster ? "text-yellow-500" : "text-yellow-600"}>Pendente:</span>
                    <span className={`font-medium ${isMaster ? "text-yellow-400" : "text-yellow-700"}`}>
                      {formatCurrency(stats.totalMasterPendingCommission)}
                    </span>
                  </div>
                }
              />
            )}

            <div
              className={`overflow-hidden rounded-xl border transition-shadow duration-200 ${styles.card} ${styles.cardHover}`}
            >
              <div className="p-5 flex items-center h-full">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${styles.textSecondary}`}>
                    Aguardando Ação
                  </p>
                  <div className="mt-1 flex items-baseline">
                    <p className={`text-2xl font-bold ${styles.textPrimary}`}>
                      {stats.pending}
                    </p>
                    {stats.pending > 0 && (
                      <span
                        className={`ml-2 text-sm font-medium px-2 py-0.5 rounded-full ${isMaster ? "text-yellow-400 bg-yellow-500/20" : "text-yellow-600 bg-yellow-100"}`}
                      >
                        Ação Necessária
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={`p-3 rounded-lg ${isMaster ? "bg-yellow-500/10 text-yellow-400" : "bg-yellow-50 text-yellow-600"}`}
                >
                  <FileInput className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>


          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-1 mb-4 overflow-x-auto">
              {[
                { id: "prefeituras", label: "Prefeituras" },
                { id: "pending", label: "Em Andamento" },
                { id: "kanban", label: "Funil de Etapas" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap",
                    activeTab === tab.id
                      ? styles.tabActive
                      : styles.tabInactive
                  )}
                >
                  {tab.label}
                  {tab.id === 'pending' && stats.pending > 0 && (
                    <span
                      className={cn(
                        "ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold",
                        activeTab === tab.id
                          ? (isMaster ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50" : "bg-yellow-100 text-yellow-800 border border-yellow-800/20")
                          : (isMaster ? "bg-yellow-500/10 text-yellow-600 border border-yellow-600/20" : "bg-yellow-50 text-yellow-600 border border-yellow-600/20")
                      )}
                    >
                      {stats.pending}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 p-1">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn("pl-10 pr-3 py-2.5 h-auto", styles.input)}
                  placeholder="Pesquisar por cidade, estado ou CNPJ..."
                />
              </div>

              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger
                  className={cn("w-[200px] h-auto py-2.5", styles.select)}
                >
                  <SelectValue placeholder="Todos os Estados" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className={cn("w-[200px] h-auto py-2.5", styles.select)}
                >
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="ACTIVE">Ativa</SelectItem>
                  <SelectItem value="INACTIVE">Inativa</SelectItem>
                  <SelectItem value="PENDING">Pendentes</SelectItem>
                  <SelectItem value="AGUARDANDO_ANALISE">Aguardando Análise</SelectItem>
                  <SelectItem value="EM_NEGOCIACAO">Em Negociação</SelectItem>
                  <SelectItem value="DOCUMENTACAO">Documentação</SelectItem>
                  <SelectItem value="REPROVADA">Reprovadas</SelectItem>
                </SelectContent>
              </Select>

              {(activeTab !== "all" ||
                stateFilter !== "all" ||
                statusFilter !== "all" ||
                searchQuery) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setActiveTab("all");
                      setStateFilter("all");
                      setStatusFilter("all");
                      setSearchQuery("");
                    }}
                    className={cn("h-auto py-2", styles.buttonText)}
                  >
                    Limpar filtros
                  </Button>
                )}
            </div>

            {/* List */}
            {activeTab === 'kanban' ? (
              <KanbanBoard searchQuery={searchQuery} stateFilter={stateFilter} />
            ) : (
            <PrefeituraList
              prefeituras={filteredPrefeituras}
              onManage={handleManage}
              onSelectPrefeitura={setSelectedPrefeitura}
              selectedPrefeituraId={selectedPrefeitura?.id}
              userType={userType}
              onEdit={handleOpenFormForEdit}
              duplicatesMap={duplicatesMap}
              myActionIds={myActionIds}
            />
            )}
          </div>

          {/* Details Drawer */}
          <PrefeituraDetails
            isOpen={isDetailsOpen}
            onClose={handleCloseDrawer}
            prefeitura={selectedPrefeitura}
            onEdit={handleOpenFormForEdit}
            onDelete={handleDelete}
            onAddLoan={() => {
              setEditingLoan(null);
              setIsLoanModalOpen(true);
            }}
            onEditLoan={handleEditLoan}
            onDeleteLoan={handleDeleteLoan}
            userType={userType}
            onStatusChange={fetchPrefeituras}
            onFilesChange={fetchPrefeituras}
          />

          {/* Create/Edit Modal */}
          <PrefeituraForm
            isOpen={isFormModalOpen}
            onClose={handleCloseForm}
            onSubmit={handleSubmit}
            editingPrefeitura={editingPrefeitura}
            userType={userType}
          />

          {/* Loan Modal */}
          <ConsignadoForm
            isOpen={isLoanModalOpen}
            onClose={() => {
              setIsLoanModalOpen(false);
              setEditingLoan(null);
            }}
            onSave={handleSaveLoan}
            prefeituraId={selectedPrefeitura?.id}
            loanToEdit={editingLoan}
          />
        </>
      )
      }
    </PageLayout >
  );
}
