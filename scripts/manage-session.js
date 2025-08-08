#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const SESSION_PATH = '.wwebjs_auth';
const CACHE_PATH = '.wwebjs_cache';

function checkSession() {
  const sessionExists = fs.existsSync(SESSION_PATH);
  const cacheExists = fs.existsSync(CACHE_PATH);
  
  console.log('📱 WhatsApp Session Status:');
  console.log(`Session: ${sessionExists ? '✅ Found' : '❌ Not found'}`);
  console.log(`Cache: ${cacheExists ? '✅ Found' : '❌ Not found'}`);
  
  if (sessionExists) {
    const sessionFiles = fs.readdirSync(SESSION_PATH);
    console.log(`Session files: ${sessionFiles.join(', ')}`);
  }
}

function clearSession() {
  console.log('🗑️  Clearing session...');
  
  if (fs.existsSync(SESSION_PATH)) {
    fs.rmSync(SESSION_PATH, { recursive: true, force: true });
    console.log('✅ Session cleared');
  } else {
    console.log('ℹ️  No session to clear');
  }
  
  if (fs.existsSync(CACHE_PATH)) {
    fs.rmSync(CACHE_PATH, { recursive: true, force: true });
    console.log('✅ Cache cleared');
  } else {
    console.log('ℹ️  No cache to clear');
  }
}

function clearCacheOnly() {
  console.log('🗑️  Clearing cache only...');
  
  if (fs.existsSync(CACHE_PATH)) {
    fs.rmSync(CACHE_PATH, { recursive: true, force: true });
    console.log('✅ Cache cleared (session preserved)');
  } else {
    console.log('ℹ️  No cache to clear');
  }
}

const command = process.argv[2];

switch (command) {
  case 'check':
    checkSession();
    break;
  case 'clear':
    clearSession();
    break;
  case 'clear-cache':
    clearCacheOnly();
    break;
  default:
    console.log('📱 WhatsApp Session Manager');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/manage-session.js check      - Check session status');
    console.log('  node scripts/manage-session.js clear       - Clear session and cache');
    console.log('  node scripts/manage-session.js clear-cache - Clear cache only (preserve session)');
    console.log('');
    console.log('💡 Tips:');
    console.log('  - Use "clear" only if you want to force re-authentication');
    console.log('  - Use "clear-cache" to fix browser issues while keeping your session');
    break;
} 