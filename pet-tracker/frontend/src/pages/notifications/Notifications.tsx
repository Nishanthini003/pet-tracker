import { useState } from 'react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export const Notifications = () => {
  const [notifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'Petition Status Update',
      message: 'Your petition #123 has been reviewed and assigned to the relevant department.',
      type: 'info',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      title: 'Resolution Complete',
      message: 'Petition #456 has been successfully resolved. Please check the details.',
      type: 'success',
      timestamp: '1 day ago',
      read: true,
    },
    {
      id: 3,
      title: 'Action Required',
      message: 'Additional information needed for petition #789. Please update within 48 hours.',
      type: 'warning',
      timestamp: '2 days ago',
      read: false,
    },
  ]);

  const getNotificationStyles = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 text-blue-700';
      case 'success':
        return 'bg-green-50 text-green-700';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700';
      case 'error':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Notifications</h2>
          <button className="text-sm text-blue-600 hover:text-blue-500">
            Mark all as read
          </button>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg ${getNotificationStyles(
                notification.type
              )} ${!notification.read ? 'border-l-4 border-current' : ''}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{notification.title}</h3>
                <span className="text-sm opacity-75">{notification.timestamp}</span>
              </div>
              <p className="mt-2">{notification.message}</p>
              <div className="mt-3 flex items-center justify-end space-x-4">
                <button className="text-sm font-medium hover:underline">
                  View Details
                </button>
                {!notification.read && (
                  <button className="text-sm font-medium hover:underline">
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No notifications to display</p>
          </div>
        )}
      </div>
    </div>
  );
};
