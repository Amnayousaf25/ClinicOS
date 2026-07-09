# Chat Module - API Usage

## Endpoints

### Initiate Chat
```http
POST /chat/initiate
Content-Type: application/json
Authorization: Bearer <token>
```

**Headers:**
- `Authorization`: Bearer token (required) - The authentication token containing the sender's user ID

**Request Body:**
```json
{
  "receiverId": "receiver-id",
  "content": "Hello! How are you?"
}
```

**Request Body Fields:**
- `receiverId`: string (required) - The ID of the user to start a chat with
- `content`: string (optional) - Optional initial message to send when starting the chat

**Response:**
```json
{
  "data": {
    "room": {
      "id": "room-id",
      "participants": ["sender-id", "receiver-id"],
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "message": {
      "id": "message-id",
      "content": "Hello! How are you?",
      "senderId": "sender-id",
      "roomId": "room-id",
      "read": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  },
  "status": 201,
  "message": "Room retrieved successfully"
}
```

If no `content` is provided, the `message` field will be `null`. If a room already exists between the two users, it returns the existing room.

### Get User Rooms
```http
GET /chat/rooms?userId=user-id&page=1&limit=20
```

**Query Parameters:**
- `userId`: string (required)
- `page`: number (optional, default: 1)
- `limit`: number (optional, default: 20, max: 100)

**Response:**
```json
{
  "rooms": [
    {
      "id": "room-id",
      "participants": ["user1-id", "user2-id"],
      "lastMessage": {
        "content": "Hello",
        "createdAt": "2024-01-01T00:00:00Z"
      },
      "unreadCount": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10
  }
}
```

### Get Room By ID
```http
GET /chat/rooms/:roomId?userId=user-id
```

**Query Parameters:**
- `userId`: string (required)

**Response:**
```json
{
  "id": "room-id",
  "participants": ["user1-id", "user2-id"],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Get or Create Room with User
```http
GET /chat/rooms/user/:otherUserId?userId=current-user-id
```

**Query Parameters:**
- `userId`: string (required)

**Response:**
```json
{
  "id": "room-id",
  "participants": ["current-user-id", "other-user-id"],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Get Room Messages
```http
GET /chat/rooms/:roomId/messages?userId=user-id&page=1&limit=20
```

**Query Parameters:**
- `userId`: string (required)
- `page`: number (optional, default: 1)
- `limit`: number (optional, default: 20, max: 100)

**Response:**
```json
{
  "messages": [
    {
      "id": "message-id",
      "content": "Hello",
      "senderId": "user-id",
      "read": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Send Message
```http
POST /chat/rooms/:roomId/messages?userId=sender-id
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Hello, how are you?"
}
```

**Response:**
```json
{
  "id": "message-id",
  "content": "Hello, how are you?",
  "senderId": "sender-id",
  "roomId": "room-id",
  "read": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Mark Messages as Read
```http
PATCH /chat/rooms/:roomId/mark-read?userId=user-id
Content-Type: application/json
```

**Request Body (Optional):**
```json
{
  "messageIds": ["msg1", "msg2"]
}
```

If `messageIds` is not provided, marks all unread messages as read.

**Response:**
```json
{
  "message": "Messages marked as read",
  "updatedCount": 5
}
```

### Mark All as Read if Last Read
```http
PATCH /chat/rooms/:roomId/mark-all-read-if-last-read?userId=user-id
```

**Response:**
```json
{
  "message": "Messages marked as read",
  "updatedCount": 3
}
```

### Get Unread Count
```http
GET /chat/rooms/:roomId/unread-count?userId=user-id
```

**Response:**
```json
{
  "unreadCount": 5
}
```

### Delete Room
```http
DELETE /chat/rooms/:roomId?userId=user-id
```

**Response:**
```json
{
  "message": "Room deleted successfully"
}
```
