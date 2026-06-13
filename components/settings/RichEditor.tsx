"use client";
import React, { useRef, useCallback } from "react";
import {
    Bold, Italic, Underline, List, ListOrdered,
    AlignLeft, AlignCenter, AlignRight,
    Image, Link, Type, Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

interface RichEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const exec = useCallback((command: string, val?: string) => {
        document.execCommand(command, false, val);
        editorRef.current?.focus();
        onChange(editorRef.current?.innerHTML || '');
    }, [onChange]);

    const handleInput = () => {
        onChange(editorRef.current?.innerHTML || '');
    };

    // Converte imagem para base64 e insere inline — sem upload ao servidor
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Tipo não permitido. Use JPG, PNG, GIF ou WebP.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Imagem muito grande. Máximo 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target?.result as string;
            exec('insertImage', base64);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleInsertUrl = () => {
        const url = prompt('Cole a URL da imagem:');
        if (url) exec('insertImage', url);
    };

    const handleInsertHyperlink = () => {
        const url = prompt('Cole o link:');
        if (url) exec('createLink', url);
    };

    const tools = [
        { icon: <Bold className="h-4 w-4" />, cmd: 'bold', title: 'Negrito' },
        { icon: <Italic className="h-4 w-4" />, cmd: 'italic', title: 'Itálico' },
        { icon: <Underline className="h-4 w-4" />, cmd: 'underline', title: 'Sublinhado' },
    ];

    const alignTools = [
        { icon: <AlignLeft className="h-4 w-4" />, cmd: 'justifyLeft', title: 'Alinhar à esquerda' },
        { icon: <AlignCenter className="h-4 w-4" />, cmd: 'justifyCenter', title: 'Centralizar' },
        { icon: <AlignRight className="h-4 w-4" />, cmd: 'justifyRight', title: 'Alinhar à direita' },
    ];

    return (
        <div className="rounded-lg border bg-background overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
                {/* Tamanho */}
                <select
                    onChange={e => { exec('fontSize', e.target.value); e.target.value = ''; }}
                    className="h-8 text-xs rounded border bg-background px-1 mr-1"
                    defaultValue=""
                >
                    <option value="" disabled>Tamanho</option>
                    <option value="1">Pequeno</option>
                    <option value="3">Normal</option>
                    <option value="5">Grande</option>
                    <option value="7">Muito grande</option>
                </select>

                <div className="w-px h-6 bg-border mx-1" />

                {tools.map(t => (
                    <Button key={t.cmd} variant="ghost" size="sm" className="h-8 w-8 p-0" title={t.title}
                        onMouseDown={e => { e.preventDefault(); exec(t.cmd); }}>
                        {t.icon}
                    </Button>
                ))}

                <div className="w-px h-6 bg-border mx-1" />

                <div className="flex items-center gap-1" title="Cor do texto">
                    <Type className="h-3 w-3 text-muted-foreground" />
                    <input type="color" className="h-6 w-6 rounded cursor-pointer border-0 bg-transparent"
                        onChange={e => exec('foreColor', e.target.value)} />
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Lista com marcadores"
                    onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}>
                    <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Lista numerada"
                    onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }}>
                    <ListOrdered className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                {alignTools.map(t => (
                    <Button key={t.cmd} variant="ghost" size="sm" className="h-8 w-8 p-0" title={t.title}
                        onMouseDown={e => { e.preventDefault(); exec(t.cmd); }}>
                        {t.icon}
                    </Button>
                ))}

                <div className="w-px h-6 bg-border mx-1" />

                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Linha divisória"
                    onMouseDown={e => { e.preventDefault(); exec('insertHorizontalRule'); }}>
                    <Minus className="h-4 w-4" />
                </Button>

                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Inserir link"
                    onMouseDown={e => { e.preventDefault(); handleInsertHyperlink(); }}>
                    <Link className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs" title="Upload de imagem (embutida)"
                    onMouseDown={e => { e.preventDefault(); fileInputRef.current?.click(); }}>
                    <Image className="h-4 w-4" />
                    Upload
                </Button>

                <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs" title="Inserir imagem por URL"
                    onMouseDown={e => { e.preventDefault(); handleInsertUrl(); }}>
                    <Image className="h-4 w-4" />
                    URL
                </Button>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>

            {/* Área de edição */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                className="min-h-[200px] p-4 text-sm focus:outline-none"
                style={{ lineHeight: '1.7' }}
                data-placeholder={placeholder}
            />

            <style>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                }
                [contenteditable] img {
                    max-width: 100%;
                    border-radius: 6px;
                    margin: 8px 0;
                }
                [contenteditable] a {
                    color: #0066A1;
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}
