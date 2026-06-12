
import React, { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreHorizontal,
    Plus,
    Search,
    Pencil,
    Trash2,
    UserCheck,
    UserX,
    ShieldAlert,
    Loader2,
    Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { UserFormModal } from "./UserFormModal";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface User {
    id: string;
    name: string;
    email: string;
    type: string;
    status: string;
    createdAt: string;
}

export function UsersTab() {
    const { user } = useAuth(); // Usuário logado atual
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToResend, setUserToResend] = useState<User | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/users");
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                toast.error("Falha ao carregar usuários");
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = () => {
        setUserToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const handleDelete = (user: User) => {
        setUserToDelete(user);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        try {
            const response = await fetch(`/api/users/${userToDelete.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Erro ao excluir");
            }

            toast.success("Usuário excluído com sucesso");
            fetchUsers();
            setUserToDelete(null); // Close modal
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleResendAccess = (user: User) => {
        setUserToResend(user);
    };

    const confirmResendAccess = async () => {
        if (!userToResend) return;

        try {
            const response = await fetch(`/api/users/${userToResend.id}/resend-access`, {
                method: "POST",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Erro ao reenviar acesso");
            }

            toast.success("Credenciais reenviadas com sucesso");
            setUserToResend(null); // Close modal
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const filteredUsers = users.filter(
        (u) =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "ADMIN":
                return <Badge className="bg-purple-500/15 text-purple-600 hover:bg-purple-500/25 border-0">Admin</Badge>;
            case "MASTER":
                return <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-0">Master</Badge>;
            case "FRANQUEADO":
                return <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/25 border-0">Franqueado</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return <UserCheck className="h-4 w-4 text-green-500" />;
            case "INACTIVE":
                return <UserX className="h-4 w-4 text-gray-400" />;
            case "BLOCKED":
                return <ShieldAlert className="h-4 w-4 text-red-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou email..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="text-sm text-muted-foreground hidden sm:block">
                        Total: <span className="font-medium text-foreground">{filteredUsers.length}</span>
                    </div>
                    <Button onClick={handleCreate} className="w-full sm:w-auto gap-2">
                        <Plus className="h-4 w-4" /> Novo Administrador
                    </Button>
                </div>
            </div>

            <div className="text-sm text-muted-foreground sm:hidden">
                Total: <span className="font-medium text-foreground">{filteredUsers.length}</span>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Nenhum usuário encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium">{u.name}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>{getTypeBadge(u.type)}</TableCell>
                                    <TableCell className="flex items-center gap-2">
                                        {getStatusIcon(u.status)}
                                        <span className="text-sm capitalize text-muted-foreground">
                                            {u.status === "ACTIVE" ? "Ativo" : u.status === "INACTIVE" ? "Inativo" : "Bloqueado"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(u)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                {user?.id !== u.id && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleResendAccess(u)}>
                                                            <Send className="mr-2 h-4 w-4" /> Reenviar Acesso
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => handleDelete(u)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchUsers}
                userToEdit={userToEdit}
            />

            <ConfirmDialog
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={confirmDelete}
                title="Excluir Usuário"
                description={`Tem certeza que deseja excluir o usuário ${userToDelete?.name}? Essa ação não pode ser desfeita.`}
                confirmText="Excluir"
                variant="destructive"
            />

            <ConfirmDialog
                isOpen={!!userToResend}
                onClose={() => setUserToResend(null)}
                onConfirm={confirmResendAccess}
                title="Reenviar Acesso"
                description={`Tem certeza que deseja reenviar o acesso para o usuário ${userToResend?.name}? Isso irá gerar uma nova senha e enviar para o email cadastrado.`}
                confirmText="Reenviar"
            />
        </div>
    );
}
