export enum NOTIFICATION_ERRORS {
  NOTIFICATIONS_RETRIEVE_FAILED = 'Failed to retrieve notifications',
  NOTIFICATION_NOT_FOUND = 'Notification not found',
  MARK_AS_READ_FAILED = 'Failed to mark notification as read',
  UNREAD_COUNT_FAILED = 'Failed to retrieve unread count',
}

export enum NOTIFICATION_SUCCESS {
  NOTIFICATIONS_RETRIEVED = 'Notifications retrieved successfully',
  NOTIFICATION_MARKED_AS_READ = 'Notification marked as read successfully',
  ALL_NOTIFICATIONS_MARKED_AS_READ = 'All notifications marked as read successfully',
  UNREAD_COUNT_RETRIEVED = 'Unread count retrieved successfully',
}
