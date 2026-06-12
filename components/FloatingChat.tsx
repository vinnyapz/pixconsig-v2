"use client";
import React, { useEffect, useState, useRef } from "react";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { UserType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  text: string;
  sender: "user" | "support";
  timestamp: string;
  senderName?: string;
}

interface FloatingChatProps {
  userType?: UserType;
  userName?: string;
}

export function FloatingChat({
  userType: propUserType,
  userName = "Usuário",
}: FloatingChatProps) {
  const { isAuthenticated, userType: contextUserType } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Olá! Como posso ajudá-lo hoje?",
      sender: "support",
      timestamp: new Date().toISOString(),
      senderName: "Suporte IA",
    },
  ]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date().toISOString(),
      senderName: userName,
    };

    // Add user message immediately
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setMessage("");
    setIsTyping(true);

    try {
      // Prepare messages for API
      const apiMessages = updatedMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Chat API error:', { status: response.status, body: errorBody });
        throw new Error(`Falha na comunicação (status: ${response.status})`);
      }
      if (!response.body) throw new Error('Sem resposta');

      // Create placeholder for AI response
      const aiMsgId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: aiMsgId,
        text: "",
        sender: "support",
        timestamp: new Date().toISOString(),
        senderName: "Suporte IA",
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        fullText += chunkValue;

        // Update the last message with new content
        setMessages(prev => prev.map(msg =>
          msg.id === aiMsgId ? { ...msg, text: fullText } : msg
        ));
      }

      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      // Optional: Add error message to chat
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "Desculpe, ocorreu um erro ao processar sua mensagem.",
        sender: "support",
        timestamp: new Date().toISOString(),
        senderName: "Sistema",
      }]);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && !isMinimized && (
        <Button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 p-0 flex items-center justify-center bg-gradient-to-br from-[#0066A1] to-[#0088CC] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group hover:from-[#005585] hover:to-[#0077b3]"
          aria-label="Abrir chat"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-ping">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
              <span className="relative">{unreadCount}</span>
            </span>
          )}
        </Button>
      )}

      {/* Minimized Chat Bar */}
      {isMinimized && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 duration-300">
          <Button
            onClick={toggleChat}
            className="flex items-center gap-3 px-4 py-3 h-auto bg-gradient-to-r from-[#0066A1] to-[#0088CC] text-white rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 hover:from-[#005585] hover:to-[#0077b3]"
          >
            <MessageCircle className="h-5 w-5 animate-pulse" />
            <span className="font-medium">Suporte IA</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 animate-in slide-in-from-bottom-4 fade-in duration-300 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0066A1] to-[#0088CC] text-white rounded-t-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer"></div>

            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Suporte IA</h3>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-xs text-blue-100">Online</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 relative z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={minimizeChat}
                className="p-1.5 h-8 w-8 text-white hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeChat}
                className="p-1.5 h-8 w-8 text-white hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 hover:rotate-90"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 fade-in duration-300`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${msg.sender === "user" ? "bg-gradient-to-br from-[#0066A1] to-[#0088CC] text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"}`}
                >
                  {msg.sender === "support" && (
                    <p className="text-xs font-semibold mb-1 text-[#0066A1]">
                      {msg.senderName}
                    </p>
                  )}
                  <p className="text-sm break-words leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                  <p
                    className={`text-xs mt-1.5 ${msg.sender === "user" ? "text-blue-100" : "text-gray-400"}`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white border border-gray-200 rounded-bl-sm shadow-sm">
                  <p className="text-xs font-semibold mb-1 text-[#0066A1]">
                    Suporte IA
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-0"></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-gray-200 bg-white rounded-b-2xl"
          >
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={isTyping}
                className="flex-1 px-4 py-2.5 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0066A1] focus:border-[#0066A1] text-sm transition-all duration-200 hover:border-gray-400"
              />
              <Button
                type="submit"
                disabled={!message.trim() || isTyping}
                className="p-2.5 h-auto bg-gradient-to-br from-[#0066A1] to-[#0088CC] text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 disabled:hover:scale-100 hover:from-[#005585] hover:to-[#0077b3]"
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
