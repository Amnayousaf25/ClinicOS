# OneSignal Module - API Usage

## Service Usage

This module provides push notification functionality via service injection.

### Send Notification

```typescript
import { OneSignalService } from './modules/onesignal/onesignal.service';

// Inject service
constructor(private readonly oneSignalService: OneSignalService) {}

// Send notification
await this.oneSignalService.sendNotification(
  'Notification Heading',
  'Notification content',
  ['user-id-1', 'user-id-2'], // externalUserIds
  { type: 'message', userId: '123' } // optional data
);
```

**Parameters:**
- `heading`: string (required) - Notification title
- `content`: string (required) - Notification message
- `externalUserIds`: string[] (required) - Array of user IDs to send to
- `data`: object (optional) - Custom data to attach

**Response:**
```json
{
  "id": "notification-id",
  "recipients": 2
}
```
