import React, { useState, useEffect, useMemo, useRef } from "react";
import { Save, AlertCircle } from "lucide-react";
import { Prefeitura, Master, Franqueado } from "@/types";
import { Modal } from "@/components/common/Modal";
import { UserType } from "@/types";
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
import { Combobox } from "@/components/ui/combobox";
import { cn, formatDocument, formatCEP, formatPhone, formatNumber } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { BRAZILIAN_STATES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

interface PrefeituraFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Prefeitura>) => Promise<void>;
  editingPrefeitura?: Prefeitura | null;
  userType?: UserType;
}

export function PrefeituraForm({
  isOpen,
  onClose,
  onSubmit,
  editingPrefeitura,
  userType,
}: PrefeituraFormProps) {
  const isMaster = userType === "master";
  const { user } = useAuth();

  const [masters, setMasters] = useState<Master[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const currentFranqueadoRef = useRef<{ masterId: string; id: string } | null>(null);

  const currentMaster = useMemo(() => {
    if (userType === 'master' && user?.email && masters.length > 0) {
      return masters.find(m => m.email === user.email);
    }
    return null;
  }, [masters, user, userType]);

  const [cities, setCities] = useState<{ value: string; label: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const [formData, setFormData] = useState({
    city: "",
    state: "",
    cnpj: "",
    status: "AGUARDANDO_ANALISE" as
      | "AGUARDANDO_ANALISE"
      | "AGUARDANDO_DECRETO"
      | "PROCESSO_EM_ANDAMENTO"
      | "ATIVA"
      | "INATIVA"
      | "REPROVADA",
    mayorName: "",
    population: "",
    address: "",
    zipCode: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    masterId: "",
    franqueadoId: "",
    ibgeCode: "",
  });


  useEffect(() => {
    fetchConfig();
    if (userType === 'franqueado') {
      fetchCurrentFranqueado();
    }
  }, [userType]);

  useEffect(() => {
    if (!formData.city) {
      setIsDuplicate(false);
      return;
    }

    if (editingPrefeitura && editingPrefeitura.city === formData.city) {
      setIsDuplicate(false);
      return;
    }

    const checkDuplicate = async () => {
      setCheckingDuplicate(true);
      try {
        const response = await fetch(`/api/prefeituras/check-duplicate?city=${encodeURIComponent(formData.city)}`);
        if (response.ok) {
          const data = await response.json();
          setIsDuplicate(data.duplicates && data.duplicates.length > 0);
        } else {
          setIsDuplicate(false);
        }
      } catch (error) {
        console.error("Erro ao verificar duplicidade de cidade:", error);
      } finally {
        setCheckingDuplicate(false);
      }
    };

    const timeoutId = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.city, editingPrefeitura]);

  const fetchCurrentFranqueado = async () => {
    console.log("👤 Fetching current franqueado details...");
    try {
      const response = await fetch('/api/franqueados/me');
      if (response.ok) {
        const data = await response.json();
        const franqueadoData = { masterId: data.masterId, id: data.id };
        currentFranqueadoRef.current = franqueadoData;
        setFormData(prev => ({
          ...prev,
          masterId: franqueadoData.masterId,
          franqueadoId: franqueadoData.id
        }));
      }
    } catch (error) {
      console.error('Error fetching franqueado details:', error);
      toast.error('Erro ao carregar dados do franqueado');
    }
  };

  const fetchConfig = async () => {
    console.log("⚙️ Fetching master config...");
    try {
      setLoadingConfig(true);
      const response = await fetch("/api/masters");
      if (response.ok) {
        const data = await response.json();
        setMasters(data);
      }
    } catch (error) {
      console.error("Error fetching config:", error);
    } finally {
      setLoadingConfig(false);
    }
  };

  // Helper for text normalization
  const normalizeText = (text: string) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  // Fetch Cities when State changes
  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.state) {
        setCities([]);
        return;
      }

      // Don't clear cities immediately if we have a value selected (to avoid flickering "Select..." state)
      // Only set loading state
      setLoadingCities(true);

      try {
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`
        );

        if (response.ok) {
          const data = await response.json();
          // Sort cities alphabetically
          const sortedCities = data
            .map((city: any) => ({
              value: city.id.toString(),
              label: city.nome,
            }))
            .sort((a: any, b: any) => a.label.localeCompare(b.label));

          // Before setting cities, check if we need to preserve/correct the current selection
          let finalCities = sortedCities;

          if (formData.ibgeCode) {
            const exactMatch = sortedCities.find((c: any) => c.value === formData.ibgeCode);

            if (!exactMatch && formData.city) {
              // Se tiver o nome mas não o código (importação antiga), tentar match pelo nome
              const nameMatch = sortedCities.find((c: any) => normalizeText(c.label) === normalizeText(formData.city));
              if (nameMatch) {
                setFormData(prev => ({ ...prev, ibgeCode: nameMatch.value, city: nameMatch.label }));
              } else {
                finalCities = [...sortedCities, { value: "manual", label: formData.city }];
              }
            }
          }

          setCities(finalCities);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        toast.error("Erro ao carregar cidades");
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.state]);

  const allFranqueados = useMemo(() => {
    return masters.flatMap((m) => m.franqueados || []);
  }, [masters]);

  const filteredFranqueados = useMemo(() => {
    if (formData.masterId) {
      const selectedMaster = masters.find((m) => m.id === formData.masterId);
      if (!selectedMaster) return [];

      const list = selectedMaster.franqueados || [];

      // Retornar a lista incluindo o próprio master como uma opção de "Gestão Própria"
      return [
        { id: selectedMaster.id, name: `${selectedMaster.name} (Master)` },
        ...list
      ];
    }
    return allFranqueados;
  }, [masters, formData.masterId, allFranqueados]);

  // Effect to set masterId if user is Master
  useEffect(() => {
    if (currentMaster && isOpen && !editingPrefeitura) {
      setFormData(prev => ({
        ...prev,
        masterId: currentMaster.id
      }));
    }
  }, [currentMaster, isOpen, editingPrefeitura]);

  useEffect(() => {
    if (!isOpen) return; // Only run when modal opens

    if (editingPrefeitura) {
      // Normalize state to UF if needed
      let stateCode = "";

      if (editingPrefeitura.state) {
        const trimmedState = editingPrefeitura.state.trim();

        // If it's already a 2-char UF code
        if (trimmedState.length === 2) {
          stateCode = trimmedState.toUpperCase();
        } else {
          // Try to find by exact name match first
          let found = BRAZILIAN_STATES.find(s => s.name === trimmedState);

          if (!found) {
            // Try case-insensitive and accent-insensitive match
            const normalizedInput = normalizeText(trimmedState);
            found = BRAZILIAN_STATES.find(s => normalizeText(s.name) === normalizedInput);
          }

          if (!found) {
            // Try to find by UF match (case insensitive)
            found = BRAZILIAN_STATES.find(s => s.uf.toLowerCase() === trimmedState.toLowerCase());
          }

          stateCode = found?.uf || trimmedState;
        }
      }

      // Determine initial masterId and franqueadoId
      let initMasterId = editingPrefeitura.masterId || "";
      let initFranqueadoId = editingPrefeitura.franqueadoId || "";

      // Se não houver franqueado (gestão direta), usamos o ID do Master no campo franqueado para exibição
      if (!initFranqueadoId && initMasterId) {
        initFranqueadoId = initMasterId;
      }

      setFormData({
        city: editingPrefeitura.city || "",
        state: stateCode,
        cnpj: editingPrefeitura.cnpj || "",
        status: (editingPrefeitura.status as any) || "AGUARDANDO_ANALISE",
        mayorName: editingPrefeitura.mayorName || "",
        population: editingPrefeitura.population ? formatNumber(editingPrefeitura.population.toString()) : "",
        address: editingPrefeitura.address || "",
        zipCode: editingPrefeitura.zipCode || "",
        contactName: editingPrefeitura.contactName || "",
        contactEmail: editingPrefeitura.contactEmail || "",
        contactPhone: editingPrefeitura.contactPhone || "",
        masterId: initMasterId,
        franqueadoId: initFranqueadoId,
        ibgeCode: editingPrefeitura.ibgeCode || "",
      });

      // Pre-populate cities with current city so it shows up while fetching
      // This is crucial: we put the current city in the list IMMEDIATELY
      if (editingPrefeitura.city) {
        setCities([{ value: editingPrefeitura.city, label: editingPrefeitura.city }]);
      }
    } else {
      setFormData({
        city: "",
        state: "",
        cnpj: "",
        status: "AGUARDANDO_ANALISE",
        mayorName: "",
        population: "",
        address: "",
        zipCode: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        masterId: userType === 'franqueado' && currentFranqueadoRef.current ? currentFranqueadoRef.current.masterId : (userType === 'master' && currentMaster ? currentMaster.id : ""),
        franqueadoId: userType === 'franqueado' && currentFranqueadoRef.current ? currentFranqueadoRef.current.id : "",
        ibgeCode: "",
      });
      setCities([]);
    }
  }, [isOpen, editingPrefeitura, userType, currentMaster]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cnpj") formattedValue = formatDocument(value);
    if (name === "zipCode") formattedValue = formatCEP(value);
    if (name === "contactPhone") formattedValue = formatPhone(value);
    if (name === "population") formattedValue = formatNumber(value);

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "city") {
      // Quando seleciona cidade, salvamos o código E o nome
      const selectedCity = cities.find(c => c.value === value);
      setFormData((prev) => ({
        ...prev,
        ibgeCode: value,
        city: selectedCity?.label || prev.city
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.franqueadoId) {
      toast.error("O campo Franqueado é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSubmit = { ...formData };

      // Se o ID do franqueado selecionado for igual ao ID do Master,
      // significa que é gestão direta pelo Master. No banco, franqueadoId deve ser null.
      if (dataToSubmit.franqueadoId === dataToSubmit.masterId) {
        (dataToSubmit as any).franqueadoId = null;
      }

      // Convert population back to number
      if (dataToSubmit.population) {
        dataToSubmit.population = dataToSubmit.population.replace(/\D/g, "");
      }

      await onSubmit(dataToSubmit);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Erro ao salvar prefeitura");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingPrefeitura ? "Editar Prefeitura" : "Adicionar Solicitação"} maxWidth="2xl">
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2 text-foreground border-border">
              Informações Gerais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select
                  key={formData.state || 'empty-state'}
                  name="state"
                  value={formData.state}
                  onValueChange={(value) => handleSelectChange("state", value)}
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Selecione um estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state.uf} value={state.uf}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Combobox
                  options={cities}
                  value={formData.ibgeCode}
                  onChange={(value) => handleSelectChange("city", value)}
                  placeholder="Selecione uma cidade"
                  disabled={!formData.state || loadingCities}
                  isLoading={loadingCities || checkingDuplicate}
                  className="bg-background"
                />
                {isDuplicate && (
                  <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-2 rounded-md text-xs mt-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Esta cidade não pode ser solicitada pois já possui um processo em andamento.</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  key={formData.status || 'empty-status'}
                  name="status"
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                  disabled={userType === "franqueado" || userType === "master"}
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGUARDANDO_ANALISE">Aguardando Análise</SelectItem>
                    <SelectItem value="AGUARDANDO_DECRETO">Aguardando Decreto</SelectItem>
                    <SelectItem value="PROCESSO_EM_ANDAMENTO">Em Processo</SelectItem>
                    <SelectItem value="ATIVA">Ativa</SelectItem>
                    <SelectItem value="INATIVA">Inativa</SelectItem>
                    <SelectItem value="REPROVADA">Reprovada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vínculos */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-2 border-border">
                <h4 className="text-xs uppercase font-bold tracking-wider mb-2 md:col-span-2 text-muted-foreground">
                  Vínculos
                </h4>
                <div className="space-y-2">
                  <Label>Master</Label>
                  <Combobox
                    options={masters.map((m) => ({
                      value: m.id,
                      label: m.name,
                    }))}
                    value={formData.masterId}
                    onChange={(value) => handleSelectChange("masterId", value)}
                    placeholder="Selecione um Master"
                    disabled={loadingConfig || userType === 'franqueado' || userType === 'master'}
                    isLoading={loadingConfig}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Franqueado</Label>
                  <Combobox
                    options={filteredFranqueados.map((f) => ({
                      value: f.id,
                      label: f.name,
                    }))}
                    value={formData.franqueadoId}
                    onChange={(value) =>
                      handleSelectChange("franqueadoId", value)
                    }
                    placeholder={
                      formData.masterId
                        ? "Selecione um Franqueado"
                        : "Todos os Franqueados"
                    }
                    disabled={loadingConfig || userType === 'franqueado'}
                    isLoading={loadingConfig}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome do Prefeito</Label>
                <Input
                  name="mayorName"
                  value={formData.mayorName}
                  onChange={handleChange}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>População</Label>
                <Input
                  type="text"
                  name="population"
                  value={formData.population}
                  onChange={handleChange}
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2 text-foreground border-border">
              Endereço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Endereço</Label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2 text-foreground border-border">
              Contato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nome do Responsável</Label>
                <Input
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" className="gap-2" disabled={isSubmitting || isDuplicate || checkingDuplicate}>
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingPrefeitura ? "Atualizar" : "Salvar"} Solicitação
            </Button>
          </div>
        </form >
      </div >
    </Modal >
  );
}
