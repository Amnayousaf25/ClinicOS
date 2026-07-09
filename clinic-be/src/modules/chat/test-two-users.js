/**
 * Two-User Chat Test Script
 * 
 * This script creates two Socket.IO connections (User 1 and User 2)
 * and tests message exchange between them.
 * 
 * Usage:
 * 1. Update USER_1_ID, USER_2_ID, and ROOM_ID below
 * 2. Install: npm install socket.io-client
 * 3. Run: node test-two-users.js
 */

const { io } = require('socket.io-client');

// ============================================
// CONFIGURATION - Update these values
// ============================================
const SERVER_URL = 'http://localhost:8080/chat';
const USER_1_ID = '507f1f77bcf86cd799439011'; // Replace with actual user ID
const USER_2_ID = '507f1f77bcf86cd799439012'; // Replace with actual user ID
const ROOM_ID = '507f1f77bcf86cd799439013';   // Replace with actual room ID
// ============================================

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(user, message, color = 'reset') {
  const prefix = user === 1 ? '[USER 1]' : '[USER 2]';
  console.log(`${colors[color]}${prefix} ${message}${colors.reset}`);
}

console.log('\n🚀 Starting Two-User Chat Test...\n');
console.log(`Server: ${SERVER_URL}`);
console.log(`User 1: ${USER_1_ID}`);
console.log(`User 2: ${USER_2_ID}`);
console.log(`Room: ${ROOM_ID}\n`);

// ============================================
// User 1 Connection
// ============================================
const user1 = io(SERVER_URL, {
  query: { userId: USER_1_ID },
  transports: ['websocket', 'polling'],
});

user1.on('connect', () => {
  log(1, '✅ Connected!', 'green');
  log(1, `Socket ID: ${user1.id}`, 'blue');
  
  // Join room
  setTimeout(() => {
    log(1, '📥 Joining room...', 'yellow');
    user1.emit('join-room', { roomId: ROOM_ID });
  }, 1000);
});

user1.on('connected', (data) => {
  log(1, `✅ Server confirmed: ${JSON.stringify(data)}`, 'green');
});

user1.on('room-joined', (data) => {
  log(1, `✅ Room joined: ${data.roomId}`, 'green');
  
  // User 1 sends first message after 2 seconds
  setTimeout(() => {
    log(1, '📤 Sending message: "Hello from User 1!"', 'yellow');
    user1.emit('send-message', {
      roomId: ROOM_ID,
      content: 'Hello from User 1!',
    });
  }, 2000);
});

user1.on('message-received', (data) => {
  const isFromSelf = data.message.senderId === USER_1_ID;
  const sender = isFromSelf ? 'myself (confirmation)' : 'User 2';
  log(1, `📨 Message received: "${data.message.content}"`, 'cyan');
  log(1, `   From: ${sender}`, 'blue');
});

user1.on('messages-read', (data) => {
  log(1, `✅ Messages marked as read by: ${data.readBy}`, 'green');
});

user1.on('error', (error) => {
  log(1, `❌ Error: ${error.message}`, 'red');
});

user1.on('disconnect', (reason) => {
  log(1, `❌ Disconnected: ${reason}`, 'red');
});

// ============================================
// User 2 Connection
// ============================================
const user2 = io(SERVER_URL, {
  query: { userId: USER_2_ID },
  transports: ['websocket', 'polling'],
});

user2.on('connect', () => {
  log(2, '✅ Connected!', 'green');
  log(2, `Socket ID: ${user2.id}`, 'blue');
  
  // Join room
  setTimeout(() => {
    log(2, '📥 Joining room...', 'yellow');
    user2.emit('join-room', { roomId: ROOM_ID });
  }, 1000);
});

user2.on('connected', (data) => {
  log(2, `✅ Server confirmed: ${JSON.stringify(data)}`, 'green');
});

user2.on('room-joined', (data) => {
  log(2, `✅ Room joined: ${data.roomId}`, 'green');
  
  // User 2 sends message after 4 seconds (after User 1)
  setTimeout(() => {
    log(2, '📤 Sending message: "Hi from User 2!"', 'yellow');
    user2.emit('send-message', {
      roomId: ROOM_ID,
      content: 'Hi from User 2!',
    });
  }, 4000);
  
  // User 2 marks messages as read after 6 seconds
  setTimeout(() => {
    log(2, '✅ Marking all messages as read...', 'yellow');
    user2.emit('mark-as-read', { roomId: ROOM_ID });
  }, 6000);
});

user2.on('message-received', (data) => {
  const isFromSelf = data.message.senderId === USER_2_ID;
  const sender = isFromSelf ? 'myself (confirmation)' : 'User 1';
  log(2, `📨 Message received: "${data.message.content}"`, 'cyan');
  log(2, `   From: ${sender}`, 'blue');
});

user2.on('messages-read', (data) => {
  log(2, `✅ Messages marked as read by: ${data.readBy}`, 'green');
});

user2.on('error', (error) => {
  log(2, `❌ Error: ${error.message}`, 'red');
});

user2.on('disconnect', (reason) => {
  log(2, `❌ Disconnected: ${reason}`, 'red');
});

// ============================================
// Cleanup
// ============================================
process.on('SIGINT', () => {
  console.log('\n\n👋 Disconnecting both users...');
  user1.disconnect();
  user2.disconnect();
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

console.log('💡 Press Ctrl+C to exit\n');
console.log('⏳ Waiting for connections and messages...\n');

