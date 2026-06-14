"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Send, Loader2, ArrowLeft, Users, Paperclip, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Conversation {
  userId: string;
  userName: string;
  userType: string;
  userEmail: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

interface Message {
  id: string;
  content: string;
  senderType: "user" | "admin";
  senderName: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  createdAt: string;
}

const typeLabel: Record<string, string> = {
  MASTER: '🏆 Master',
  FRANQUEADO: '🏪 Franqueado',
};

export function SuporteTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/support');
      if (res.ok) setConversations(await res.json());
    } catch (e) {
      console.error('Erro ao buscar conversas:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/support?userId=${userId}`);
      if (res.ok) {
        setMessages(await res.json());
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (e) {
      console.error('Erro ao buscar mensagens:', e);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(async () => {
      await fetchConversations();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.userId);
      const interval = setInterval(() => {
        fetchMessages(selectedUser.userId);
        fetchConversations();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser, fetchMessages, fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/support/upload', { method: 'POST', body: formData });
      if (!res.ok) { const data = await res.json(); toast.error(data.error || 'Erro ao enviar'); return; }
      const { url, name, type } = await res.json();
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '', recipientId: selectedUser.userId, attachmentUrl: url, attachmentName: name, attachmentType: type }),
      });
      await fetchMessages(selectedUser.userId);
      await fetchConversations();
    } catch { toast.error('Erro ao enviar arquivo'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedUser || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply, recipientId: selectedUser.userId, attachmentUrl: undefined, attachmentName: undefined, attachmentType: undefined }),
      });
      if (res.ok) {
        setReply('');
        await fetchMessages(selectedUser.userId);
        await fetchConversations();
      }
    } catch (e) {
      console.error('Erro ao enviar:', e);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex h-[600px]">

        {/* Lista de conversas */}
        <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r`}>
          <div className="px-4 py-3 border-b bg-muted/40 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Conversas</h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm p-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>Nenhuma conversa ainda.</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.userId}
                  onClick={() => setSelectedUser(conv)}
                  className={`w-full text-left p-4 border-b hover:bg-muted/50 transition-colors ${
                    selectedUser?.userId === conv.userId ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{conv.userName}</p>
                      <p className="text-xs text-muted-foreground">{typeLabel[conv.userType] || conv.userType}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="text-[10px] text-muted-foreground">{formatTime(conv.lastMessageAt)}</p>
                      {conv.unread > 0 && (
                        <span className="bg-primary text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Área de mensagens */}
        <div className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
          {!selectedUser ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Selecione uma conversa</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header da conversa */}
              <div className="px-4 py-3 border-b bg-muted/40 flex items-center gap-3">
                <button onClick={() => setSelectedUser(null)} className="md:hidden text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <p className="font-semibold text-sm">{selectedUser.userName}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.userEmail}</p>
                </div>
                <Badge className="ml-auto text-xs border-0 bg-primary/10 text-primary">
                  {typeLabel[selectedUser.userType] || selectedUser.userType}
                </Badge>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      msg.senderType === 'admin'
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-white border rounded-bl-sm text-gray-900'
                    }`}>
                      {msg.senderType === 'user' && (
                        <p className="text-xs font-semibold mb-1 text-primary">{msg.senderName}</p>
                      )}
                      {msg.attachmentUrl && (
                        <div className="mb-1.5">
                          {msg.attachmentType?.startsWith('image/') ? (
                            <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
                              <img src={msg.attachmentUrl} alt={msg.attachmentName} className="rounded-lg max-w-full max-h-40 object-cover" />
                            </a>
                          ) : (
                            <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer"
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${msg.senderType === 'admin' ? 'border-white/30 bg-white/10' : 'border-gray-200 bg-gray-50'}`}>
                              <FileText className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{msg.attachmentName}</span>
                              <Download className="h-3 w-3 shrink-0 ml-auto" />
                            </a>
                          )}
                        </div>
                      )}
                      {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                      <p className={`text-[10px] mt-1 ${msg.senderType === 'admin' ? 'text-white/70' : 'text-gray-400'}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de resposta */}
              <form onSubmit={handleSend} className="p-3 border-t bg-white">
                <div className="flex gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    disabled={uploading} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-50">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </button>
                  <Input
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder={`Responder para ${selectedUser.userName}...`}
                    disabled={sending || uploading}
                    className="flex-1 rounded-xl text-sm"
                    autoFocus
                  />
                  <Button type="submit" disabled={!reply.trim() || sending || uploading} size="icon" className="rounded-xl shrink-0">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleFileUpload} />
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
