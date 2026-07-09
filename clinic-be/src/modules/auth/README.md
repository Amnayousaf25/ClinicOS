# Auth Module - API Usage

## Endpoints

### Get Authenticated User
```http
GET /auth/get-authenticated-user
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "user-id",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Signup
```http
POST /auth/signup
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "user": { ... }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "user": { ... }
}
```

### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

### Verify Forgot Password OTP
```http
POST /auth/verify-forgot-password-otp
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

### Verify Reset Password
```http
POST /auth/verify-reset-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

### Verify Signup OTP
```http
POST /auth/verify-signup-otp
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

### Change Password
```http
POST /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Apple Auth Callback
```http
POST /auth/apple/callback
Content-Type: application/json
```

**Request Body:**
```json
{
  "idToken": "apple-id-token",
  "user": { ... }
}
```

### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Response:**
```json
{
  "accessToken": "new-jwt-token",
  "refreshToken": "new-refresh-token"
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

### Logout All Devices
```http
POST /auth/logout-all-devices
Authorization: Bearer <token>
```

### Get Active Sessions
```http
GET /auth/active-sessions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "sessions": [
    {
      "deviceId": "device-id",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

