/**
 * Comprehensive Chat Module Test Script
 * 
 * This script tests both REST API and Socket.IO functionality of the Chat Module.
 * 
 * Prerequisites:
 * 1. Server must be running on http://localhost:8081
 * 2. You need valid user IDs from your database
 * 3. You need a valid JWT token for authentication (for REST API)
 * 
 * Usage:
 * 1. Update USER_1_ID, USER_2_ID, and AUTH_TOKEN below
 * 2. Run: node src/modules/chat/test-chat-module.js
 * 
 * Note: For Socket.IO tests, you can use the socket-test.js script separately
 */

const { io } = require('socket.io-client');
const http = require('http');

// ============================================
// CONFIGURATION - Update these values
// ============================================
const SERVER_URL = 'http://localhost:8080';
const SOCKET_URL = 'http://localhost:8080/chat';
const USER_1_ID = '6943d24fca05372e8750e58b'; // Replace with actual user ID
const USER_2_ID = '694922099c7d127ccbcf0e64'; // Replace with actual user ID
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTQzZDI0ZmNhMDUzNzJlODc1MGU1OGIiLCJlbWFpbCI6ImFkbmFuQHlvcG1haWwuY29tIiwidHlwZSI6IlNJR05JTl9UT0tFTiIsImlhdCI6MTc2NjQwMDQ1NiwiZXhwIjoxNzY3MDA1MjU2fQ.7MhthWNnbWYHh9T0AVzRLF_luMnUxttDKHwZfnutG0M'; // Replace with actual JWT token for USER_1_ID
// ============================================

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(title, 'bright');
  log('='.repeat(60), 'cyan');
}

function logTest(testName, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`${icon} ${testName}${details ? `: ${details}` : ''}`, color);
}

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SERVER_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 8081,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
};

let createdRoomId = null;
let createdMessageId = null;

// ============================================
// REST API Tests
// ============================================

