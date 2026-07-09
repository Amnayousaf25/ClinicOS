# Chat Module Testing Guide

This guide explains how to test the Chat Module functionality, including both REST API and Socket.IO features.

## Prerequisites

1. **Server Running**: The NestJS server must be running on `http://localhost:8081`
2. **Database**: MongoDB must be connected and running
3. **Valid User IDs**: You need at least two valid MongoDB ObjectId user IDs from your database
4. **JWT Token** (for REST API tests): A valid JWT authentication token for one of the users

## Quick Start

### 1. Start the Server

```bash
# Development mode
npm run start:dev

# Or production mode
npm run start
```

The server should start on port 8081 (default) or the port specified in your `.env` file.

### 2. Get User IDs and Token

You need:
- **USER_1_ID**: A valid MongoDB ObjectId for the first user
- **USER_2_ID**: A valid MongoDB ObjectId for the second user  
- **AUTH_TOKEN**: A valid JWT token for USER_1_ID (you can get this by logging in via the auth API)

### 3. Run Comprehensive Tests

The comprehensive test script tests both REST API and Socket.IO:

```bash
# Edit the test file first to update USER_1_ID, USER_2_ID, and AUTH_TOKEN
node src/modules/chat/test-chat-module.js
```

This will test:
- ✅ Initiate Chat (REST API)
- ✅ Get Room by ID (REST API)
- ✅ Send Message (REST API)
- ✅ Get Messages (REST API)
- ✅ Get User Rooms (REST API)
- ✅ Get Unread Count (REST API)
- ✅ Socket.IO Connection
- ✅ Join Room (Socket.IO)
- ✅ Send/Receive Messages (Socket.IO)

### 4. Run Socket.IO Tests Only

For Socket.IO-only testing:

```bash
# Edit socket-test.js to update USER_ID and ROOM_ID
node src/modules/chat/socket-test.js
```

### 5. Run Two-User Socket.IO Test

For testing message exchange between two users:

```bash
# Edit test-two-users.js to update USER_1_ID, USER_2_ID, and ROOM_ID
node src/modules/chat/test-two-users.js
```

## Test Scripts Overview

### 1. `test-chat-module.js` (Comprehensive)
- **Purpose**: Tests both REST API and Socket.IO functionality
- **Configuration**: Update `USER_1_ID`, `USER_2_ID`, and `AUTH_TOKEN`
- **What it tests**:
  - All REST API endpoints
  - Socket.IO connection and messaging
  - End-to-end chat flow

### 2. `socket-test.js` (Socket.IO Only)
- **Purpose**: Tests Socket.IO connection and real-time messaging
- **Configuration**: Update `USER_ID` and `ROOM_ID`
- **Features**:
  - Interactive commands (join, send, read, help, exit)
  - Auto-joins room and sends test message
  - Real-time message receiving

### 3. `test-two-users.js` (Two-User Socket.IO)
- **Purpose**: Tests message exchange between two users via Socket.IO
- **Configuration**: Update `USER_1_ID`, `USER_2_ID`, and `ROOM_ID`
- **Features**:
  - Creates two separate Socket.IO connections
  - Tests bidirectional messaging
  - Simulates real chat scenario

## Getting a JWT Token

To get a JWT token for testing, you can:

1. **Use the Auth API**:
   ```bash
   # Login via your auth endpoint
   curl -X POST http://localhost:8081/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "password": "password"}'
   ```

2. **Extract token from response** and use it as `AUTH_TOKEN` in test scripts

## Testing Workflow

### Recommended Testing Order:

1. **Start the server** (`npm run start:dev`)
2. **Get user IDs** from your database
3. **Get JWT token** via auth API
4. **Update test scripts** with real IDs and token
5. **Run comprehensive test** (`test-chat-module.js`)
6. **Verify results** - all tests should pass
7. **Test interactively** using `socket-test.js` for real-time testing

## Expected Results

When all tests pass, you should see:

```
✅ Passed: 9
❌ Failed: 0
⚠️  Skipped: 0
```

## Troubleshooting

### Server Connection Issues
- **Error**: `Connection error: connect ECONNREFUSED`
- **Solution**: Make sure the server is running on port 8081

### Authentication Issues
- **Error**: `401 Unauthorized` in REST API tests
- **Solution**: Check that your JWT token is valid and not expired

### Invalid User/Room IDs
- **Error**: `Invalid User ID format` or `Room not found`
- **Solution**: Ensure IDs are valid MongoDB ObjectIds (24 hex characters) and exist in your database

### Socket.IO Connection Issues
- **Error**: `Connection error` or `Invalid user ID`
- **Solution**: 
  - Verify the server is running
  - Check that USER_ID is a valid MongoDB ObjectId
  - Ensure the Socket.IO gateway is properly configured

## Manual Testing via Swagger

You can also test the REST API endpoints manually via Swagger UI:

1. Start the server
2. Navigate to: `http://localhost:8081/api-docs`
3. Click "Authorize" and enter your JWT token
4. Test endpoints interactively

## Notes

- All test scripts use port **8081** (default NestJS port)
- Socket.IO namespace is `/chat`
- REST API base path is `/chat`
- Tests create actual data in your database (rooms, messages)
- You may want to clean up test data after testing

