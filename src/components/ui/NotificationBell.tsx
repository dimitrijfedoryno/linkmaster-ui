import { useState, useEffect } from "react";
import { Bell, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { io } from "socket.io-client";
import { API_URL } from "@/config";

// Reuse the existing socket connection if possible, or create a new one.
// Ideally this should be in a context, but for now we'll create a local one or rely on props if passed.
// To avoid multiple connections, we'll implement a simple internal socket listener for this component.

interface Notification {
  id: string;
  type: 'error' | 'info' | 'success';
  message: string;
  details?: string;
  timestamp: string;
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('notificationUpdate', (data: Notification[]) => {
      setNotifications(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const clearAll = () => {
    if (socket) socket.emit('clearNotifications');
  };

  const deleteNotification = (id: string) => {
    if (socket) socket.emit('deleteNotification', id);
  };

  const unreadCount = notifications.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-white/10">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-black/95 backdrop-blur-xl border-white/10 text-white" align="end">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h4 className="font-semibold text-sm">Oznámení</h4>
          {unreadCount > 0 && (
            <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs hover:bg-white/10 text-gray-400 hover:text-white"
                onClick={clearAll}
            >
              Vymazat vše
            </Button>
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Žádná nová oznámení
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-4 flex gap-3 group relative">
                  <div className={`mt-0.5 shrink-0 ${notification.type === 'error' ? 'text-red-500' : 'text-blue-500'}`}>
                    {notification.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 leading-none mb-1">
                      {notification.message}
                    </p>
                    {notification.details && (
                        <p className="text-xs text-gray-500 truncate" title={notification.details}>
                            {notification.details}
                        </p>
                    )}
                    <p className="text-[10px] text-gray-600 mt-1">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
