"use client";
import React, { useState, useRef } from "react";
import { Upload, FileText, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  type: string;
}

interface FileUploadProps {
  files?: UploadedFile[];
  onUpload?: (files: File[]) => void;
  onDelete?: (fileId: string) => void;
  onDownload?: (fileId: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  showFileList?: boolean;
  userType?: "superadmin" | "admin" | "master" | "franqueado";
}

export function FileUpload({
  files = [],
  onUpload,
  onDelete,
  onDownload,
  maxFiles = 10,
  maxSizeMB = 10,
  acceptedTypes = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"],
  showFileList = true,
  userType = "franqueado",
}: FileUploadProps) {
  const isMaster = userType === "master";
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const styles = isMaster
    ? {
        dropzone: `border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? "border-[#00D9FF] bg-[#00D9FF]/5" : "border-[#4A5568]/50 hover:border-[#00D9FF]/50"}`,
        icon: "h-10 w-10 mx-auto mb-3 text-[#C0C0C0]",
        title: "text-sm font-medium text-[#E5E4E2] mb-1",
        subtitle: "text-xs text-[#C0C0C0] mb-4",
        button:
          "px-4 py-2 bg-[#00D9FF] text-[#1c1c1e] text-sm font-medium rounded-lg hover:bg-[#00A8CC] transition-colors",
        listTitle: "text-sm font-semibold text-[#E5E4E2]",
        item: "flex items-center justify-between p-3 bg-white/5 rounded-lg border border-[#4A5568]/30 hover:bg-white/10 transition-colors",
        itemName: "text-sm font-medium text-[#E5E4E2] truncate",
        itemMeta: "text-xs text-[#C0C0C0]",
        itemIcon: "text-[#C0C0C0]",
        actionButton:
          "p-2 text-[#C0C0C0] hover:text-[#00D9FF] hover:bg-white/5 rounded-lg transition-colors",
        deleteButton:
          "p-2 text-[#C0C0C0] hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors",
      }
    : {
        dropzone: `border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? "border-[#0066A1] bg-blue-50" : "border-gray-300 hover:border-gray-400"}`,
        icon: "h-10 w-10 mx-auto mb-3 text-gray-400",
        title: "text-sm font-medium text-gray-900 mb-1",
        subtitle: "text-xs text-gray-500 mb-4",
        button:
          "px-4 py-2 bg-[#0066A1] text-white text-sm rounded-lg hover:bg-[#005585] transition-colors",
        listTitle: "text-sm font-semibold text-gray-900",
        item: "flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors",
        itemName: "text-sm font-medium text-gray-900 truncate",
        itemMeta: "text-xs text-gray-500",
        itemIcon: "text-gray-600",
        actionButton:
          "p-2 text-gray-400 hover:text-[#0066A1] hover:bg-white rounded-lg transition-colors",
        deleteButton:
          "p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors",
      };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

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
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (selectedFiles: File[]) => {
    // Validate file count
    if (files.length + selectedFiles.length > maxFiles) {
      alert(`Você pode fazer upload de no máximo ${maxFiles} arquivos.`);
      return;
    }
    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > maxSizeBytes,
    );
    if (oversizedFiles.length > 0) {
      alert(`Alguns arquivos excedem o tamanho máximo de ${maxSizeMB}MB.`);
      return;
    }
    // Call onUpload callback
    if (onUpload) {
      onUpload(selectedFiles);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileName: string) => {
    // unused extension var
    return <FileText className={`h-5 w-5 ${styles.itemIcon}`} />;
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={styles.dropzone}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          className="hidden"
        />
        <Upload className={styles.icon} />
        <p className={styles.title}>
          Arraste arquivos aqui ou clique para selecionar
        </p>
        <p className={styles.subtitle}>
          Formatos aceitos: {acceptedTypes.join(", ")} (máx. {maxSizeMB}MB cada)
        </p>
        <Button
          type="button"
          onClick={handleButtonClick}
          className={styles.button}
        >
          Enviar Decreto
        </Button>
      </div>

      {/* File List */}
      {showFileList && files.length > 0 && (
        <div className="space-y-2">
          <h4 className={styles.listTitle}>Arquivos ({files.length})</h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className={styles.item}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div>{getFileIcon(file.name)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={styles.itemName}>{file.name}</p>
                    <p className={styles.itemMeta}>
                      {formatFileSize(file.size)} •{" "}
                      {formatDate(file.uploadDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onDownload && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDownload(file.id)}
                      className={styles.actionButton}
                      title="Baixar arquivo"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(file.id)}
                      className={styles.deleteButton}
                      title="Excluir arquivo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
