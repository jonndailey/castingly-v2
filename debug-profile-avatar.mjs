#!/usr/bin/env node
import { chromium } from 'playwright';

const BASE_URL = 'https://castingly.dailey.dev';
const USERNAME = 'actor.demo@castingly.com';
const PASSWORD = 'Act0r!2025';

async function debugProfileAvatar() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  try {
    console.log('🔍 DEBUGGING PROFILE PAGE AVATAR\n');

    // Login
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="text"]', USERNAME);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/actor\/dashboard/, { timeout: 10000 });
    
    console.log('✅ Logged in to dashboard');
    
    // Get dashboard avatar
    await page.waitForTimeout(2000);
    const dashboardAvatar = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const avatarImg = imgs.find(img => 
        img.src.includes('avatar') || 
        img.src.includes('api/media') ||
        img.classList.contains('rounded-full')
      );
      return {
        src: avatarImg?.src || null,
        classes: avatarImg?.className || '',
        alt: avatarImg?.alt || ''
      };
    });
    
    console.log('Dashboard avatar:', dashboardAvatar);
    
    // Navigate to profile
    await page.click('text=Edit Profile');
    await page.waitForURL(/\/actor\/profile/, { timeout: 5000 });
    await page.waitForTimeout(2000);
    
    console.log('✅ Navigated to profile page');
    
    // Get all images on profile page
    const profileImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map((img, i) => ({
        index: i,
        src: img.src.substring(0, 100) + '...',
        classes: img.className,
        alt: img.alt,
        width: img.offsetWidth,
        height: img.offsetHeight,
        visible: img.offsetWidth > 0 && img.offsetHeight > 0
      }));
    });
    
    console.log('\nAll images on profile page:');
    profileImages.forEach(img => {
      console.log(`  [${img.index}] ${img.visible ? '👁️' : '🚫'} ${img.src}`);
      console.log(`      Classes: ${img.classes}`);
      console.log(`      Alt: "${img.alt}"`);
      console.log(`      Size: ${img.width}x${img.height}`);
      console.log('');
    });
    
    // Find the main profile avatar
    const profileAvatar = await page.evaluate(() => {
      // Look for the specific profile photo section
      const profilePhotoDiv = document.querySelector('.h-32.w-32.md\\:h-48.md\\:w-48');
      if (profilePhotoDiv) {
        const img = profilePhotoDiv.querySelector('img');
        return {
          src: img?.src || null,
          classes: img?.className || '',
          alt: img?.alt || '',
          found: 'in profile photo div'
        };
      }
      
      // Fallback: look for any large rounded image
      const imgs = Array.from(document.querySelectorAll('img'));
      const avatarImg = imgs.find(img => 
        (img.src.includes('avatar') || img.src.includes('api/media')) &&
        img.offsetWidth >= 100
      );
      
      return {
        src: avatarImg?.src || null,
        classes: avatarImg?.className || '',
        alt: avatarImg?.alt || '',
        found: 'fallback search'
      };
    });
    
    console.log('Main profile avatar found:', profileAvatar);
    
    // Compare URLs (strip query params for comparison)
    const dashboardBase = dashboardAvatar.src?.split('?')[0];
    const profileBase = profileAvatar.src?.split('?')[0];
    
    console.log('\nComparison:');
    console.log(`Dashboard base URL: ${dashboardBase}`);
    console.log(`Profile base URL:   ${profileBase}`);
    console.log(`Match: ${dashboardBase === profileBase ? '✅ YES' : '❌ NO'}`);
    
    if (dashboardBase !== profileBase) {
      console.log('\n🔍 Investigating difference...');
      console.log(`Dashboard full URL: ${dashboardAvatar.src}`);
      console.log(`Profile full URL:   ${profileAvatar.src}`);
      
      if (dashboardAvatar.src?.includes('serve/files') && !profileAvatar.src?.includes('serve/files')) {
        console.log('💡 Dashboard shows uploaded image, profile shows fallback/safe endpoint');
      }
      
      if (profileAvatar.src?.includes('ui-avatars')) {
        console.log('💡 Profile page is showing ui-avatars fallback');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugProfileAvatar().catch(console.error);
