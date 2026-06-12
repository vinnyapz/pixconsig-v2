
import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface User {
    id: string;
    name: string;
    email: string;
    type: string; // 'ADMIN' | 'MASTER' | 'FRANQUEADO'
    status: string; // 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
}

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userToEdit?: User | null;
}

export function UserFormModal({
    isOpen,
    onClose,
    onSuccess,
    userToEdit,
}: UserFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        type: "MASTER",
        status: "ACTIVE",
        sendEmail: false,
    });

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                name: userToEdit.name,
                email: userToEdit.email,
                password: "", // Senha sempre vazia na edição
                type: userToEdit.type,
                status: userToEdit.status,
                sendEmail: false,
            });
        } else {
            // Reset form for create
            setFormData({
                name: "",
                email: "",
                password: "",
                type: "ADMIN",
                status: "ACTIVE",
                sendEmail: true,
            });
        }
    }, [userToEdit, isOpen]);

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        let password = "";
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData((prev) => ({ ...prev, password }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const isEdit = !!userToEdit;
            const url = isEdit ? `/api/users/${userToEdit.id}` : "/api/users";
            const method = isEdit ? "PUT" : "POST";

            // Validar senha na criação
            if (!isEdit && !formData.password) {
                toast.error("Senha é obrigatória para novos usuários");
                setLoading(false);
                return;
            }

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erro ao salvar usuário");
            }

            toast.success(
                isEdit ? "Usuário atualizado com sucesso!" : "Usuário criado com sucesso!"
            );
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {userToEdit ? "Editar Usuário" : "Novo Usuário"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                            id="name"
                            placeholder="Ex: João da Silva"
                            required
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Ex: joao@email.com"
                            required
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">
                            {userToEdit ? "Nova Senha (opcional)" : "Senha"}
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="password"
                                type="text"
                                placeholder={
                                    userToEdit
                                        ? "Deixe em branco para manter a atual"
                                        : "Mínimo 6 caracteres"
                                }
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={generatePassword}
                                title="Gerar senha aleatória"
                                className="whitespace-nowrap"
                            >
                                Gerar Senha
                            </Button>
                        </div>
                    </div>


                    {!userToEdit && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="sendEmail"
                                checked={formData.sendEmail}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, sendEmail: checked as boolean })
                                }
                            />
                            <Label
                                htmlFor="sendEmail"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Enviar credenciais por e-mail
                            </Label>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo de Usuário</Label>
                            <Input
                                id="type"
                                value={
                                    formData.type === 'ADMIN' ? 'Administrador' :
                                        formData.type === 'FRANQUEADO' ? 'Franqueado' :
                                            formData.type === 'MASTER' ? 'Master' :
                                                formData.type
                                }
                                readOnly
                                disabled
                                className="bg-muted opacity-100" // opacity-100 to make text readable even if disabled
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(val) =>
                                    setFormData({ ...formData, status: val })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                                    <SelectItem value="BLOCKED">Bloqueado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {userToEdit ? "Salvar Alterações" : "Criar Usuário"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}
