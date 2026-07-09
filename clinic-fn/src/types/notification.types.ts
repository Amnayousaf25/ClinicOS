export interface Notification {
  id: string;
  type: 'appointment' | 'intake' | 'reminder' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}
