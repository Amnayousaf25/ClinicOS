#!/usr/bin/env node
// @ts-check

const { spawn } = require('child_process');
const { exec } = require('child_process');

const PORT = process.env.PORT || 4002;

function getProcessOnPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -i :${port} -P -n 2>/dev/null | grep LISTEN | awk '{print $2}'`, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve(null);
      } else {
        resolve(parseInt(stdout.trim().split('\n')[0]));
      }
    });
  });
}

function killPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -i :${port} -P -n 2>/dev/null | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null`, () => {
      setTimeout(resolve, 500);
    });
  });
}

async function startServer() {
  // One-time cleanup before starting watch mode.
  const existingPid = await getProcessOnPort(PORT);
  if (existingPid) {
    console.log(`🔄 Cleaning up existing process on port ${PORT}...`);
    await killPort(PORT);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`🚀 Starting NestJS dev server on port ${PORT}...`);

  const nest = spawn('nest', ['start', '--watch', '--path', 'tsconfig.dev.json'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'dev',
    },
  });

  nest.on('exit', (code) => {
    console.log(`⚠️  NestJS process exited with code ${code}`);
    process.exit(code ?? 0);
  });

  // Handle SIGINT and SIGTERM
  process.on('SIGINT', () => {
    console.log('\n⏹️  Stopping server...');
    nest.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n⏹️  Stopping server...');
    nest.kill('SIGTERM');
  });
}

startServer().catch(console.error);
