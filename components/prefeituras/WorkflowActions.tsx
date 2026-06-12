import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Prefeitura } from '@/types/prefeitura';
import { useAuth } from '@/contexts/AuthContext';

interface WorkflowActionsProps {
    prefeitura: Prefeitura;
    isMaster: boolean;
    onStatusChange: () => void;
}

export function WorkflowActions({ prefeitura, isMaster, onStatusChange }: WorkflowActionsProps) {
    const { user, userType } = useAuth();
    const [loading, setLoading] = useState(false);

    // States para modais
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const [duplicateOpen, setDuplicateOpen] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState('');
    const [pendingApprovalAction, setPendingApprovalAction] = useState<(() => void) | null>(null);

    // Mapeamento de ações - UserTypes em lowercase conforme AuthContext
    const canApprove = userType === 'admin' && prefeitura.status === 'AGUARDANDO_ANALISE';
    const canReject = userType === 'admin' && prefeitura.status === 'AGUARDANDO_ANALISE';
    const canSendDecree = userType === 'franqueado' && prefeitura.status === 'AGUARDANDO_DECRETO';
    const canFinalize = userType === 'admin' && prefeitura.status === 'PROCESSO_EM_ANDAMENTO';

    if (!canApprove && !canReject && !canSendDecree && !canFinalize) {
        return null;
    }

    // Validação de arquivo para envio de decreto
    const hasFiles = prefeitura.files && prefeitura.files.length > 0;

    const performAction = async (action: string, reason?: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/prefeituras/${prefeitura.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, rejectionReason: reason }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro na ação');
            }

            toast.success('Status atualizado com sucesso!');

            if (data.warning) {
                toast.warning(data.warning);
            }

            onStatusChange();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
            setRejectOpen(false);
            setDuplicateOpen(false);
        }
    };

    const handleApproveClick = async () => {
        // Verificar duplicidade antes
        setLoading(true);
        try {
            const response = await fetch(`/api/prefeituras/check-duplicate?cnpj=${prefeitura.cnpj || ''}&city=${prefeitura.city}`);
            const data = await response.json();

            if (data.duplicates && data.duplicates.length > 0) {
                const names = data.duplicates.map((d: any) => `${d.city} (${d.status})`).join(', ');
                setDuplicateWarning(`Atenção: Já existem prefeituras similares nas fases avançadas: ${names}. Deseja continuar?`);
                setDuplicateOpen(true);
                setPendingApprovalAction(() => () => performAction('APROVAR'));
                return;
            }

            // Se não houver duplicatas, aprovar direto
            await performAction('APROVAR');
        } catch (e) {
            console.error("Erro check duplicate", e);
            await performAction('APROVAR');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-wrap gap-2 mb-4 p-4 bg-muted/20 rounded-lg border border-border">
            {canApprove && (
                <Button
                    onClick={handleApproveClick}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    <Check className="w-4 h-4 mr-2" />
                    Aprovar Cadastro
                </Button>
            )}

            {canReject && (
                <Button
                    variant="destructive"
                    onClick={() => setRejectOpen(true)}
                    disabled={loading}
                >
                    <X className="w-4 h-4 mr-2" />
                    Reprovar
                </Button>
            )}

            {canSendDecree && (
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                    {!hasFiles ? (
                        <div className="flex items-center gap-2 p-3 bg-orange-50 text-orange-800 border-l-4 border-orange-500 rounded text-sm mb-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>
                                <strong>Ação Necessária:</strong> Anexe o arquivo do Decreto ou Link na aba "Arquivos" para prosseguir.
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 p-2 bg-green-50 text-green-700 border border-green-200 rounded text-xs mb-2">
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            <span>Arquivo identificado. Pronto para envio.</span>
                        </div>
                    )}

                    <Button
                        onClick={() => performAction('ENVIAR_DECRETO')}
                        disabled={loading || !hasFiles}
                        className={cn(
                            "relative transition-all",
                            hasFiles
                                ? "bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200 animate-pulse"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        )}
                        size={hasFiles ? "lg" : "default"}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        {hasFiles ? "Enviar Decreto e Avançar" : "Aguardando Anexo..."}
                    </Button>
                </div>
            )}

            {canFinalize && (
                <Button
                    onClick={() => performAction('FINALIZAR')}
                    disabled={loading}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalizar Processo
                </Button>
            )}

            {/* Modal de Reprovação */}
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reprovar Prefeitura</DialogTitle>
                        <DialogDescription>
                            Informe o motivo da reprovação. O franqueado poderá ver esta mensagem.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="reason">Motivo</Label>
                            <Textarea
                                id="reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Ex: Documentação incompleta..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
                        <Button
                            variant="destructive"
                            onClick={() => performAction('REPROVAR', rejectionReason)}
                            disabled={!rejectionReason.trim() || loading}
                        >
                            Confirmar Reprovação
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Alerta de Duplicidade */}
            <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-yellow-600">
                            <AlertTriangle className="w-5 h-5" />
                            Potencial Duplicidade Detectada
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            {duplicateWarning}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDuplicateOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={() => pendingApprovalAction && pendingApprovalAction()}
                            disabled={loading}
                        >
                            Confirmar Mesmo Assim
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
