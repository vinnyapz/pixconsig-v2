import React from "react";
import { Building2, Search, Info, Pencil, AlertTriangle } from "lucide-react";
import { Prefeitura } from "@/types/prefeitura";

import { formatCurrency, getEntityName, cn } from "@/lib/utils";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";

interface PrefeituraListProps {
  prefeituras: Prefeitura[];
  onEdit?: (prefeitura: Prefeitura) => void;
  onDelete?: (id: string) => void;
  userType?: string;
  onManage: (prefeitura: Prefeitura) => void;
  onSelectPrefeitura?: (prefeitura: Prefeitura | null) => void;
  selectedPrefeituraId?: string;
  duplicatesMap?: Record<string, string[]>;
  myActionIds?: Set<string>;
}

const statusMap: Record<string, { label: string; color: string }> = {
  AGUARDANDO_ANALISE: { label: "Aguardando Análise", color: "bg-yellow-100 text-yellow-800" },
  AGUARDANDO_DECRETO: { label: "Aguardando Decreto", color: "bg-orange-100 text-orange-800" },
  PROCESSO_EM_ANDAMENTO: { label: "Em Andamento", color: "bg-blue-100 text-blue-800" },
  ATIVA: { label: "Ativa", color: "bg-green-100 text-green-800" },
  INATIVA: { label: "Inativa", color: "bg-gray-100 text-gray-800" },
  REPROVADA: { label: "Reprovada", color: "bg-red-100 text-red-800" },
};

