#!/usr/bin/env node
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL || 'https://castingly.dailey.dev'
const USERNAME = process.env.USERNAME || 'actor.demo@castingly.com'
const PASSWORD = process.env.PASSWORD || 'Act0r!2025'

async function checkAvatarSize() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  })
  const page = await context.newPage()

  try {
    console.log('🔍 Checking avatar size on Castingly...\n')

    // Navigate to login page
    console.log('📍 Navigating to login page...')
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })

    // Login
    console.log('🔐 Logging in...')
    
    // Wait for form to be visible
    await page.waitForSelector('form', { timeout: 10000 })
    
    // Find the username/email field (it's type="text" with label="Username")
    const usernameInput = await page.locator('input[type="text"]').first()
    await usernameInput.fill(USERNAME)
    console.log('  - Filled username field')
    
    // Find the password field
    const passwordInput = await page.locator('input[type="password"]').first()
    await passwordInput.fill(PASSWORD)  
    console.log('  - Filled password field')
    
    // Submit form
    const submitSelectors = ['button[type="submit"]', 'button:has-text("Log in")', 'button:has-text("Sign in")']
    let submitted = false
    for (const selector of submitSelectors) {
      try {
        await page.click(selector, { timeout: 5000 })
        submitted = true
        console.log(`  - Submitted with: ${selector}`)
        break
      } catch {}
    }
    if (!submitted) throw new Error('Could not find submit button')
    
    // Wait for navigation to complete
    await page.waitForURL(/\/actor\/dashboard/, { timeout: 30000 })
    console.log('✅ Successfully logged in\n')

    // Check dashboard avatar
    console.log('📐 Checking avatar size on Dashboard:')
    
    // Wait a bit for dynamic content to load
    await page.waitForTimeout(2000)
    
    // Try to find any image that could be an avatar
    const allImages = await page.locator('img').all()
    console.log(`  Found ${allImages.length} total images on page`)
    
    // Look for avatar-like images
    for (const img of allImages) {
      const box = await img.boundingBox()
      const src = await img.getAttribute('src')
      const alt = await img.getAttribute('alt')
      const className = await img.getAttribute('class')
      
      // Check if this looks like an avatar (circular, certain size, etc)
      if (box && (src?.includes('avatar') || src?.includes('headshot') || className?.includes('rounded-full') || (box.width === box.height && box.width >= 32))) {
        console.log(`  Found potential avatar:`)
        console.log(`    - Size: ${Math.round(box.width)}x${Math.round(box.height)}px`)
        console.log(`    - Alt: ${alt || '(none)'}`)
        console.log(`    - Class: ${className || '(none)'}`)
        console.log(`    - Src: ${src?.substring(0, 100)}...`)
        
        // Check if it's 64x64 (the problem size)
        if (Math.round(box.width) === 64) {
          console.log(`    ⚠️ This is 64x64px - TOO SMALL!`)
        }
      }
    }
    
    // Original check
    const dashboardAvatar = await page.locator('img[alt*="profile"], img[alt*="avatar"], .rounded-full img').first()
    
    if (await dashboardAvatar.count() > 0) {
      const dashboardBox = await dashboardAvatar.boundingBox()
      const dashboardStyles = await dashboardAvatar.evaluate(el => {
        const computed = window.getComputedStyle(el)
        const parent = el.parentElement
        const parentComputed = parent ? window.getComputedStyle(parent) : null
        return {
          img: {
            width: computed.width,
            height: computed.height,
            className: el.className,
            src: el.src
          },
          parent: parent ? {
            width: parentComputed?.width,
            height: parentComputed?.height,
            className: parent.className
          } : null
        }
      })
      
      console.log('  Dashboard Avatar (Desktop view):')
      console.log('  - Actual rendered size:', dashboardBox ? `${Math.round(dashboardBox.width)}x${Math.round(dashboardBox.height)}px` : 'Not found')
      console.log('  - Computed img styles:', dashboardStyles.img)
      if (dashboardStyles.parent) {
        console.log('  - Parent container:', dashboardStyles.parent)
      }
    } else {
      console.log('  ❌ Avatar not found on dashboard')
    }

    // Check mobile view
    console.log('\n📱 Checking mobile view (375px width):')
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000)
    
    const mobileAvatar = await page.locator('img[alt*="profile"], img[alt*="avatar"], .rounded-full img').first()
    if (await mobileAvatar.count() > 0) {
      const mobileBox = await mobileAvatar.boundingBox()
      console.log('  - Mobile size:', mobileBox ? `${Math.round(mobileBox.width)}x${Math.round(mobileBox.height)}px` : 'Not found')
    }

    // Navigate to profile page
    console.log('\n📍 Navigating to Profile page...')
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto(`${BASE_URL}/actor/profile`, { waitUntil: 'networkidle' })
    
    console.log('📐 Checking avatar size on Profile page:')
    const profileAvatar = await page.locator('.rounded-full img, img[alt*="profile"], img[alt*="avatar"]').first()
    
    if (await profileAvatar.count() > 0) {
      const profileBox = await profileAvatar.boundingBox()
      const profileStyles = await profileAvatar.evaluate(el => {
        const computed = window.getComputedStyle(el)
        const parent = el.parentElement
        const parentComputed = parent ? window.getComputedStyle(parent) : null
        return {
          img: {
            width: computed.width,
            height: computed.height,
            className: el.className
          },
          parent: parent ? {
            width: parentComputed?.width,
            height: parentComputed?.height,
            className: parent.className
          } : null
        }
      })
      
      console.log('  Profile Avatar (Desktop):')
      console.log('  - Actual rendered size:', profileBox ? `${Math.round(profileBox.width)}x${Math.round(profileBox.height)}px` : 'Not found')
      console.log('  - Computed styles:', profileStyles.img)
      if (profileStyles.parent) {
        console.log('  - Parent container:', profileStyles.parent)
      }
    }

    // Check for any Avatar components using the old sizing
    console.log('\n🔍 Checking for Avatar components with old sizing:')
    const oldSizedAvatars = await page.locator('.h-16.w-16, .h-20.w-20').all()
    if (oldSizedAvatars.length > 0) {
      console.log(`  ⚠️ Found ${oldSizedAvatars.length} elements with old sizing classes (h-16 w-16 or h-20 w-20)`)
      for (let i = 0; i < Math.min(3, oldSizedAvatars.length); i++) {
        const className = await oldSizedAvatars[i].getAttribute('class')
        console.log(`    - Element ${i + 1}: ${className}`)
      }
    } else {
      console.log('  ✅ No elements found with old sizing classes')
    }

    console.log('\n✅ Avatar size check complete!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

checkAvatarSize().catch(console.error)