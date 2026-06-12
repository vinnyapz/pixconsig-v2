import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, User, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Prefeitura, PrefeituraMessage } from '@/types/prefeitura';
import { useAuth } from '@/contexts/AuthContext';

interface PrefeituraMessagesProps {
    prefeitura: Prefeitura;
    isMaster: boolean;
}

export function PrefeituraMessages({ prefeitura, isMaster }: PrefeituraMessagesProps) {
    const [messages, setMessages] = useState<PrefeituraMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    const fetchMessages = async () => {
        try {
            const response = await fetch(`/api/prefeituras/${prefeitura.id}/messages`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Falha ao carregar mensagens:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 10000);
        return () => clearInterval(interval);
    }, [prefeitura.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const response = await fetch(`/api/prefeituras/${prefeitura.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage }),
            });

            if (!response.ok) throw new Error('Falha no envio');

            const savedMessage = await response.json();
            setMessages(prev => [...prev, savedMessage]);
            setNewMessage('');
        } catch (error) {
            toast.error('Erro ao enviar mensagem');
        } finally {
            setSending(false);
        }
    };

    const getSenderColor = (type: string) => {
        switch (type) {
            case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'MASTER': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'FRANQUEADO': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const bgColor = isMaster ? 'bg-zinc-900/50' : 'bg-gray-50';
    const borderColor = isMaster ? 'border-white/10' : 'border-gray-200';

    if (loading) return <div className="p-4 text-center text-sm text-muted-foreground">Carregando mensagens...</div>;

    return (
        <div className={cn("flex flex-col h-[500px] rounded-lg border", bgColor, borderColor)}>
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                        <User className="w-8 h-8 mb-2" />
                        <p className="text-sm">Nenhuma mensagem ainda.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = user?.id === msg.senderId;

                        if (msg.isSystemMessage) {
                            return (
                                <div key={msg.id} className="flex justify-center my-3 w-full">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-xs text-blue-700 dark:text-blue-300">
                                        <Info className="w-3.5 h-3.5" />
                                        <span>{msg.content}</span>
                                        <span className="opacity-50 ml-2">
                                            {new Date(msg.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex flex-col max-w-[80%] rounded-lg p-3 text-sm",
                                    isMe ? "ml-auto bg-primary text-primary-foreground" : "mr-auto bg-white dark:bg-zinc-800 border shadow-sm"
                                )}
                            >
                                {!isMe && (
                                    <div className="flex items-center gap-2 mb-1 text-xs opacity-70">
                                        <span className="font-semibold">{msg.senderName}</span>
                                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] border uppercase", getSenderColor(msg.senderType))}>
                                            {msg.senderType}
                                        </span>
                                    </div>
                                )}
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <span className="text-[10px] opacity-50 mt-1 self-end block">
                                    {new Date(msg.createdAt).toLocaleString()}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t bg-background/50 backdrop-blur flex gap-2">
                <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                    disabled={sending}
                />
                <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </div>
    );
}
