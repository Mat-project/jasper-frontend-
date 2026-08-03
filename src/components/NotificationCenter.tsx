"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { RegisterNotification, getProjectNotifications, markNotificationRead } from "@/lib/api/register_ai";
import { useParams } from "next/navigation";

export function NotificationCenter() {
  const params = useParams();
  const projectId = params?.id as string;
  
  const [notifications, setNotifications] = useState<RegisterNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter(n => n.status === "Unread").length;

  const loadNotifications = async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const data = await getProjectNotifications(projectId);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load notifications on mount and poll every 30 seconds
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!projectId) return;
    try {
      await markNotificationRead(projectId, notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, status: "Read" } : n
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>

          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No notifications</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    notification.status === "Unread" ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {notification.status === "Unread" && (
                      <div className="ml-2 w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
