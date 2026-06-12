import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loan } from "@/types/prefeitura";

interface ConsignadoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  prefeituraId?: string;
  loanToEdit?: Loan | null;
}

export function ConsignadoForm({
  isOpen,
  onClose,
  onSave,
  prefeituraId,
  loanToEdit,
}: ConsignadoFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    type: "SERVIDOR",
    status: "PENDING",
    date: new Date().toISOString().split("T")[0],
    observations: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (loanToEdit) {
        setFormData({
          amount: new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(loanToEdit.amount),
          type: loanToEdit.type || loanToEdit.loanType || "SERVIDOR",
          status: loanToEdit.status,
          date: loanToEdit.date
            ? new Date(loanToEdit.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          observations: loanToEdit.observations || "",
        });
      } else {
        setFormData({
          amount: "",
          type: "SERVIDOR",
          status: "PENDING",
          date: new Date().toISOString().split("T")[0],
          observations: "",
        });
      }
    }
  }, [isOpen, loanToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefeituraId && !loanToEdit?.prefeituraId) return;

    setLoading(true);
    try {
      await onSave({
        ...formData,
        id: loanToEdit?.id,
        amount: parseFloat(formData.amount.replace(/\D/g, "")) / 100,
        prefeituraId: prefeituraId || loanToEdit?.prefeituraId,
      });
    } catch (error) {
      console.error("Error saving loan:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={loanToEdit ? "Editar Consignado" : "Novo Consignado"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input
            id="amount"
            type="text"
            required
            value={formData.amount}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              const amount = parseFloat(value) / 100;
              setFormData({
                ...formData,
                amount: new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(isNaN(amount) ? 0 : amount),
              });
            }}
            placeholder="R$ 0,00"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SERVIDOR">Servidor</SelectItem>
                <SelectItem value="CONTRATADO">Contratado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pendente</SelectItem>
              <SelectItem value="PAID">Pago</SelectItem>
              <SelectItem value="REJECTED">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observations">Observações</Label>
          <Textarea
            id="observations"
            value={formData.observations}
            onChange={(e) =>
              setFormData({ ...formData, observations: e.target.value })
            }
            placeholder="Detalhes adicionais..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#0066A1] hover:bg-[#005585]"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
