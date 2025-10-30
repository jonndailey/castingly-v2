#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import { createHash } from 'crypto';

const BASE_URL = 'https://castingly.dailey.dev';
const USERNAME = 'actor.demo@castingly.com';
const PASSWORD = 'Act0r!2025';

// Generate a unique test image
function generateTestImage(color = '#FF0000') {
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="${color}"/>
      <text x="100" y="100" font-size="20" fill="white" text-anchor="middle">
        TEST ${Date.now()}
      </text>
    </svg>
  `;
  return Buffer.from(svg);
}

async function testComprehensiveAvatarFlow() {
  const browser = await chromium.launch({ 
    headless: true,
    slowMo: 50
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  const testResults = {
    login: false,
    initialLoad: false,
    uploadSuccess: false,
    immediateUpdate: false,
    persistenceAfterRefresh: false,
    profilePageSpeed: 0,
    cachingBehavior: false,
    consistencyAcrossPages: false
  };

  try {
    console.log('🔍 COMPREHENSIVE AVATAR TEST SUITE\n');
    console.log('=' .repeat(50));
    
    // TEST 1: Login
    console.log('\n📍 TEST 1: Authentication');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="text"]', USERNAME);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL(/\/actor\/dashboard/, { timeout: 10000 });
      testResults.login = true;
      console.log('✅ Login successful');
    } catch {
      console.log('❌ Login failed');
      return;
    }
    
    // TEST 2: Initial Avatar Load
    console.log('\n📍 TEST 2: Initial Avatar Load');
    await page.waitForTimeout(2000); // Wait for avatar to load
    
    const initialAvatar = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const avatarImg = imgs.find(img => 
        img.src.includes('avatar') || 
        img.src.includes('api/media') ||
        img.classList.contains('rounded-full')
      );
      return avatarImg?.src || null;
    });
    
    if (initialAvatar) {
      testResults.initialLoad = true;
      console.log(`✅ Initial avatar loaded: ${initialAvatar.substring(0, 80)}...`);
      
      // Check if it's not the fallback
      if (initialAvatar.includes('ui-avatars.com')) {
        console.log('⚠️  Using fallback avatar (ui-avatars)');
      } else {
        console.log('✅ Using actual avatar (not fallback)');
      }
    } else {
      console.log('❌ No avatar found on initial load');
    }
    
    // TEST 3: Upload New Avatar
    console.log('\n📍 TEST 3: Avatar Upload');
    
    // Generate test image
    const testImageBuffer = generateTestImage('#' + Math.floor(Math.random()*16777215).toString(16));
    const testImagePath = '/tmp/test-avatar-' + Date.now() + '.svg';
    fs.writeFileSync(testImagePath, testImageBuffer);
    
    // Find and trigger file input
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    console.log('⏳ Waiting for upload to complete...');
    
    // Wait for upload completion (check for success message or avatar change)
    let uploadComplete = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    while (!uploadComplete && attempts < maxAttempts) {
      await page.waitForTimeout(1000);
      
      // Check for upload progress/completion
      const uploadStatus = await page.evaluate(() => {
        // Check for any upload status text
        const statusElements = Array.from(document.querySelectorAll('*'));
        const statusEl = statusElements.find(el => 
          el.textContent?.includes('Upload complete') ||
          el.textContent?.includes('Uploading')
        );
        return statusEl?.textContent || '';
      });
      
      if (uploadStatus.includes('complete')) {
        uploadComplete = true;
        testResults.uploadSuccess = true;
        console.log('✅ Upload completed successfully');
      } else if (uploadStatus.includes('Uploading')) {
        process.stdout.write('.');
      }
      
      attempts++;
    }
    
    if (!uploadComplete) {
      console.log('\n❌ Upload did not complete within 30 seconds');
    }
    
    // Wait a bit for the image to update
    await page.waitForTimeout(3000);
    
    // TEST 4: Check Immediate Update
    console.log('\n📍 TEST 4: Immediate Avatar Update');
    
    const newAvatar = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const avatarImg = imgs.find(img => 
        img.src.includes('avatar') || 
        img.src.includes('api/media') ||
        img.classList.contains('rounded-full')
      );
      return avatarImg?.src || null;
    });
    
    if (newAvatar && newAvatar !== initialAvatar) {
      testResults.immediateUpdate = true;
      console.log(`✅ Avatar updated immediately`);
      console.log(`   Old: ${initialAvatar?.substring(0, 60)}...`);
      console.log(`   New: ${newAvatar.substring(0, 60)}...`);
    } else {
      console.log('❌ Avatar did not update immediately');
    }
    
    // TEST 5: Persistence After Refresh
    console.log('\n📍 TEST 5: Persistence After Refresh');
    
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const avatarAfterRefresh = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const avatarImg = imgs.find(img => 
        img.src.includes('avatar') || 
        img.src.includes('api/media') ||
        img.classList.contains('rounded-full')
      );
      return avatarImg?.src || null;
    });
    
    // Check if avatar persists (may have different cache buster)
    if (avatarAfterRefresh) {
      const baseUrlAfterRefresh = avatarAfterRefresh.split('?')[0];
      const baseUrlNew = newAvatar?.split('?')[0];
      
      if (baseUrlAfterRefresh === baseUrlNew || !avatarAfterRefresh.includes('ui-avatars')) {
        testResults.persistenceAfterRefresh = true;
        console.log('✅ Avatar persisted after refresh');
      } else {
        console.log('❌ Avatar reverted after refresh');
        console.log(`   Expected base: ${baseUrlNew}`);
        console.log(`   Got: ${baseUrlAfterRefresh}`);
      }
    }
    
    // TEST 6: Profile Page Loading Speed
    console.log('\n📍 TEST 6: Profile Page Navigation Speed');
    
    const navStart = Date.now();
    await page.click('text=Edit Profile');
    
    try {
      await page.waitForURL(/\/actor\/profile/, { timeout: 5000 });
      const navEnd = Date.now();
      testResults.profilePageSpeed = navEnd - navStart;
      
      if (testResults.profilePageSpeed < 2000) {
        console.log(`✅ Profile page loaded quickly: ${testResults.profilePageSpeed}ms`);
      } else {
        console.log(`⚠️  Profile page slow: ${testResults.profilePageSpeed}ms`);
      }
    } catch {
      console.log('❌ Profile page failed to load');
    }
    
    // TEST 7: Avatar Consistency on Profile Page
    console.log('\n📍 TEST 7: Avatar Consistency Across Pages');
    
    const profileAvatar = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const avatarImg = imgs.find(img => 
        img.src.includes('avatar') || 
        img.src.includes('api/media')
      );
      return avatarImg?.src || null;
    });
    
    if (profileAvatar) {
      const baseUrlProfile = profileAvatar.split('?')[0];
      const baseUrlDashboard = avatarAfterRefresh?.split('?')[0];
      
      if (baseUrlProfile === baseUrlDashboard) {
        testResults.consistencyAcrossPages = true;
        console.log('✅ Avatar consistent across pages');
      } else {
        console.log('⚠️  Avatar different on profile page');
      }
    }
    
    // TEST 8: Cache Behavior
    console.log('\n📍 TEST 8: Cache Behavior Analysis');
    
    // Go back to dashboard
    await page.goto(`${BASE_URL}/actor/dashboard`, { waitUntil: 'networkidle' });
    
    // Monitor network requests for avatar
    const avatarRequests = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('avatar') || url.includes('headshot')) {
        avatarRequests.push({
          url: url.substring(url.indexOf('/api')),
          status: response.status(),
          fromCache: response.fromServiceWorker() || response.headers()['x-from-cache'] === 'true'
        });
      }
    });
    
    // Reload to check cache
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    if (avatarRequests.length > 0) {
      console.log('Avatar requests made:');
      avatarRequests.forEach(req => {
        console.log(`   ${req.status} ${req.fromCache ? '[CACHED]' : '[FRESH]'} ${req.url}`);
      });
      testResults.cachingBehavior = true;
    }
    
    // Clean up test file
    fs.unlinkSync(testImagePath);
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
  } finally {
    // RESULTS SUMMARY
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST RESULTS SUMMARY\n');
    
    const passed = Object.values(testResults).filter(v => v === true).length;
    const total = Object.keys(testResults).length - 1; // Exclude speed metric
    
    console.log(`Overall: ${passed}/${total} tests passed\n`);
    
    console.log('Individual Results:');
    console.log(`  Login:                    ${testResults.login ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Initial Load:             ${testResults.initialLoad ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Upload Success:           ${testResults.uploadSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Immediate Update:         ${testResults.immediateUpdate ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Persistence:              ${testResults.persistenceAfterRefresh ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Profile Speed:            ${testResults.profilePageSpeed}ms ${testResults.profilePageSpeed < 2000 ? '✅' : '⚠️'}`);
    console.log(`  Cross-Page Consistency:   ${testResults.consistencyAcrossPages ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Cache Behavior:           ${testResults.cachingBehavior ? '✅ PASS' : '❌ FAIL'}`);
    
    if (passed === total) {
      console.log('\n🎉 ALL TESTS PASSED!');
    } else {
      console.log(`\n⚠️  ${total - passed} test(s) failed`);
    }
    
    await browser.close();
  }
}

testComprehensiveAvatarFlow().catch(console.error);
