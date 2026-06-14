import React, { useState } from "react";
import {
  Building2,
  CreditCard,
  FileText,
  User,
  Settings,
  Trash2,
  Info,
  Briefcase,
  Plus,
  Pencil,
  Upload,
  MessageSquare,
  FileCheck2,
  Calendar,
  Send,
  X,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { WorkflowActions } from "./WorkflowActions";
import { PrefeituraMessages } from "./PrefeituraMessages";
import { FollowUpTab } from "./FollowUpTab";

import { Prefeitura, Loan } from "@/types/prefeitura";
import { PrefeituraFiles } from "./PrefeituraFiles";
import { StatusBadge } from "@/components/common/StatusBadge";

import { Drawer, DrawerTabs, DrawerCard } from "@/components/common/Drawer";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { UserType } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrefeituraDetailsProps {
  prefeitura: Prefeitura | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (prefeitura: Prefeitura) => void;
  onDelete?: (id: string) => void;
  onAddLoan?: (prefeituraId: string) => void;
  onEditLoan?: (loan: Loan) => void;
  onDeleteLoan?: (loanId: string) => void;
  userType?: UserType;
  onFilesChange?: () => void;
  onStatusChange?: () => void;
}

export function PrefeituraDetails({
  prefeitura,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAddLoan,
  onEditLoan,
  onDeleteLoan,
  userType,
  onFilesChange,
  onStatusChange,
}: PrefeituraDetailsProps) {
  const [activeTab, setActiveTab] = useState<"info" | "loans" | "files" | "messages" | "followups">(
    "info",
  );
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgTarget, setMsgTarget] = useState<"franqueado" | "master" | "ambos">("franqueado");

  const handleSendDirectMessage = async () => {
    if (!msgSubject.trim() || !msgBody.trim()) {
      toast.error("Preencha o assunto e a mensagem");
      return;
    }
    setSendingMsg(true);
    try {
      const res = await fetch("/api/mensagem-direta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefeituraId: displayPrefeitura?.id,
          subject: msgSubject,
          message: msgBody,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao enviar");
      }
      const data = await res.json();
      const names = data.sentTo.map((r: any) => `${r.name} (${r.role})`).join(", ");
      toast.success(`Mensagem enviada para: ${names}`);
      setShowMsgModal(false);
      setMsgSubject("");
      setMsgBody("");
      setMsgTarget("franqueado");
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar mensagem");
    } finally {
      setSendingMsg(false);
    }
  };

  const isMaster = userType === "master";
  const [cachedPrefeitura, setCachedPrefeitura] = useState<Prefeitura | null>(
    prefeitura,
  );
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab("info");
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (prefeitura) {
      setCachedPrefeitura(prefeitura);
    }
  }, [prefeitura]);

  const displayPrefeitura = prefeitura || cachedPrefeitura;

  if (!displayPrefeitura) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(displayPrefeitura);
    }
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      setIsDeleteConfirmOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (onDelete && displayPrefeitura) {
      onDelete(displayPrefeitura.id);
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`${displayPrefeitura.city} - ${displayPrefeitura.state}`}
        subtitle={displayPrefeitura.cnpj ?? undefined}
        size="lg"
        headerActions={
        <div className="flex items-center gap-1">
          {(userType === "admin" || userType === "superadmin") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMsgModal(true)}
              title="Enviar mensagem direta ao responsável"
              className={cn(
                isMaster
                  ? "hover:bg-white/5 text-[#C0C0C0] hover:text-[#00D9FF]"
                  : "hover:bg-blue-50 text-gray-600 hover:text-blue-600",
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            title="Editar Prefeitura"
            className={cn(
              isMaster
                ? "hover:bg-white/5 text-[#C0C0C0] hover:text-[#E5E4E2]"
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-900",
            )}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteClick}
            className={cn(
              isMaster
                ? "hover:bg-red-500/10 text-[#C0C0C0] hover:text-red-400"
                : "hover:bg-red-50 text-gray-600 hover:text-red-600",
            )}
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
            icon: <Info className="w-4 h-4" />,
          },
          ...(userType === "admin"
            ? [
              {
                id: "loans",
                label: "Consignados",
                icon: <CreditCard className="w-4 h-4" />,
              },
            ]
            : []),
          {
            id: "files",
            label: "Arquivos",
            icon: <FileText className="w-4 h-4" />,
          },
          {
            id: "messages",
            label: "Mensagens",
            icon: <MessageSquare className="w-4 h-4" />,
          },
          {
            id: "followups",
            label: "Follow-ups ✨",
            icon: <Calendar className="w-4 h-4" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
      />

      <div className="p-6 space-y-6">
        {onStatusChange && (
          <WorkflowActions
            prefeitura={displayPrefeitura}
            isMaster={userType === 'master'}
            onStatusChange={onStatusChange}
          />
        )}

        {displayPrefeitura.status === 'REPROVADA' && displayPrefeitura.rejectionReason && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-800">Motivo da Reprovação</h4>
              <p className="text-sm text-red-700 mt-1">{displayPrefeitura.rejectionReason}</p>
            </div>
          </div>
        )}

        {activeTab === "info" && (
          <InfoTab prefeitura={displayPrefeitura} isMaster={isMaster} />
        )}
        {activeTab === "loans" && userType === "admin" && (
          <LoansTab
            prefeitura={displayPrefeitura}
            isMaster={isMaster}
            onAddLoan={() => onAddLoan?.(displayPrefeitura.id)}
            onEditLoan={onEditLoan}
            onDeleteLoan={onDeleteLoan}
          />
        )}
        {activeTab === "files" && (
          <PrefeituraFiles
            prefeitura={displayPrefeitura}
            isMaster={isMaster}
            onFilesChange={onFilesChange || (() => { })}
          />
        )}
        {activeTab === "messages" && (
          <PrefeituraMessages
            prefeitura={displayPrefeitura}
            isMaster={isMaster}
          />
        )}
        {activeTab === "followups" && (
          <FollowUpTab prefeituraId={displayPrefeitura.id} />
        )}
      </div>

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Prefeitura"
        description={
          <span>
            Tem certeza que deseja excluir a prefeitura de <strong>{displayPrefeitura.city}</strong>?
            <br />
            Esta ação não pode ser desfeita.
          </span>
        }
        confirmText="Excluir"
        variant="destructive"
        theme={isMaster ? "dark" : "default"}
      />
    </Drawer>

      {/* Mini modal de mensagem direta */}
      {showMsgModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMsgModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base">Mensagem Direta</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Será enviada ao Master e/ou Franqueado responsável por{" "}
                  <strong>{displayPrefeitura.city} - {displayPrefeitura.state}</strong>
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowMsgModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Enviar para</Label>
                <div className="flex gap-2">
                  {(["franqueado", "master", "ambos"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setMsgTarget(t)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        msgTarget === t
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t === "franqueado" ? "🏪 Franqueado" : t === "master" ? "🏆 Master" : "👥 Ambos"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Assunto</Label>
                <Input
                  placeholder="Ex: Pendência de documentação"
                  value={msgSubject}
                  onChange={e => setMsgSubject(e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mensagem</Label>
                <Textarea
                  placeholder="Detalhe o aviso, cobrança ou instrução..."
                  value={msgBody}
                  onChange={e => setMsgBody(e.target.value)}
                  rows={5}
                  className="resize-none text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowMsgModal(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleSendDirectMessage}
                disabled={sendingMsg || !msgSubject.trim() || !msgBody.trim()}
              >
                {sendingMsg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sendingMsg ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoTab({
  prefeitura,
  isMaster,
}: {
  prefeitura: Prefeitura;
  isMaster: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DrawerCard
          icon={<User className="h-5 w-5" />}
          label="Master"
          value={
            typeof prefeitura.master === "string"
              ? prefeitura.master
              : prefeitura.master?.name || "Não vinculado"
          }
        />
        <DrawerCard
          icon={<Briefcase className="h-5 w-5" />}
          label="Franqueado"
          value={
            typeof prefeitura.franqueado === "string"
              ? prefeitura.franqueado
              : prefeitura.franqueado?.name || "Não vinculado"
          }
        />
        <DrawerCard
          icon={<CreditCard className="h-5 w-5" />}
          label="Total Emprestado"
          value={`R$ ${(prefeitura.loans?.reduce((sum, l) => sum + l.amount, 0) || 0).toLocaleString("pt-BR")}`}
        />
      </div>

      <div
        className={`p-4 rounded-lg border ${isMaster
          ? "bg-[#1c1c1e] border-[#4A5568]/50"
          : "bg-white border-gray-200"
          }`}
      >
        <h3
          className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isMaster ? "text-[#E5E4E2]" : "text-gray-900"
            }`}
        >
          <Building2 className="w-4 h-4" />
          Informações Gerais
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className={`text-xs ${isMaster ? "text-[#C0C0C0]" : "text-gray-500"}`}>Prefeito(a)</p>
            <p className={`font-medium ${isMaster ? "text-[#E5E4E2]" : "text-gray-900"}`}>{prefeitura.mayorName || "Não informado"}</p>
          </div>
          <div>
            <p className={`text-xs ${isMaster ? "text-[#C0C0C0]" : "text-gray-500"}`}>População</p>
            <p className={`font-medium ${isMaster ? "text-[#E5E4E2]" : "text-gray-900"}`}>{prefeitura.population?.toLocaleString("pt-BR") || "Não informado"}</p>
          </div>
          <div className="col-span-2">
            <p className={`text-xs ${isMaster ? "text-[#C0C0C0]" : "text-gray-500"}`}>Endereço</p>
            <p className={`font-medium ${isMaster ? "text-[#E5E4E2]" : "text-gray-900"}`}>{prefeitura.address || "Não informado"}</p>
          </div>
          <div>
            <p className={`text-xs ${isMaster ? "text-[#C0C0C0]" : "text-gray-500"}`}>CEP</p>
            <p className={`font-medium ${isMaster ? "text-[#E5E4E2]" : "text-gray-900"}`}>{prefeitura.zipCode || "Não informado"}</p>
          </div>
          <div>
            <p className={`text-xs ${isMaster ? "text-[#C0C0C0]" : "text-gray-500"}`}>Status</p>
            <StatusBadge status={prefeitura.status} variant={isMaster ? "modern" : "default"} />
          </div>
        </div>
      </div>

      <div
        className={`p-4 rounded-lg border ${isMaster
          ? "bg-[#1c1c1e] border-[#4A5568]/50"
          : "bg-white border-gray-200"
          }`}
      >
        <h3
          className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isMaster ? "text-[#E5E4E2]" : "text-gray-900"
            }`}
        >
          <User className="w-4 h-4" />
          Informações de Contato
        </h3>

        <div className="grid grid-cols-1 gap-4 text-sm">
          <div>
            <p className={`text-xs ${isMaster ? "text-[#C0C0C0]" : "text-gray-500"}`}>Nome do Responsável</p>
            <p className={`font-medium ${isMaster ? "text-[#E5E4E2]" : "text-gray-900"}`}>{prefeitura.contactName || "Não informado"}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-xs ${isMaster ? "text-[#C0C0C0]" : "text-gray-500"}`}>Email</p>
              <p className={`font-medium ${isMaster ? "text-[#E5E4E2]" : "text-gray-900"}`}>{prefeitura.contactEmail || "Não informado"}</p>
            </div>
            <div>
              <p className={`text-xs ${isMaster ? "text-[#C0C0C0]" : "text-gray-500"}`}>Telefone</p>
              <p className={`font-medium ${isMaster ? "text-[#E5E4E2]" : "text-gray-900"}`}>{prefeitura.contactPhone || "Não informado"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoansTab({
  prefeitura,
  isMaster,
  onAddLoan,
  onEditLoan,
  onDeleteLoan,
}: {
  prefeitura: Prefeitura;
  isMaster: boolean;
  onAddLoan?: () => void;
  onEditLoan?: (loan: Loan) => void;
  onDeleteLoan?: (loanId: string) => void;
}) {
  const loans = prefeitura.loans || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${isMaster ? "text-[#E5E4E2]" : "text-gray-900"}`}>
          Histórico de Consignados ({loans.length})
        </h3>
        <Button
          onClick={onAddLoan}
          size="sm"
          className={cn(isMaster ? "bg-[#00D9FF] text-[#1c1c1e] hover:bg-[#00A8CC]" : "bg-[#0066A1] text-white hover:bg-[#005585]")}
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo Consignado
        </Button>
      </div>

      <div className="space-y-3">
        {loans.length === 0 ? (
          <div className={`text-center py-8 text-sm ${isMaster ? "text-[#C0C0C0]" : "text-gray-500"}`}>
            Nenhum empréstimo registrado
          </div>
        ) : (
          loans.map((loan) => (
            <div
              key={loan.id}
              className={`p-4 rounded-lg border flex items-center justify-between ${isMaster ? "bg-[#1c1c1e] border-[#4A5568]/50" : "bg-white border-gray-200"}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${(loan.type || loan.loanType)?.toUpperCase() === "SERVIDOR" ? (isMaster ? "bg-[#00D9FF]/10 text-[#00D9FF]" : "bg-blue-50 text-blue-600") : (isMaster ? "bg-purple-500/20 text-purple-400" : "bg-purple-50 text-purple-600")}`}>
                  {(loan.type || loan.loanType)?.toUpperCase() === "SERVIDOR" ? <User className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <p className={`font-semibold ${isMaster ? "text-[#E5E4E2]" : "text-gray-900"}`}>R$ {loan.amount.toLocaleString("pt-BR")}</p>
                  <div className={`flex items-center gap-2 text-xs ${isMaster ? "text-[#C0C0C0]" : "text-gray-500"}`}>
                    <span>{new Date(loan.date).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={loan.status} variant={isMaster ? "modern" : "default"} />
                <div className="flex gap-1">
                  {onEditLoan && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditLoan(loan)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {onDeleteLoan && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDeleteLoan(loan.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
