# User Module - API Usage

## Endpoints

All endpoints require authentication via Bearer token. Some endpoints require specific roles (OWNER, ADMIN, MEMBER, VIEWER).

### Create User

```http
POST /users
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "MEMBER"
}
```

**Request Body Fields:**
- `name`: string (required) - User's full name
- `email`: string (required) - User's email address (must be valid email)
- `phone`: string (required) - User's phone number
- `role`: string (required) - User role (OWNER, ADMIN, MEMBER, VIEWER)

**Response:**
```json
{
  "data": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "MEMBER",
    "status": "ACTIVE",
    "emailVerified": false,
    "avatar": "profile/john@example.com/avatar.jpg",
    "provider": "CUSTOM",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "status": 201,
  "message": "User created successfully"
}
```

**Notes:**
- A random password is automatically generated
- An onboarding email with credentials is sent to the user
- To add an avatar, upload the file separately using the Media module's upload endpoint, then update the user with the avatar path
- Returns 400 if user with email already exists

### Get All Users (Basic)

```http
GET /users
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": [
    {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "MEMBER",
      "status": "ACTIVE",
      "emailVerified": true,
      "avatar": "profile/john@example.com/avatar.jpg",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "status": 200,
  "message": "Users retrieved successfully"
}
```

**Notes:**
- Returns all users without password field
- No role restrictions

### Get All Users (With Role Restriction)

```http
GET /users/all
Authorization: Bearer <token>
```

**Required Roles:** OWNER, ADMIN, MEMBER

**Response:**
Same as GET /users

### Get User By ID

```http
GET /users/:id
Authorization: Bearer <token>
```

**Required Roles:** OWNER, ADMIN

**Path Parameters:**
- `id`: string (required) - User ID

**Response:**
```json
{
  "data": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "MEMBER",
    "status": "ACTIVE",
    "emailVerified": true,
    "avatar": "profile/john@example.com/avatar.jpg",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "status": 200,
  "message": "User retrieved successfully"
}
```

**Notes:**
- Returns 404 if user not found

### Update User

```http
PATCH /users/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Roles:** OWNER, ADMIN

**Path Parameters:**
- `id`: string (required) - User ID

**Request Body (all fields optional):**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "role": "ADMIN",
  "password": "newpassword123"
}
```

**Request Body Fields:**
- `name`: string (optional) - User's full name
- `email`: string (optional) - User's email address
- `phone`: string (optional) - User's phone number
- `role`: string (optional) - User role (OWNER, ADMIN, MEMBER, VIEWER)
- `password`: string (optional) - New password (minimum 6 characters)

**Response:**
```json
{
  "data": {
    "id": "user-id",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "role": "ADMIN",
    "status": "ACTIVE",
    "emailVerified": true,
    "avatar": "profile/jane@example.com/new-avatar.jpg",
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "status": 200,
  "message": "User updated successfully"
}
```

**Notes:**
- Password is automatically hashed if provided
- To update avatar, upload the file separately using the Media module's upload endpoint, then update the user with the avatar path
- Returns 404 if user not found

### Change Email

```http
PATCH /users/change-email
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "password": "current-password"
}
```

**Request Body Fields:**
- `email`: string (required) - New email address (must be valid email)
- `password`: string (required) - Current password for verification

**Response:**
```json
{
  "data": {
    "id": "user-id",
    "email": "newemail@example.com",
    "emailVerified": false,
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "status": 200,
  "message": "Email updated successfully"
}
```

**Notes:**
- Requires current password for security
- Email verification status is reset to false after change
- Returns 400 if new email already exists
- Returns 401 if password is incorrect
- Uses the authenticated user's ID from the token

### Delete User

```http
DELETE /users/:id
Authorization: Bearer <token>
```

**Required Roles:** OWNER, ADMIN

**Path Parameters:**
- `id`: string (required) - User ID to delete

**Response:**
```json
{
  "data": null,
  "status": 200,
  "message": "User deleted successfully"
}
```

**Notes:**
- Returns 404 if user not found
- Permanently deletes the user from the database

## User Roles

- `OWNER` - Highest privilege level
- `ADMIN` - Administrative access
- `MEMBER` - Standard user access
- `VIEWER` - Read-only access

## User Status

- `ACTIVE` - User is active and can access the system
- `INACTIVE` - User is inactive
- `PENDING` - User account is pending approval
- `UNAPPROVED` - User account is not approved

## Usage Examples

### Create a user

```javascript
const response = await fetch('http://localhost:3000/users', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    role: 'MEMBER'
  })
});

const result = await response.json();
console.log('Created user:', result.data);
```

### Create a user and add avatar

```javascript
// Step 1: Upload avatar using Media module
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const uploadResponse = await fetch('http://localhost:3000/media/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  },
  body: formData
});

const uploadResult = await uploadResponse.json();
const avatarKey = uploadResult.data.key;

// Step 2: Create user with avatar path (if your API supports avatar field in JSON)
const response = await fetch('http://localhost:3000/users', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    role: 'MEMBER',
    avatar: avatarKey // If supported
  })
});

const result = await response.json();
console.log('Created user:', result.data);
```

### Update user email

```javascript
const response = await fetch('http://localhost:3000/users/change-email', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'newemail@example.com',
    password: 'current-password'
  })
});

const result = await response.json();
console.log('Email updated:', result.data);
```