async function testRestAPI() {
  logSection('REST API Tests');

  // Test 1: Initiate Chat
  try {
    log('\n📝 Test 1: Initiate Chat (POST /chat/initiate)', 'yellow');
    console.log('sadadsasdasd')
    const initiateResponse = await makeRequest(
      'POST',
      '/chat/initiate',
      {
        receiverId: USER_2_ID,
        content: 'Hello! This is a test message from the test script.',
      },
      AUTH_TOKEN,
    );
    console.log('initiateResponse==>', initiateResponse);
    if (initiateResponse.statusCode === 201 || initiateResponse.statusCode === 200) {
      if (initiateResponse.body?.data?.room) {
        createdRoomId = initiateResponse.body.data.room._id || initiateResponse.body.data.room.id;
        createdMessageId = initiateResponse.body.data.message?._id || initiateResponse.body.data.message?.id;
        logTest('Initiate Chat', 'PASS', `Room ID: ${createdRoomId}`);
        testResults.passed++;
      } else {
        logTest('Initiate Chat', 'FAIL', 'Room data not found in response');
        testResults.failed++;
      }
    } else {
      logTest('Initiate Chat', 'FAIL', `Status: ${initiateResponse.statusCode}`);
      log(`Response: ${JSON.stringify(initiateResponse.body, null, 2)}`, 'red');
      testResults.failed++;
    }
  } catch (error) {
    console.log('error==>', error);
    logTest('Initiate Chat', 'FAIL', error.message);
    testResults.failed++;
  }

  if (!createdRoomId) {
    log('\n⚠️  Cannot continue REST API tests without a room ID', 'yellow');
    log('   Please check your authentication token and user IDs', 'yellow');
    return;
  }

  // Test 2: Get Room by ID
  try {
    log('\n📝 Test 2: Get Room by ID (GET /chat/rooms/:roomId)', 'yellow');
    const roomResponse = await makeRequest(
      'GET',
      `/chat/rooms/${createdRoomId}?userId=${USER_1_ID}`,
      null,
      AUTH_TOKEN,
    );

    if (roomResponse.statusCode === 200) {
      logTest('Get Room by ID', 'PASS');
      testResults.passed++;
    } else {
      logTest('Get Room by ID', 'FAIL', `Status: ${roomResponse.statusCode}`);
      testResults.failed++;
    }
  } catch (error) {
    logTest('Get Room by ID', 'FAIL', error.message);
    testResults.failed++;
  }

  // Test 3: Send Message
  try {
    log('\n📝 Test 3: Send Message (POST /chat/rooms/:roomId/messages)', 'yellow');
    const messageResponse = await makeRequest(
      'POST',
      `/chat/rooms/${createdRoomId}/messages?userId=${USER_1_ID}`,
      {
        content: 'This is a second test message via REST API.',
      },
      AUTH_TOKEN,
    );

    if (messageResponse.statusCode === 201) {
      createdMessageId = messageResponse.body.data?._id || messageResponse.body.data?.id;
      logTest('Send Message', 'PASS', `Message ID: ${createdMessageId}`);
      testResults.passed++;
    } else {
      logTest('Send Message', 'FAIL', `Status: ${messageResponse.statusCode}`);
      testResults.failed++;
    }
  } catch (error) {
    logTest('Send Message', 'FAIL', error.message);
    testResults.failed++;
  }

  // Test 4: Get Messages
  try {
    log('\n📝 Test 4: Get Messages (GET /chat/rooms/:roomId/messages)', 'yellow');
    const messagesResponse = await makeRequest(
      'GET',
      `/chat/rooms/${createdRoomId}/messages?userId=${USER_1_ID}&page=1&limit=10`,
      null,
      AUTH_TOKEN,
    );

    if (messagesResponse.statusCode === 200) {
      const messageCount = messagesResponse.body.data?.messages?.length || 0;
      logTest('Get Messages', 'PASS', `Found ${messageCount} messages`);
      testResults.passed++;
    } else {
      logTest('Get Messages', 'FAIL', `Status: ${messagesResponse.statusCode}`);
      testResults.failed++;
    }
  } catch (error) {
    logTest('Get Messages', 'FAIL', error.message);
    testResults.failed++;
  }

  // Test 5: Get User Rooms
  try {
    log('\n📝 Test 5: Get User Rooms (GET /chat/rooms)', 'yellow');
    const roomsResponse = await makeRequest(
      'GET',
      `/chat/rooms?userId=${USER_1_ID}&page=1&limit=10`,
      null,
      AUTH_TOKEN,
    );

    if (roomsResponse.statusCode === 200) {
      const roomCount = roomsResponse.body.data?.rooms?.length || 0;
      logTest('Get User Rooms', 'PASS', `Found ${roomCount} rooms`);
      testResults.passed++;
    } else {
      logTest('Get User Rooms', 'FAIL', `Status: ${roomsResponse.statusCode}`);
      testResults.failed++;
    }
  } catch (error) {
    logTest('Get User Rooms', 'FAIL', error.message);
    testResults.failed++;
  }

  // Test 6: Get Unread Count
  try {
    log('\n📝 Test 6: Get Unread Count (GET /chat/rooms/:roomId/unread-count)', 'yellow');
    const unreadResponse = await makeRequest(
      'GET',
      `/chat/rooms/${createdRoomId}/unread-count?userId=${USER_2_ID}`,
      null,
      AUTH_TOKEN,
    );

    if (unreadResponse.statusCode === 200) {
      const unreadCount = unreadResponse.body.data?.unreadCount || 0;
      logTest('Get Unread Count', 'PASS', `Unread: ${unreadCount}`);
      testResults.passed++;
    } else {
      logTest('Get Unread Count', 'FAIL', `Status: ${unreadResponse.statusCode}`);
      testResults.failed++;
    }
  } catch (error) {
    logTest('Get Unread Count', 'FAIL', error.message);
    testResults.failed++;
  }
}

// ============================================
// Socket.IO Tests
// ============================================

