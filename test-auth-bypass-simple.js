#!/usr/bin/env node

/**
 * Simple browser test to verify auth bypass works
 */

import puppeteer from 'puppeteer'

async function testAuthBypass() {
  console.log('🧪 TESTING AUTH BYPASS IN BROWSER')
  console.log('=' .repeat(50))
  
  const browser = await puppeteer.launch({ 
    headless: true, // Run headless for faster testing
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    
    // Capture console messages
    const consoleMessages = []
    page.on('console', msg => {
      const text = msg.text()
      consoleMessages.push(text)
      if (text.includes('BYPASS') || text.includes('test@dkdev.io')) {
        console.log('🚨 CONSOLE:', text)
      }
    })
    
    console.log('🌐 Navigating to http://localhost:5173')
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    })
    
    // Wait for React to load
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('🔍 Checking auth state...')
    
    // Check page content for auth indicators
    const authCheck = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasSignInForm: !!document.querySelector('form input[type="email"]'),
        bodyText: document.body.innerText.includes('test@dkdev.io'),
        localStorageAdmin: localStorage.getItem('admin_user'),
        // Look for any text that might indicate logged in state
        pageContent: {
          hasTestEmail: document.body.innerText.includes('test@dkdev.io'),
          hasTestUser: document.body.innerText.includes('Test User'),
          hasLogout: document.body.innerText.toLowerCase().includes('logout') || document.body.innerText.toLowerCase().includes('sign out'),
          hasDashboard: document.body.innerText.toLowerCase().includes('dashboard'),
          hasProfile: document.body.innerText.toLowerCase().includes('profile')
        }
      }
    })
    
    console.log('📊 Auth Check Results:')
    console.log('  Page Title:', authCheck.title)
    console.log('  Current URL:', authCheck.url)
    console.log('  Has Sign-in Form:', authCheck.hasSignInForm ? '❌ (bad)' : '✅ (good)')
    console.log('  Admin in localStorage:', authCheck.localStorageAdmin ? '✅' : '❌')
    console.log('  Page contains test@dkdev.io:', authCheck.pageContent.hasTestEmail ? '✅' : '❌')
    console.log('  Page contains "Test User":', authCheck.pageContent.hasTestUser ? '✅' : '❌')
    console.log('  Has logout option:', authCheck.pageContent.hasLogout ? '✅' : '❌')
    console.log('  Has dashboard link:', authCheck.pageContent.hasDashboard ? '✅' : '❌')
    
    // Check console messages for bypass warnings
    const bypassMessages = consoleMessages.filter(msg => 
      msg.includes('BYPASS') || 
      msg.includes('test@dkdev.io') || 
      msg.includes('DEVELOPMENT AUTH')
    )
    
    console.log('\\n🔍 Console Messages Analysis:')
    if (bypassMessages.length > 0) {
      console.log('  ✅ Found bypass-related console messages:')
      bypassMessages.forEach(msg => console.log(`    - ${msg}`))
    } else {
      console.log('  ❌ No bypass console messages detected')
    }
    
    // Test protected route access
    console.log('\\n🔒 Testing protected route...')
    try {
      await page.goto('http://localhost:5173/dashboard', { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      })
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const dashboardCheck = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        hasAuthRedirect: window.location.href.includes('/auth') || window.location.href.includes('/login')
      }))
      
      if (dashboardCheck.hasAuthRedirect) {
        console.log('  ❌ Redirected to auth page - bypass not working')
      } else if (dashboardCheck.url.includes('/dashboard')) {
        console.log('  ✅ Successfully accessed dashboard without redirect')
      } else {
        console.log(`  ⚠️  Unexpected URL: ${dashboardCheck.url}`)
      }
    } catch (error) {
      console.log('  ❌ Error testing dashboard access:', error.message)
    }
    
    // Final assessment
    console.log('\\n🎯 FINAL ASSESSMENT:')
    const indicators = [
      authCheck.localStorageAdmin,
      authCheck.pageContent.hasTestEmail,
      !authCheck.hasSignInForm,
      bypassMessages.length > 0
    ]
    
    const workingCount = indicators.filter(Boolean).length
    
    if (workingCount >= 3) {
      console.log('✅ AUTH BYPASS APPEARS TO BE WORKING!')
      console.log('   You should be automatically logged in as test@dkdev.io')
    } else if (workingCount >= 2) {
      console.log('⚠️  AUTH BYPASS PARTIALLY WORKING')
      console.log('   Some indicators present but may need verification')
    } else {
      console.log('❌ AUTH BYPASS DOES NOT APPEAR TO BE WORKING')
      console.log('   You may need to check the implementation')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    await browser.close()
    console.log('\\n✅ Test completed')
  }
}

testAuthBypass().catch(console.error)