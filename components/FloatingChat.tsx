"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { UserType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  content: string;
  senderType: "user" | "admin";
  senderName: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/support');
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        if (!isOpen) {
          const unread = data.filter((m: Message) => m.senderType === 'admin').length;
          setUnreadCount(prev => {
            const newUnread = data.filter((m: Message) => m.senderType === 'admin' && !isOpen).length;
            return newUnread > prev ? newUnread : prev;
          });
        }
      }
    } catch (e) {
      console.error('Erro ao buscar mensagens:', e);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isAuthenticated && userType && userType !== 'admin' && userType !== 'superadmin') {
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isAuthenticated, userType, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });
      if (res.ok) {
        setMessage('');
        await fetchMessages();
      }
    } catch (e) {
      console.error('Erro ao enviar:', e);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  // Não mostrar para admins
  if (!isAuthenticated || userType === 'admin' || userType === 'superadmin') return null;

  return (
    <>
      {/* Botão flutuante */}
      {!isOpen && !isMinimized && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 p-0 flex items-center justify-center bg-gradient-to-br from-[#0066A1] to-[#0088CC] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      )}

      {/* Minimizado */}
      {isMinimized && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-3 px-4 py-3 h-auto bg-gradient-to-r from-[#0066A1] to-[#0088CC] text-white rounded-lg shadow-lg"
          >
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

      {/* Janela do chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 animate-in slide-in-from-bottom-4 fade-in duration-300 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0066A1] to-[#0088CC] text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <MessageCircle className="h-5 w-5" />
              </div>
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

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-8">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Envie uma mensagem para nossa equipe de suporte!</p>
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
                    <p className="text-xs font-semibold mb-1 text-[#0066A1]">{msg.senderName}</p>
                  )}
                  <p className="text-sm break-words leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1.5 ${msg.senderType === "user" ? "text-blue-100" : "text-gray-400"}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={sending}
                className="flex-1 px-4 py-2.5 border-gray-300 rounded-xl text-sm"
              />
              <Button
                type="submit"
                disabled={!message.trim() || sending}
                className="p-2.5 h-auto bg-gradient-to-br from-[#0066A1] to-[#0088CC] text-white rounded-xl"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