export function PrefeituraList({
  prefeituras,
  onManage,
  onSelectPrefeitura,
  selectedPrefeituraId,
  userType,
  onEdit,
  duplicatesMap,
  myActionIds,
}: PrefeituraListProps) {
  const isMaster = userType === "master";
  const isFranqueado = userType === "franqueado";

  const styles = isMaster
    ? {
      container:
        "bg-gradient-to-br from-[#36454F] to-[#1c1c1e] border-[#4A5568]/50 shadow-lg shadow-[#00D9FF]/10",
      header:
        "bg-gradient-to-r from-[#36454F] to-[#4A5568] border-b border-[#4A5568]/30",
      headerText: "text-[#C0C0C0]",
      row: "border-[#4A5568]/20 hover:bg-white/5",
      rowSelected: "bg-[#00D9FF]/10",
      text: "text-[#E5E4E2]",
      subtext: "text-[#C0C0C0]",
      iconBg: "bg-[#00D9FF]/10 text-[#00D9FF] group-hover:bg-[#00D9FF]/20",
      buttonEdit: "text-gray-400 hover:text-[#00D9FF] hover:bg-[#00D9FF]/10",
    }
    : {
      container: "bg-white border-gray-200 shadow-sm",
      header: "bg-gray-50/50",
      headerText: "text-gray-500",
      row: "hover:bg-gray-50/80",
      rowSelected: "bg-blue-50",
      text: "text-gray-900",
      subtext: "text-gray-500",
      iconBg: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
      buttonEdit: "text-gray-400 hover:text-[#0066A1] hover:bg-blue-50",
    };

  if (prefeituras.length === 0) {
    return (
      <div className={`rounded-xl border p-12 text-center ${styles.container}`}>
        <div className="flex flex-col items-center justify-center text-gray-500">
          <div
            className={
              isMaster
                ? "bg-white/5 p-4 rounded-full mb-4"
                : "bg-gray-50 p-4 rounded-full mb-4"
            }
          >
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <p className={`text-lg font-medium ${styles.text}`}>
            Nenhuma prefeitura encontrada
          </p>
          <p className={`text-sm mt-1 ${styles.subtext}`}>
            Tente ajustar sua pesquisa ou filtros
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${styles.container}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/10">
          <thead className={styles.header}>
            <tr>
              <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${styles.headerText} w-[140px] min-w-[230px] max-w-[230px]`}>
                Prefeitura
              </th>
              <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${styles.headerText} w-[230px] min-w-[230px] max-w-[230px]`}>
                Responsáveis
              </th>
              <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${styles.headerText} w-[120px] min-w-[120px] max-w-[120px] whitespace-normal`}>
                Status
              </th>
              <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${styles.headerText}`}>
                Consignados
              </th>
              <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${styles.headerText}`}>
                Comissão Franqueado
              </th>
              {!isFranqueado && (
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${styles.headerText}`}>
                  Comissão Master
                </th>
              )}
              <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${styles.headerText}`}>
                Cadastro
              </th>
              <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${styles.headerText}`}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/10">
            {prefeituras.map((prefeitura) => {
              const isMyAction = myActionIds?.has(prefeitura.id) ?? false;
              return (
                <tr
                  key={prefeitura.id}
                  className={cn(
                    "transition-colors group cursor-pointer",
                    styles.row,
                    selectedPrefeituraId === prefeitura.id && styles.rowSelected,
                    isMyAction && (isMaster
                      ? "border-l-4 border-l-yellow-400 bg-yellow-500/5"
                      : "border-l-4 border-l-yellow-500 bg-yellow-50/60"),
                  )}
                  onClick={() => {
                    if (onSelectPrefeitura) onSelectPrefeitura(prefeitura);
                    onManage(prefeitura);
                  }}
                >
                  <td className="px-6 py-4 w-[230px] min-w-[230px] max-w-[230px]">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${styles.iconBg}`}>
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className={`text-sm font-semibold truncate ${styles.text}`}>
                            {prefeitura.city}
                          </div>
                          {duplicatesMap && duplicatesMap[prefeitura.id] && (
                            <div title={`Atenção! Possível duplicidade com: ${duplicatesMap[prefeitura.id].join(', ')}`}>
                              <AlertTriangle className="w-4 h-4 text-orange-500 animate-pulse cursor-help" />
                            </div>
                          )}
                          {/* Sinalização de Decreto Pendente */}
                          {prefeitura.status === 'AGUARDANDO_DECRETO' && (
                            <div className="ml-2">
                              {prefeitura.files && prefeitura.files.length > 0 ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 border border-green-200">
                                  Anexo OK
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 border border-red-200 animate-pulse">
                                  Pendente Anexo
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={`text-[10px] flex items-center gap-1 leading-tight truncate ${styles.subtext}`}>
                          <span className="font-medium shrink-0">{prefeitura.state}</span>
                          <span>•</span>
                          <span className="truncate">{prefeitura.cnpj}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 w-[230px] min-w-[230px] max-w-[230px]">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs">
                        <span className={styles.subtext}>Master: </span>
                        <span className={`font-medium ${styles.text}`}>
                          {getEntityName(prefeitura.master)}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className={styles.subtext}>Franqueado: </span>
                        <span className={`font-medium ${styles.text}`}>
                          {getEntityName(prefeitura.franqueado)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 w-[120px] min-w-[120px] max-w-[120px] whitespace-normal">
                    {(() => {
                      const statusConfig =
                        statusMap[
                        prefeitura.status as keyof typeof statusMap
                        ] || statusMap.PENDING;
                      return (
                        statusConfig ?
                          <StatusBadge
                            label={statusConfig.label}
                            color={statusConfig.color}
                            className="whitespace-normal text-center"
                          /> : null
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${isMaster ? "text-[#00D9FF]" : "text-[#0066A1]"}`}>
                        {formatCurrency(
                          prefeitura.loans?.reduce(
                            (sum, l) =>
                              l.status === "PAID" ? sum + l.amount : sum,
                            0,
                          ) || 0,
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${styles.text}`}>
                        {(() => {
                          const totalPaid = prefeitura.loans?.reduce((sum, l) => l.status === "PAID" ? sum + l.amount : sum, 0) || 0;
                          const rate = typeof prefeitura.franqueado === 'object' && prefeitura.franqueado ? prefeitura.franqueado.commissionRate : 0;
                          const commission = totalPaid * (rate / 100);
                          return formatCurrency(commission);
                        })()}
                      </span>
                      <span className={`text-xs ${styles.subtext}`}>
                        {typeof prefeitura.franqueado === 'object' && prefeitura.franqueado ? `${prefeitura.franqueado.commissionRate}%` : '0%'}
                      </span>
                    </div>
                  </td>
                  {!isFranqueado && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${styles.text}`}>
                          {(() => {
                            const totalPaid = prefeitura.loans?.reduce((sum, l) => l.status === "PAID" ? sum + l.amount : sum, 0) || 0;
                            const rate = typeof prefeitura.master === 'object' && prefeitura.master ? prefeitura.master.commissionRate : 0;
                            const commission = totalPaid * (rate / 100);
                            return formatCurrency(commission);
                          })()}
                        </span>
                        <span className={`text-xs ${styles.subtext}`}>
                          {typeof prefeitura.master === 'object' && prefeitura.master ? `${prefeitura.master.commissionRate}%` : '0%'}
                        </span>
                      </div>
                    </td>
                  )}
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${styles.subtext}`}>
                    {prefeitura.createdAt
                      ? new Date(prefeitura.createdAt).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(prefeitura)}
                          className={styles.buttonEdit}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onManage(prefeitura)}
                        className={styles.buttonEdit}
                        title="Ver Detalhes"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
