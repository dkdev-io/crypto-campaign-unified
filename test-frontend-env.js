#!/usr/bin/env node

// Test script to check if frontend can load environment variables correctly
// This simulates how Vite loads environment variables

import { readFileSync } from 'fs'
import { resolve } from 'path'

console.log('🔍 Testing Frontend Environment Variable Loading')

// Check if .env file exists and read it
const frontendDir = '/Users/Danallovertheplace/crypto-campaign-unified/frontend'
const envPath = resolve(frontendDir, '.env')

try {
  const envContent = readFileSync(envPath, 'utf8')
  console.log('\n📄 .env file contents:')
  console.log(envContent)
  
  // Parse environment variables
  const lines = envContent.split('\n')
  const envVars = {}
  
  lines.forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=')
      envVars[key] = value
    }
  })
  
  console.log('\n🔑 Parsed environment variables:')
  Object.keys(envVars).forEach(key => {
    if (key.includes('KEY') || key.includes('TOKEN')) {
      console.log(`${key}: ${envVars[key].substring(0, 20)}...`)
    } else {
      console.log(`${key}: ${envVars[key]}`)
    }
  })
  
  // Check if required variables exist
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
  console.log('\n✅ Required variables check:')
  required.forEach(key => {
    if (envVars[key]) {
      console.log(`✅ ${key}: Present`)
    } else {
      console.log(`❌ ${key}: Missing`)
    }
  })
  
} catch (error) {
  console.error('❌ Error reading .env file:', error.message)
}

// Simulate how the supabase.js file would behave
console.log('\n🧪 Simulating supabase.js behavior:')

// These are the variables as they would be available in the browser
const mockImportMeta = {
  env: {
    VITE_SUPABASE_URL: 'https://kmepcdsklnnxokoimvzo.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZXBjZHNrbG5ueG9rb2ltdnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDYyNDgsImV4cCI6MjA3MTEyMjI0OH0.7fa_fy4aWlz0PZvwC90X1r_6UMHzBujnN0fIngva1iI'
  }
}

const supabaseUrl = mockImportMeta.env.VITE_SUPABASE_URL || 'https://kmepcdsklnnxokoimvzo.supabase.co'
const supabaseAnonKey = mockImportMeta.env.VITE_SUPABASE_ANON_KEY

console.log('URL:', supabaseUrl)
console.log('Key present:', !!supabaseAnonKey)

if (!supabaseAnonKey) {
  console.log('❌ Would use fallback mock implementation')
  console.log('🔧 Auth operations would return "Supabase not configured" errors')
} else {
  console.log('✅ Would create real Supabase client')
}