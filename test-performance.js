#!/usr/bin/env node

import fetch from 'node-fetch';

async function testPerformance() {
  const baseUrl = 'http://localhost:8081';
  
  console.log('🚀 Testing 14-Day Endpoint Performance...\n');
  
  // Test 1: First call (should be slow)
  console.log('📊 Test 1: First call (uncached)');
  const start1 = Date.now();
  try {
    const response1 = await fetch(`${baseUrl}/api/whatsapp/items/14days`);
    const data1 = await response1.json();
    const time1 = Date.now() - start1;
    console.log(`⏱️  Time: ${time1}ms`);
    console.log(`📦 Response: ${JSON.stringify(data1).substring(0, 100)}...`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n' + '─'.repeat(50) + '\n');
  
  // Test 2: Second call (should be fast due to caching)
  console.log('📊 Test 2: Second call (cached)');
  const start2 = Date.now();
  try {
    const response2 = await fetch(`${baseUrl}/api/whatsapp/items/14days`);
    const data2 = await response2.json();
    const time2 = Date.now() - start2;
    console.log(`⏱️  Time: ${time2}ms`);
    console.log(`📦 Response: ${JSON.stringify(data2).substring(0, 100)}...`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n' + '─'.repeat(50) + '\n');
  
  // Test 3: Force refresh
  console.log('📊 Test 3: Force refresh (clear cache)');
  try {
    await fetch(`${baseUrl}/api/whatsapp/sync`, { method: 'POST' });
    const start3 = Date.now();
    const response3 = await fetch(`${baseUrl}/api/whatsapp/items/14days`);
    const data3 = await response3.json();
    const time3 = Date.now() - start3;
    console.log(`⏱️  Time: ${time3}ms`);
    console.log(`📦 Response: ${JSON.stringify(data3).substring(0, 100)}...`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n✨ Performance test completed!');
}

testPerformance().catch(console.error); 