#!/bin/bash

# Script to open multiple Terminal windows for parallel testing
# Each window will have a specific title and navigate to the crypto-campaign-unified directory

echo "Opening 5 Terminal windows for crypto campaign testing..."

# Shell 1: Data Generator
osascript <<EOF
tell application "Terminal"
    do script "cd /Users/Danallovertheplace/crypto-campaign-unified && echo '=== Shell 1: DATA GENERATOR ===' && echo 'Ready for data generation prompt' && echo '' && PS1='DATA-GEN> ' bash"
    set custom title of front window to "DATA-GENERATOR"
end tell
EOF

sleep 1

# Shell 2: Browser Pool
osascript <<EOF
tell application "Terminal"
    do script "cd /Users/Danallovertheplace/crypto-campaign-unified && echo '=== Shell 2: BROWSER POOL ===' && echo 'Ready for Puppeteer browser automation' && echo '' && PS1='BROWSER> ' bash"
    set custom title of front window to "BROWSER-POOL"
end tell
EOF

sleep 1

# Shell 3: Persona Simulator
osascript <<EOF
tell application "Terminal"
    do script "cd /Users/Danallovertheplace/crypto-campaign-unified && echo '=== Shell 3: PERSONA SIMULATOR ===' && echo 'Ready for user persona simulations' && echo '' && PS1='PERSONA> ' bash"
    set custom title of front window to "PERSONA-SIMULATOR"
end tell
EOF

sleep 1

# Shell 4: Monitor Dashboard
osascript <<EOF
tell application "Terminal"
    do script "cd /Users/Danallovertheplace/crypto-campaign-unified && echo '=== Shell 4: MONITOR DASHBOARD ===' && echo 'Ready for real-time monitoring' && echo '' && PS1='MONITOR> ' bash"
    set custom title of front window to "MONITOR-DASHBOARD"
end tell
EOF

sleep 1

# Shell 5: Database Setup
osascript <<EOF
tell application "Terminal"
    do script "cd /Users/Danallovertheplace/crypto-campaign-unified && echo '=== Shell 5: DATABASE SETUP ===' && echo 'Ready for Supabase configuration' && echo '' && PS1='DB-SETUP> ' bash"
    set custom title of front window to "DATABASE-SETUP"
end tell
EOF

echo "All 5 Terminal windows opened successfully!"
echo ""
echo "Windows created:"
echo "1. DATA-GENERATOR - For creating mock test data"
echo "2. BROWSER-POOL - For Puppeteer automation"
echo "3. PERSONA-SIMULATOR - For user behavior simulation"
echo "4. MONITOR-DASHBOARD - For real-time test monitoring"
echo "5. DATABASE-SETUP - For Supabase configuration"