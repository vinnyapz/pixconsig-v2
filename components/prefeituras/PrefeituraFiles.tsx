import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Trash2, Download, Link as LinkIcon, Plus } from 'lucide-react';
import { Prefeitura, PrefeituraFile } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface PrefeituraFilesProps {
    prefeitura: Prefeitura;
    isMaster: boolean;
    onFilesChange: () => void;
}

export function PrefeituraFiles({ prefeitura, isMaster, onFilesChange }: PrefeituraFilesProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [localFiles, setLocalFiles] = useState<PrefeituraFile[]>(prefeitura.files || []);

    useEffect(() => {
        setLocalFiles(prefeitura.files || []);
    }, [prefeitura.files]);

    // Link state
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkName, setLinkName] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [isSavingLink, setIsSavingLink] = useState(false);

    // Delete confirm state
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            handleUpload(droppedFiles[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (file: File) => {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
            toast.error('Tipo de arquivo não permitido. Use PDF, JPEG, PNG ou DOCX.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Arquivo muito grande. Máximo 10MB.');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`/api/prefeituras/${prefeitura.id}/files`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao enviar arquivo');
            }

            const newFile = await response.json();
            setLocalFiles(prev => [newFile, ...prev]);
            toast.success('Arquivo enviado com sucesso!');
            onFilesChange();
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao enviar arquivo');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSaveLink = async () => {
        if (!linkName || !linkUrl) {
            toast.error('Preencha nome e URL');
            return;
        }

        setIsSavingLink(true);
        try {
            // Normalizar URL (garantir que comece com http:// ou https://)
            let normalizedUrl = linkUrl.trim();
            if (!/^https?:\/\//i.test(normalizedUrl)) {
                normalizedUrl = `https://${normalizedUrl}`;
            }

            const response = await fetch(`/api/prefeituras/${prefeitura.id}/files`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: linkName,
                    url: normalizedUrl,
                    type: 'LINK',
                    size: 0
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao salvar link');
            }

            const newLink = await response.json();
            setLocalFiles(prev => [newLink, ...prev]);
            toast.success('Link adicionado!');
            setLinkName('');
            setLinkUrl('');
            setIsLinkModalOpen(false);
            onFilesChange();
        } catch (error) {
            toast.error('Erro ao salvar link');
        } finally {
            setIsSavingLink(false);
        }
    };

    const confirmDelete = async () => {
        if (!fileToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/prefeituras/${prefeitura.id}/files/${fileToDelete}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir item');
            }

            setLocalFiles(prev => prev.filter(f => f.id !== fileToDelete));
            toast.success('Item excluído com sucesso!');
            onFilesChange();
        } catch (error) {
            console.error('Error deleting file:', error);
            toast.error('Erro ao excluir item');
        } finally {
            setIsDeleting(false);
            setFileToDelete(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return 'Link Externo'; // Para links
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "flex-1 border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer relative",
                        isMaster
                            ? "border-[#4A5568] hover:border-[#00D9FF] hover:bg-[#00D9FF]/5"
                            : "border-gray-300 hover:border-[#0066A1] hover:bg-blue-50/30",
                        isDragging && (isMaster ? "border-[#00D9FF] bg-[#00D9FF]/10" : "border-[#0066A1] bg-blue-50"),
                        isUploading && "opacity-50 pointer-events-none"
                    )}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.jpg,.jpeg,.png,.docx"
                    />

                    {isUploading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-[#0066A1] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Upload className={cn("w-6 h-6", isMaster ? "text-[#00D9FF]" : "text-[#0066A1]")} />
                            <div>
                                <h4 className={cn("font-medium text-sm", isMaster ? "text-[#E5E4E2]" : "text-gray-900")}>
                                    Enviar Arquivo
                                </h4>
                                <p className={cn("text-xs opacity-70", isMaster ? "text-[#C0C0C0]" : "text-gray-500")}>
                                    Arraste ou clique
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div
                    onClick={() => setIsLinkModalOpen(true)}
                    className={cn(
                        "flex-1 border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-2",
                        isMaster
                            ? "border-[#4A5568] hover:border-[#00D9FF] hover:bg-[#00D9FF]/5"
                            : "border-gray-300 hover:border-[#0066A1] hover:bg-blue-50/30"
                    )}
                >
                    <LinkIcon className={cn("w-6 h-6", isMaster ? "text-[#00D9FF]" : "text-[#0066A1]")} />
                    <div>
                        <h4 className={cn("font-medium text-sm", isMaster ? "text-[#E5E4E2]" : "text-gray-900")}>
                            Adicionar Link
                        </h4>
                        <p className={cn("text-xs opacity-70", isMaster ? "text-[#C0C0C0]" : "text-gray-500")}>
                            Drive, Dropbox, etc.
                        </p>
                    </div>
                </div>
            </div>

            <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Link Externo</DialogTitle>
                        <DialogDescription>Cole o link para documentos no Google Drive, Dropbox ou outros.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome do Link</Label>
                            <Input id="name" value={linkName} onChange={e => setLinkName(e.target.value)} placeholder="Ex: Pasta de Documentos" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="url">URL</Label>
                            <Input id="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLinkModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveLink} disabled={isSavingLink}>Salvar Link</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div>
                <h3 className={cn("text-sm font-medium mb-3", isMaster ? "text-[#E5E4E2]" : "text-gray-900")}>
                    Arquivos e Links ({localFiles.length})
                </h3>
                {localFiles.length === 0 ? (
                    <p className={cn("text-sm", isMaster ? "text-[#C0C0C0]" : "text-gray-500")}>
                        Nenhum item adicionado
                    </p>
                ) : (
                    <div className="space-y-2">
                        {localFiles.map((file) => (
                            <div
                                key={file.id}
                                className={cn(
                                    "p-3 rounded-lg border flex items-center justify-between group",
                                    isMaster ? "bg-[#1c1c1e] border-[#4A5568]/50" : "bg-white border-gray-200"
                                )}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={cn("p-2 rounded", isMaster ? "bg-[#2d2d30]" : "bg-gray-100")}>
                                        {file.type === 'LINK' ? (
                                            <LinkIcon className={cn("w-5 h-5", isMaster ? "text-[#00D9FF]" : "text-blue-600")} />
                                        ) : (
                                            <FileText className={cn("w-5 h-5", isMaster ? "text-[#00D9FF]" : "text-blue-600")} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={cn("text-sm font-medium truncate", isMaster ? "text-[#E5E4E2]" : "text-gray-900")} title={file.name}>
                                            {file.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs">
                                            <p className={isMaster ? "text-[#C0C0C0]" : "text-gray-500"}>
                                                {new Date(file.uploadDate).toLocaleDateString("pt-BR")}
                                            </p>
                                            <span className={isMaster ? "text-[#4A5568]" : "text-gray-300"}>•</span>
                                            <p className={isMaster ? "text-[#C0C0C0]" : "text-gray-500"}>
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn("p-2 rounded-md transition-colors", isMaster ? "hover:bg-[#2d2d30] text-[#C0C0C0] hover:text-[#E5E4E2]" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900")}
                                        title={file.type === 'LINK' ? "Abrir Link" : "Baixar/Visualizar"}
                                    >
                                        {file.type === 'LINK' ? <LinkIcon className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                    </a>
                                    <button
                                        onClick={() => setFileToDelete(file.id)}
                                        className={cn("p-2 rounded-md transition-colors", isMaster ? "hover:bg-red-900/20 text-[#C0C0C0] hover:text-red-400" : "hover:bg-red-50 text-gray-500 hover:text-red-600")}
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={!!fileToDelete}
                onClose={() => setFileToDelete(null)}
                onConfirm={confirmDelete}
                title="Excluir Anexo"
                description="Tem certeza que deseja excluir este anexo? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                variant="destructive"
                theme={isMaster ? "dark" : "default"}
                loading={isDeleting}
            />
        </div>
    );
}
