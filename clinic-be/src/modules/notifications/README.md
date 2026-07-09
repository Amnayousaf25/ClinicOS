# Notifications Module - API Usage

## Endpoints

### Stream Notifications (SSE)
```http
GET /notifications/stream/:userId
Authorization: Bearer <token>
```

**Response:** Server-Sent Events stream

### Get User Notifications
```http
GET /notifications/user?page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: number (optional, default: 1)
- `limit`: number (optional, default: 10, max: 100)

**Response:**
```json
{
  "notifications": [
    {
      "id": "notification-id",
      "title": "New Message",
      "body": "You have a new message",
      "read": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Mark All Notifications as Read
```http
PATCH /notifications/mark-all-read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "All notifications marked as read",
  "updatedCount": 10
}
```

### Get Unread Count
```http
GET /notifications/unread-count
Authorization: Bearer <token>
```

**Response:**
```json
{
  "unreadCount": 5
}
```