async function testSocketIO() {
  logSection('Socket.IO Tests');

  return new Promise((resolve) => {
    let socketConnected = false;
    let roomJoined = false;
    let messageReceived = false;

    log('\n📝 Connecting to Socket.IO server...', 'yellow');
    const socket = io(SOCKET_URL, {
      query: { userId: USER_1_ID },
      transports: ['websocket', 'polling'],
      reconnection: false,
    });

    const timeout = setTimeout(() => {
      if (!socketConnected) {
        logTest('Socket.IO Connection', 'FAIL', 'Connection timeout');
        testResults.failed++;
        socket.disconnect();
        resolve();
      }
    }, 5000);

    socket.on('connect', () => {
      socketConnected = true;
      clearTimeout(timeout);
      logTest('Socket.IO Connection', 'PASS', `Socket ID: ${socket.id}`);
      testResults.passed++;

      // Join room
      if (createdRoomId) {
        setTimeout(() => {
          log('\n📝 Joining room via Socket.IO...', 'yellow');
          socket.emit('join-room', { roomId: createdRoomId });
        }, 1000);
      } else {
        logTest('Join Room', 'SKIP', 'No room ID available');
        testResults.skipped++;
        socket.disconnect();
        resolve();
      }
    });

    socket.on('connected', (data) => {
      log('   Server confirmed connection', 'green');
    });

    socket.on('room-joined', (data) => {
      roomJoined = true;
      logTest('Join Room', 'PASS');
      testResults.passed++;

      // Send a test message
      setTimeout(() => {
        log('\n📝 Sending message via Socket.IO...', 'yellow');
        socket.emit('send-message', {
          roomId: createdRoomId,
          content: 'Test message from Socket.IO connection',
        });
      }, 1000);
    });

    socket.on('message-received', (data) => {
      messageReceived = true;
      logTest('Receive Message', 'PASS', 'Message received via Socket.IO');
      testResults.passed++;

      setTimeout(() => {
        socket.disconnect();
        resolve();
      }, 1000);
    });

    socket.on('error', (error) => {
      logTest('Socket.IO Error', 'FAIL', error.message || 'Unknown error');
      testResults.failed++;
      socket.disconnect();
      resolve();
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      logTest('Socket.IO Connection', 'FAIL', error.message);
      testResults.failed++;
      resolve();
    });

    socket.on('disconnect', () => {
      if (socketConnected) {
        log('\n   Socket disconnected', 'yellow');
      }
    });
  });
}

// ============================================
// Main Test Runner
// ============================================

async function runTests() {
  log('\n🚀 Starting Comprehensive Chat Module Tests...', 'bright');
  log(`Server URL: ${SERVER_URL}`, 'blue');
  log(`Socket URL: ${SOCKET_URL}`, 'blue');
  log(`User 1 ID: ${USER_1_ID}`, 'blue');
  log(`User 2 ID: ${USER_2_ID}`, 'blue');
  log('', 'reset');

  // Validate configuration
  if (AUTH_TOKEN === 'your-jwt-token-here') {
    log('\n⚠️  WARNING: Please update AUTH_TOKEN with a valid JWT token', 'yellow');
    log('   REST API tests will be skipped', 'yellow');
    log('   Socket.IO tests will still run', 'yellow');
    log('', 'reset');
  }

  if (!USER_1_ID.match(/^[0-9a-fA-F]{24}$/)) {
    log('\n❌ ERROR: Invalid USER_1_ID format. Must be a MongoDB ObjectId', 'red');
    process.exit(1);
  }

  if (!USER_2_ID.match(/^[0-9a-fA-F]{24}$/)) {
    log('\n❌ ERROR: Invalid USER_2_ID format. Must be a MongoDB ObjectId', 'red');
    process.exit(1);
  }

  // Run REST API tests if token is provided
  if (AUTH_TOKEN !== 'your-jwt-token-here') {
    await testRestAPI();
  } else {
    logSection('REST API Tests');
    log('\n⚠️  REST API tests skipped - AUTH_TOKEN not configured', 'yellow');
    testResults.skipped += 6;
  }

  // Run Socket.IO tests
  await testSocketIO();

  // Print summary
  logSection('Test Summary');
  log(`\n✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  log(`⚠️  Skipped: ${testResults.skipped}`, 'yellow');
  log(`\n📊 Total: ${testResults.passed + testResults.failed + testResults.skipped}`, 'cyan');

  if (createdRoomId) {
    log(`\n💡 Created Room ID: ${createdRoomId}`, 'cyan');
    log('   You can use this room ID for further testing', 'cyan');
  }

  log('\n✨ Tests completed!', 'bright');
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

