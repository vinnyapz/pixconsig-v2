"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Minimize2, Paperclip, FileText, Download } from "lucide-react";
import { UserType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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

interface FloatingChatProps {
  userType?: UserType;
  userName?: string;
}

export function FloatingChat({ userType: propUserType, userName = "Usuário" }: FloatingChatProps) {
  const { isAuthenticated, userType: contextUserType } = useAuth();
  const userType = propUserType || contextUserType;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastCountRef = useRef(0);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/support');
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        if (!isOpen) {
          const adminMsgs = data.filter((m: Message) => m.senderType === 'admin').length;
          if (adminMsgs > lastCountRef.current) {
            setUnreadCount(adminMsgs - lastCountRef.current);
          }
          if (isOpen) lastCountRef.current = adminMsgs;
        }
      }
    } catch (e) {}
  }, [isOpen]);

  useEffect(() => {
    if (isAuthenticated && userType && userType !== 'superadmin') {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, userType, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      lastCountRef.current = messages.filter(m => m.senderType === 'admin').length;
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = async (content: string, attachment?: { url: string; name: string; type: string }) => {
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        attachmentUrl: attachment?.url,
        attachmentName: attachment?.name,
        attachmentType: attachment?.type,
      }),
    });
    if (res.ok) await fetchMessages();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(message);
      setMessage('');
    } catch (e) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/support/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Erro ao enviar arquivo');
        return;
      }
      const { url, name, type } = await res.json();
      await sendMessage('', { url, name, type });
    } catch (e) {
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (!isAuthenticated || userType === 'superadmin') return null;

  return (
    <>
      {!isOpen && !isMinimized && (
        <Button onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 p-0 flex items-center justify-center bg-gradient-to-br from-[#0066A1] to-[#0088CC] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300">
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      )}

      {isMinimized && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button onClick={() => setIsMinimized(false)}
            className="flex items-center gap-3 px-4 py-3 h-auto bg-gradient-to-r from-[#0066A1] to-[#0088CC] text-white rounded-lg shadow-lg">
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium">Suporte</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 animate-in slide-in-from-bottom-4 fade-in duration-300 overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0066A1] to-[#0088CC] text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full"><MessageCircle className="h-5 w-5" /></div>
              <div>
                <h3 className="font-semibold">Suporte</h3>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-xs text-blue-100">Online</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)}
                className="p-1.5 h-8 w-8 text-white hover:bg-white/20 rounded-lg">
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setIsOpen(false); setIsMinimized(false); }}
                className="p-1.5 h-8 w-8 text-white hover:bg-white/20 rounded-lg">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-8">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Envie uma mensagem para nossa equipe!</p>
                <p className="text-xs mt-1">Você também pode anexar imagens e documentos.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderType === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.senderType === "user"
                    ? "bg-gradient-to-br from-[#0066A1] to-[#0088CC] text-white rounded-br-sm"
                    : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                }`}>
                  {msg.senderType === "admin" && (
                    <p className="text-xs font-semibold mb-1 text-[#0066A1]">PixConsig</p>
                  )}

                  {/* Anexo */}
                  {msg.attachmentUrl && (
                    <div className="mb-2">
                      {msg.attachmentType?.startsWith('image/') ? (
                        <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
                          <img src={msg.attachmentUrl} alt={msg.attachmentName} className="rounded-lg max-w-full max-h-48 object-cover" />
                        </a>
                      ) : (
                        <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer"
                          className={`flex items-center gap-2 p-2 rounded-lg border ${msg.senderType === 'user' ? 'border-white/30 bg-white/10' : 'border-gray-200 bg-gray-50'}`}>
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="text-xs truncate">{msg.attachmentName}</span>
                          <Download className="h-3 w-3 shrink-0 ml-auto" />
                        </a>
                      )}
                    </div>
                  )}

                  {msg.content && (
                    <p className="text-sm break-words leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <p className={`text-xs mt-1.5 ${msg.senderType === "user" ? "text-blue-100" : "text-gray-400"}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-2.5 text-gray-400 hover:text-[#0066A1] hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50">
                {uploading ? (
                  <div className="h-5 w-5 border-2 border-[#0066A1] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Paperclip className="h-5 w-5" />
                )}
              </button>
              <Input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={sending || uploading}
                className="flex-1 px-4 py-2.5 border-gray-300 rounded-xl text-sm"
              />
              <Button type="submit" disabled={!message.trim() || sending || uploading}
                className="p-2.5 h-auto bg-gradient-to-br from-[#0066A1] to-[#0088CC] text-white rounded-xl">
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <input ref={fileInputRef} type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="hidden" onChange={handleFileUpload} />
          </form>
        </div>
      )}
    </>
  );
}
