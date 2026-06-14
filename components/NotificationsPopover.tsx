import React, { useState } from 'react';
import { Bell, CheckCheck, Info, MessageSquare, RefreshCw, X, Megaphone } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

interface ComunicadoModal {
    title: string;
    content: string;
}

export function NotificationsPopover() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
    const [open, setOpen] = useState(false);
    const [comunicado, setComunicado] = useState<ComunicadoModal | null>(null);
    const router = useRouter();

    const isComunicado = (content: string) => content.startsWith('__COMUNICADO__');
    const getComunicadoHtml = (content: string) => content.replace('__COMUNICADO__', '');

    const handleNotificationClick = async (id: string, link: string, title: string, content: string) => {
        await markAsRead(id);
        if (isComunicado(content)) {
            setOpen(false);
            setComunicado({ title: title.replace('📢 ', ''), content: getComunicadoHtml(content) });
        } else {
            setOpen(false);
            router.push(link);
        }
    };

    const getIcon = (type: string, content: string) => {
        if (isComunicado(content)) return <Megaphone className="h-4 w-4 text-blue-500" />;
        switch (type) {
            case 'SYSTEM': return <Info className="h-4 w-4 text-blue-500" />;
            case 'MESSAGE': return <MessageSquare className="h-4 w-4 text-green-500" />;
            case 'STATUS_CHANGE': return <RefreshCw className="h-4 w-4 text-orange-500" />;
            default: return <Info className="h-4 w-4" />;
        }
    };

    const getPreview = (content: string) => {
        if (isComunicado(content)) return '📢 Clique para ver o comunicado completo';
        return content;
    };

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 shadow-lg border-gray-200">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                        <h4 className="font-medium text-sm text-gray-900">Notificações</h4>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm"
                                className="h-auto px-2 py-1 text-xs text-[#0066A1] hover:text-[#005585] hover:bg-blue-50"
                                onClick={() => markAllAsRead()}>
                                <CheckCheck className="h-3 w-3 mr-1" />
                                Marcar lidas
                            </Button>
                        )}
                    </div>

                    <div className="max-h-[350px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-sm text-gray-500">Carregando...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center text-gray-500">
                                <Bell className="h-8 w-8 text-gray-200 mb-2" />
                                <p className="text-sm">Nenhuma notificação</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        className={cn(
                                            "w-full text-left p-4 hover:bg-gray-50 transition-colors flex gap-3 items-start group",
                                            !notification.read && "bg-blue-50/30"
                                        )}
                                        onClick={() => handleNotificationClick(notification.id, notification.link, notification.title, notification.content)}
                                    >
                                        <div className={cn(
                                            "mt-0.5 p-1.5 rounded-full shrink-0",
                                            !notification.read ? "bg-white shadow-sm ring-1 ring-gray-100" : "bg-gray-100"
                                        )}>
                                            {getIcon(notification.type, notification.content)}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn("text-sm font-medium truncate", !notification.read ? "text-gray-900" : "text-gray-600")}>
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <span className="h-2 w-2 rounded-full bg-[#0066A1] shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                {getPreview(notification.content)}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium pt-1">
                                                {new Date(notification.createdAt).toLocaleDateString()} às {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Modal de comunicado */}
            {comunicado && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setComunicado(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-[#0066A1] to-[#0088CC] rounded-t-2xl">
                            <div className="flex items-center gap-2 text-white">
                                <Megaphone className="h-5 w-5 shrink-0" />
                                <h3 className="font-semibold text-base">{comunicado.title}</h3>
                            </div>
                            <button onClick={() => setComunicado(null)} className="text-white/80 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Logo */}
                        <div className="flex justify-center py-4 border-b bg-gray-50">
                            <img
                                src="/api/uploads/logo-grupo.jpg"
                                alt="PixConsig"
                                className="h-10 object-contain"
                                onError={e => (e.currentTarget.style.display = 'none')}
                            />
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div
                                className="prose prose-sm max-w-none text-gray-700 [&_img]:rounded-lg [&_img]:max-w-full [&_a]:text-[#0066A1]"
                                dangerouslySetInnerHTML={{ __html: comunicado.content }}
                            />
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t bg-gray-50 rounded-b-2xl text-center">
                            <p className="text-xs text-gray-400">© {new Date().getFullYear()} PixConsig. Todos os direitos reservados.</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
