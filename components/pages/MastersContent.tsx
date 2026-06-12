"use client";
import React, { useMemo, useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import {
  Settings,
  Plus,
  UserPlus,
  Users,
  TrendingUp,
  DollarSign,
  Building2,
  Search,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  Briefcase,
  Loader2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { Master, FranqueadoSummary } from "@/types";
import { formatCurrency, formatDate, formatPhone, formatDocument, formatCEP } from "@/lib/utils";
import { PageLayout } from "@/components/layout/PageLayout";
import { Modal } from "@/components/common/Modal";
import { Drawer, DrawerTabs, DrawerCard } from "@/components/common/Drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export function MastersContent() {
  const { logout, userType, isLoading: isAuthLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [editingMaster, setEditingMaster] = useState<Master | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");

  const [drawerTab, setDrawerTab] = useState<string>("info");
  const [showPassword, setShowPassword] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // Data state
  const [masters, setMasters] = useState<Master[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !userType) {
      // Window location used as fallback, but router.push is preferred if available in scope (not imported here yet)
      // Since we are in a component, we rely on AuthContext or parent to handle redirect, 
      // but let's show a loader or message instead of null to be safe.
      // Actually, let's just show returning null is fine if we are redirecting, but providing a visual cue is better.
    }
  }, [isAuthLoading, userType]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    commissionRate: "15",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    password: "",
    sendEmail: false,
  });
  const [sellerFormData, setSellerFormData] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    commissionRate: "10",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    password: "",
    sendEmail: false,
  });
  const [showSellerPassword, setShowSellerPassword] = useState(false);

  // Fetch masters
  useEffect(() => {
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    if (!userType) return;
    try {
      setIsDataLoading(true);
      const response = await fetch("/api/masters");
      if (!response.ok) throw new Error("Falha ao carregar masters");
      const data = await response.json();
      // Map API response to match Master interface (ensure franqueados exists)
      const mappedData = data.map((m: any) => ({
        ...m,
        franqueados: (m.franqueados || []).map((f: any) => ({
          ...f,
          citiesRegistered: f.prefeituras?.length || 0
        })),
      }));
      setMasters(mappedData);
      // Update selectedMaster if it exists (to keep drawer in sync)
      if (selectedMaster) {
        const updated = mappedData.find(
          (m: Master) => m.id === selectedMaster.id,
        );
        if (updated) setSelectedMaster(updated);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar dados");
    } finally {
      setIsDataLoading(false);
    }
  };

  // Helper functions
  const getTotalLoans = (franqueados: FranqueadoSummary[]) => {
    if (!Array.isArray(franqueados)) return 0;
    return franqueados.reduce((total, f) => {
      const amount = Number(f.loanAmount);
      return total + (isNaN(amount) ? 0 : amount);
    }, 0);
  };



  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password }));
  };

  const generateSellerPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSellerFormData((prev) => ({ ...prev, password }));
  };

  const stats = useMemo(() => {
    const total = masters.length;
    const totalLoans = masters.reduce(
      (sum, f) => sum + getTotalLoans(f.franqueados ?? []),
      0,
    );
    const thisMonth = masters.filter((f) => {
      if (!f.registrationDate) return false;
      const date = new Date(f.registrationDate);
      const now = new Date();
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;
    return {
      total,
      totalLoans,
      thisMonth,
    };
  }, [masters]);

  // Filter masters based on search query and state
  const filteredMasters = useMemo(() => {
    let filtered = masters;
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((master) => {
        const nameMatch = master.name.toLowerCase().includes(query);
        const emailMatch = master.email.toLowerCase().includes(query);
        const documentMatch = master.document?.toLowerCase().includes(query);
        return nameMatch || emailMatch || documentMatch;
      });
    }
    // State filter
    if (stateFilter !== "all") {
      filtered = filtered.filter((f) => f.state === stateFilter);
    }
    return filtered;
  }, [searchQuery, stateFilter, masters]);

  // Get unique states for filter
  const states = useMemo(() => {
    return Array.from(
      new Set(masters.map((f) => f.state).filter(Boolean)),
    ).sort();
  }, [masters]);

  const handleOpenDrawer = (master: Master) => {
    setSelectedMaster(master);
    setDrawerTab("info");
  };

  const handleCloseDrawer = () => {
    setSelectedMaster(null);
  };

  const handleOpenModal = (master?: Master) => {
    if (master) {
      setEditingMaster(master);
      setFormData({
        name: master.name,
        email: master.email,
        phone: master.phone,
        document: master.document || "",
        commissionRate: master.commissionRate.toString(),
        address: master.address || "",
        city: master.city || "",
        state: master.state || "",
        zipCode: master.zipCode || "",
        password: "",
        sendEmail: false,
      });
    } else {
      setEditingMaster(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        document: "",
        commissionRate: "15",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        password: "",
        sendEmail: false,
      });
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMaster(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      document: "",
      commissionRate: "15",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      password: "",
      sendEmail: false,
    });
  };

  const handleOpenSellerModal = (masterId?: string) => {
    if (masterId) {
      setSelectedMaster(masters.find((m) => m.id === masterId) || null);
    }
    setSellerFormData({
      name: "",
      email: "",
      phone: "",
      document: "",
      commissionRate: "10",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      password: "",
      sendEmail: false,
    });
    setShowSellerPassword(false);
    setIsSellerModalOpen(true);
  };

  const handleCloseSellerModal = () => {
    setIsSellerModalOpen(false);
    setSellerFormData({
      name: "",
      email: "",
      phone: "",
      document: "",
      commissionRate: "10",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      password: "",
      sendEmail: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const url = editingMaster
        ? `/api/masters/${editingMaster.id}`
        : "/api/masters";
      const method = editingMaster ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro ao salvar");
      }

      await fetchMasters();
      handleCloseModal();
    } catch (error: any) {
      console.error("Error saving master:", error);
      // alert(error.message || "Erro ao salvar master"); // Better to show the actual error
      // Using simple alert as in original code, but prefer toast if available
      alert(error.message || "Erro ao salvar master");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIdToDelete(id);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!idToDelete) return;

    try {
      const response = await fetch(`/api/masters/${idToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao remover");

      await fetchMasters();
      // Close drawer if deleted master was selected
      if (selectedMaster?.id === idToDelete) {
        handleCloseDrawer();
      }
      setIsConfirmDialogOpen(false);
      setIdToDelete(null);
    } catch (error) {
      console.error("Error deleting master:", error);
      alert("Erro ao remover master");
    }
  };

  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaster || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/franqueados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sellerFormData,
          masterId: selectedMaster.id,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro ao criar franqueado");
      }

      await fetchMasters();
      handleCloseSellerModal();
    } catch (error: any) {
      console.error("Error creating franqueado:", error);
      alert(error.message || "Erro ao criar franqueado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "phone") formattedValue = formatPhone(value);
    if (name === "document") formattedValue = formatDocument(value);
    if (name === "zipCode") formattedValue = formatCEP(value);

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleSellerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "phone") formattedValue = formatPhone(value);
    if (name === "document") formattedValue = formatDocument(value);
    if (name === "zipCode") formattedValue = formatCEP(value);

    setSellerFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  // State management for inputs handled directly via onChange in JSX
  // However, for Select component we need specific handlers or wrapper

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userType) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Acesso não autorizado ou sessão expirada.</p>
        <Button onClick={() => window.location.href = '/login'}>Ir para Login</Button>
      </div>
    );
  }

  return (
    <PageLayout
      title="Masters"
      subtitle="Gerencie os masters e seus franqueados"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total de Masters"
          value={stats.total}
          icon={<Users className="h-6 w-6" />}
          description="cadastrados"
        />
        <StatCard
          title="Total de Franqueados"
          value={masters.reduce(
            (sum, f) => sum + (f.franqueados?.length || 0),
            0,
          )}
          icon={<Building2 className="h-6 w-6" />}
          description="ativos"
        />
        <StatCard
          title="Total Consignados"
          value={formatCurrency(stats.totalLoans)}
          icon={<DollarSign className="h-6 w-6" />}
          trend={{ value: 8, isPositive: true }}
          description="vs mês anterior"
        />
        <StatCard
          title="Novos este Mês"
          value={stats.thisMonth}
          icon={<TrendingUp className="h-6 w-6" />}
          description="cadastrados"
        />
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
              placeholder="Pesquisar por nome, email ou documento..."
            />
          </div>

          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="h-5 w-5" />
            Novo Master
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Todos os Estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Estados</SelectItem>
              {states.map((state) => (
                <SelectItem key={state} value={state as string}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {stateFilter !== "all" && (
            <Button
              variant="ghost"
              onClick={() => setStateFilter("all")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Franqueados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Consignados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Comissão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {isDataLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : filteredMasters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Search className="h-12 w-12 mb-3 opacity-20" />
                      <p className="text-sm font-medium">
                        Nenhum master encontrado
                      </p>
                      <p className="text-xs mt-1">
                        Tente ajustar sua pesquisa ou cadastrar um novo
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMasters.map((master) => {
                  const totalLoans = getTotalLoans(master.franqueados ?? []);
                  const franqueadosCount = master.franqueados?.length || 0;
                  return (
                    <tr
                      key={master.id}
                      className={`hover:bg-muted/50 transition-colors cursor-pointer ${selectedMaster?.id === master.id ? "bg-muted/50" : ""}`}
                      onClick={() => handleOpenDrawer(master)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">
                          {master.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {master.document}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground">
                          {master.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {master.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {franqueadosCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary">
                        {formatCurrency(totalLoans)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {master.commissionRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDrawer(master);
                            }}
                            title="Ver detalhes"
                          >
                            <Eye className="h-5 w-5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(master);
                            }}
                            title="Editar"
                          >
                            <Settings className="h-5 w-5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDelete(master.id, e)}
                            className="hover:text-destructive hover:bg-destructive/10"
                            title="Remover"
                          >
                            <Trash2 className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Master Details Drawer */}
      <Drawer
        isOpen={!!selectedMaster}
        onClose={handleCloseDrawer}
        title={selectedMaster?.name || ""}
        subtitle={selectedMaster?.document || ""}
        size="lg"
        headerActions={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => selectedMaster && handleOpenModal(selectedMaster)}
              title="Editar Master"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => selectedMaster && handleDelete(selectedMaster.id)}
              className="hover:text-destructive"
              title="Remover Master"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <DrawerTabs
          tabs={[
            {
              id: "info",
              label: "Informações",
              icon: <Info className="h-4 w-4" />,
            },
            {
              id: "franqueados",
              label: `Franqueados (${selectedMaster?.franqueados?.length || 0})`,
              icon: <Briefcase className="h-4 w-4" />,
            },
          ]}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
        />

        {selectedMaster && (
          <div className="p-6">
            {/* Info Tab */}
            {drawerTab === "info" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedMaster.email}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      Telefone
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedMaster.phone}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      Taxa de Comissão
                    </p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {selectedMaster.commissionRate}%
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      Data de Cadastro
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedMaster.registrationDate
                        ? formatDate(selectedMaster.registrationDate)
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Endereço Completo
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedMaster.address
                      ? `${selectedMaster.address}, ${selectedMaster.city}/${selectedMaster.state} - CEP: ${selectedMaster.zipCode}`
                      : "Não informado"}
                  </p>
                </div>

                {/* Summary Stats */}
                <div className="border-t pt-6">
                  <h4 className="text-sm font-semibold text-foreground mb-4">
                    Resumo
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-border rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {selectedMaster.franqueados?.length || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Franqueados
                      </p>
                    </div>
                    <div className="border border-border rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(
                          getTotalLoans(selectedMaster.franqueados ?? []),
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Consignado
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Franqueados Tab */}
            {drawerTab === "franqueados" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedMaster.franqueados?.length || 0} franqueado(s)
                    vinculado(s)
                  </p>
                  <Button
                    onClick={() => handleOpenSellerModal()}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    Novo Franqueado
                  </Button>
                </div>

                {(selectedMaster.franqueados || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">
                      Nenhum franqueado vinculado
                    </p>
                    <p className="text-xs mt-1">
                      Clique em &quot;Novo Franqueado&quot; para adicionar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(selectedMaster.franqueados || []).map((franqueado) => (
                      <DrawerCard key={franqueado.id}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h5 className="text-sm font-semibold text-foreground">
                              {franqueado.name}
                            </h5>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {franqueado.email}
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {franqueado.commissionRate}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Prefeituras
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {franqueado.citiesRegistered || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Consignado
                            </p>
                            <p className="text-sm font-semibold text-primary">
                              {formatCurrency(
                                Number(franqueado.loanAmount) || 0,
                              )}
                            </p>
                          </div>
                        </div>
                      </DrawerCard>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Master Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingMaster ? "Editar Master" : "Novo Master"}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: João da Silva"
                className="bg-background"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Ex: joao@email.com"
                className="bg-background"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Ex: (11) 99999-9999"
                className="bg-background"
              />
            </div>

            {!editingMaster && (
              <div className="space-y-2">
                <Label>Senha de Acesso *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Senha do usuário"
                      className="bg-background pr-10"
                      required={!editingMaster}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                    title="Gerar senha aleatória"
                    size="icon"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {!editingMaster && (
              <div className="space-y-2 flex items-center gap-2 pt-6">
                <Checkbox
                  id="sendEmail"
                  checked={formData.sendEmail}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, sendEmail: checked as boolean }))
                  }
                />
                <Label htmlFor="sendEmail" className="cursor-pointer">Enviar credenciais por e-mail</Label>
              </div>
            )}
            <div className="space-y-2">
              <Label>CPF/CNPJ</Label>
              <Input
                name="document"
                value={formData.document}
                onChange={handleInputChange}
                placeholder="000.000.000-00"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Taxa de Comissão (%)</Label>
              <Input
                type="number"
                name="commissionRate"
                value={formData.commissionRate}
                onChange={handleInputChange}
                placeholder="15"
                className="bg-background"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                placeholder="00000-000"
                className="bg-background"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Endereço</Label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Rua, número, bairro"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="São Paulo"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="SP"
                className="bg-background"
                maxLength={2}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingMaster ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Seller Modal */}
      <Modal
        isOpen={isSellerModalOpen}
        onClose={handleCloseSellerModal}
        title="Novo Franqueado"
        maxWidth="2xl"
      >
        <form onSubmit={handleSellerSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                name="name"
                value={sellerFormData.name}
                onChange={handleSellerInputChange}
                placeholder="Ex: João da Silva"
                className="bg-background"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                name="email"
                value={sellerFormData.email}
                onChange={handleSellerInputChange}
                placeholder="Ex: joao@email.com"
                className="bg-background"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone *</Label>
              <Input
                name="phone"
                value={sellerFormData.phone}
                onChange={handleSellerInputChange}
                placeholder="Ex: (11) 99999-9999"
                className="bg-background"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Senha de Acesso *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showSellerPassword ? "text" : "password"}
                    name="password"
                    value={sellerFormData.password}
                    onChange={handleSellerInputChange}
                    placeholder="Senha do usuário"
                    className="bg-background pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowSellerPassword(!showSellerPassword)}
                  >
                    {showSellerPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSellerPassword}
                  title="Gerar senha aleatória"
                  size="icon"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 flex items-center gap-2 pt-6">
              <Checkbox
                id="sendSellerEmail"
                checked={sellerFormData.sendEmail}
                onCheckedChange={(checked) =>
                  setSellerFormData(prev => ({ ...prev, sendEmail: checked as boolean }))
                }
              />
              <Label htmlFor="sendSellerEmail" className="cursor-pointer">Enviar credenciais por e-mail</Label>
            </div>

            <div className="space-y-2">
              <Label>CPF/CNPJ</Label>
              <Input
                name="document"
                value={sellerFormData.document}
                onChange={handleSellerInputChange}
                placeholder="000.000.000-00"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Taxa de Comissão (%)</Label>
              <Input
                type="number"
                name="commissionRate"
                value={sellerFormData.commissionRate}
                onChange={handleSellerInputChange}
                placeholder="10"
                className="bg-background"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                name="zipCode"
                value={sellerFormData.zipCode}
                onChange={handleSellerInputChange}
                placeholder="00000-000"
                className="bg-background"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Endereço</Label>
              <Input
                name="address"
                value={sellerFormData.address}
                onChange={handleSellerInputChange}
                placeholder="Rua, número, bairro"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                name="city"
                value={sellerFormData.city}
                onChange={handleSellerInputChange}
                placeholder="São Paulo"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input
                name="state"
                value={sellerFormData.state}
                onChange={handleSellerInputChange}
                placeholder="SP"
                className="bg-background"
                maxLength={2}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseSellerModal}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remover Master"
        description="Tem certeza que deseja remover este master? Esta ação não pode ser desfeita e removerá também o acesso do usuário correspondente."
        variant="destructive"
      />
    </PageLayout>
  );
}
