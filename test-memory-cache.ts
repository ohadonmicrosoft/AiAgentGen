// Simple test runner for MemoryCache
import { MemoryCache } from './server/lib/cache.js';

// Helper function to run tests
async function runTests() {
  console.log('Running MemoryCache tests...');
  
  let passedTests = 0;
  let failedTests = 0;
  
  // Create a test cache
  const cache = new MemoryCache({
    defaultTTL: 1000, // 1 second
    maxSize: 100,
    cleanupInterval: 500, // 0.5 seconds
    useLRU: true
  });
  
  // Test 1: Set and get values
  try {
    cache.set('key1', 'value1');
    const value = cache.get('key1');
    
    if (value === 'value1') {
      console.log('✅ Test 1 passed: Set and get values');
      passedTests++;
    } else {
      console.log(`❌ Test 1 failed: Expected 'value1', got '${value}'`);
      failedTests++;
    }
  } catch (error: any) {
    console.log(`❌ Test 1 failed with error: ${error.message}`);
    failedTests++;
  }
  
  // Test 2: Check if key exists
  try {
    cache.set('key2', 'value2');
    const hasKey = cache.has('key2');
    const hasNonExistent = cache.has('nonexistent');
    
    if (hasKey === true && hasNonExistent === false) {
      console.log('✅ Test 2 passed: Check if key exists');
      passedTests++;
    } else {
      console.log(`❌ Test 2 failed: Expected true for 'key2' and false for 'nonexistent', got ${hasKey} and ${hasNonExistent}`);
      failedTests++;
    }
  } catch (error: any) {
    console.log(`❌ Test 2 failed with error: ${error.message}`);
    failedTests++;
  }
  
  // Test 3: Delete a value
  try {
    cache.set('key3', 'value3');
    cache.delete('key3');
    const value = cache.get('key3');
    
    if (value === undefined) {
      console.log('✅ Test 3 passed: Delete a value');
      passedTests++;
    } else {
      console.log(`❌ Test 3 failed: Expected undefined, got '${value}'`);
      failedTests++;
    }
  } catch (error: any) {
    console.log(`❌ Test 3 failed with error: ${error.message}`);
    failedTests++;
  }
  
  // Test 4: Clear all values
  try {
    cache.set('key4', 'value4');
    cache.set('key5', 'value5');
    cache.clear();
    
    if (cache.getStats().size === 0) {
      console.log('✅ Test 4 passed: Clear all values');
      passedTests++;
    } else {
      console.log(`❌ Test 4 failed: Expected size 0, got ${cache.getStats().size}`);
      failedTests++;
    }
  } catch (error: any) {
    console.log(`❌ Test 4 failed with error: ${error.message}`);
    failedTests++;
  }
  
  // Test 5: Delete values matching a pattern
  try {
    cache.set('user:1', 'user 1 data');
    cache.set('user:2', 'user 2 data');
    cache.set('post:1', 'post 1 data');
    
    const count = cache.deletePattern(/^user:/);
    
    if (count === 2 && cache.get('user:1') === undefined && cache.get('post:1') !== undefined) {
      console.log('✅ Test 5 passed: Delete values matching a pattern');
      passedTests++;
    } else {
      console.log(`❌ Test 5 failed: Expected count 2, user:1 undefined, post:1 defined`);
      failedTests++;
    }
  } catch (error: any) {
    console.log(`❌ Test 5 failed with error: ${error.message}`);
    failedTests++;
  }
  
  // Test 6: TTL expiration
  try {
    cache.set('shortLived', 'value', 100); // 100ms TTL
    
    if (cache.get('shortLived') === 'value') {
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      if (cache.get('shortLived') === undefined) {
        console.log('✅ Test 6 passed: TTL expiration');
        passedTests++;
      } else {
        console.log(`❌ Test 6 failed: Value should have expired`);
        failedTests++;
      }
    } else {
      console.log(`❌ Test 6 failed: Value not set correctly`);
      failedTests++;
    }
  } catch (error: any) {
    console.log(`❌ Test 6 failed with error: ${error.message}`);
    failedTests++;
  }
  
  // Test 7: Max size limit
  try {
    const smallCache = new MemoryCache({
      maxSize: 3,
      useLRU: true
    });
    
    smallCache.set('key1', 'value1');
    smallCache.set('key2', 'value2');
    smallCache.set('key3', 'value3');
    
    // Access key2 to make it most recently used
    smallCache.get('key2');
    
    // Add a 4th item
    smallCache.set('key4', 'value4');
    
    if (smallCache.getStats().size === 3 && 
        smallCache.get('key1') === undefined && 
        smallCache.get('key2') === 'value2' &&
        smallCache.get('key3') === 'value3' &&
        smallCache.get('key4') === 'value4') {
      console.log('✅ Test 7 passed: Max size limit');
      passedTests++;
    } else {
      console.log(`❌ Test 7 failed: LRU eviction not working correctly`);
      failedTests++;
    }
  } catch (error: any) {
    console.log(`❌ Test 7 failed with error: ${error.message}`);
    failedTests++;
  }
  
  // Print summary
  console.log(`\nTest summary: ${passedTests} passed, ${failedTests} failed`);
  
  // Clean up
  cache.stopCleanup();
}

// Run the tests
runTests().catch(error => {
  console.error('Test runner failed:', error);
}); 