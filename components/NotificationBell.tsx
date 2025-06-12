
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Notification } from '../types';
import { BellIcon, CheckIcon, CloseIcon, DeleteIcon } from './Icons'; // Changed TrashIcon to DeleteIcon
import Button from './Button';

interface NotificationBellProps {
  programId: string;
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: (programId: string) => void;
  onDeleteNotification: (notificationId: string) => void;
  onClearAll: (programId: string) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  programId,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    const newIsOpenState = !isOpen;
    setIsOpen(newIsOpenState);
    if (newIsOpenState && unreadCount > 0) {
      onMarkAllAsRead(programId);
    }
  };

  const getNotificationStyle = (type: Notification['type'], isRead: boolean) => {
    let baseStyle = 'border-l-4 p-3 rounded-r-md ';
    if (!isRead) baseStyle += 'bg-sky-50 ';

    switch (type) {
      case 'success':
        return baseStyle + (isRead ? 'border-green-300 bg-green-50/50' : 'border-green-500 bg-green-50');
      case 'error':
        return baseStyle + (isRead ? 'border-red-300 bg-red-50/50' : 'border-red-500 bg-red-50');
      case 'info':
      default:
        return baseStyle + (isRead ? 'border-blue-300 bg-blue-50/50' : 'border-blue-500 bg-blue-50');
    }
  };

  const getNotificationTextColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'text-green-700';
      case 'error': return 'text-red-700';
      case 'info': default: return 'text-blue-700';
    }
  };

  const formatFullDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      // Unread first
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
      // Then by newest timestamp
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [notifications]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        onClick={toggleDropdown}
        className="p-1.5 sm:px-2.5 sm:py-1.5 text-gray-500 hover:bg-gray-100 hover:text-sky-600 focus:outline-none focus:bg-gray-100 relative"
        aria-label={`View notifications (${unreadCount} unread)`}
        title={`Notifications (${unreadCount} unread)`}
      >
        <BellIcon className="w-4 h-4 flex-shrink-0" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 text-white text-[10px] items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[70vh] flex flex-col">
          <header className="p-3 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-gray-50 rounded-t-lg">
            <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
            {notifications.length > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAllAsRead(programId)}
                    className="text-xs !px-2 !py-1"
                    disabled={unreadCount === 0} // Only enable if there are unread notifications
                    title="Mark all as read"
                >
                    Mark all read
                </Button>
            )}
          </header>

          <main className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {sortedNotifications.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No notifications.</p>
            ) : (
              sortedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${getNotificationStyle(notification.type, notification.isRead)} transition-colors duration-150 group`}
                >
                  <div className={`flex justify-between items-start ${getNotificationTextColor(notification.type)}`}>
                    <p className="text-xs font-medium flex-grow mr-2 break-words" dangerouslySetInnerHTML={{ __html: notification.message.replace(/\n/g, '<br/>') }} />
                    {/* Mark as read button is removed as opening the dropdown marks all as read */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onDeleteNotification(notification.id); }}
                        className="!p-0.5 text-xs text-gray-400 hover:text-red-500 ml-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete notification"
                      >
                         <DeleteIcon className="w-3.5 h-3.5"/>
                    </Button>
                  </div>
                  <p className={`text-[10px] mt-1 ${notification.isRead ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatFullDate(notification.timestamp)}
                  </p>
                </div>
              ))
            )}
          </main>
          {notifications.length > 0 && (
            <footer className="p-2 border-t border-gray-200 sticky bottom-0 bg-gray-50 rounded-b-lg">
              <Button
                variant="danger"
                size="sm"
                onClick={() => onClearAll(programId)}
                className="w-full text-xs !py-1.5"
                disabled={notifications.length === 0}
              >
                Clear All Notifications
              </Button>
            </footer>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
