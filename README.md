# Crypto Campaign Setup

A multi-platform cryptocurrency campaign donation system with seamless GitHub integration.

## 🔄 Multi-Platform Sync Workflow

This project supports development across **Lovable**, **Replit**, and **Local** environments with automatic two-way synchronization through GitHub.

### Quick Start

1. **Initial Setup** (run once):
   ```bash
   ./sync-setup.sh
   ```

2. **Before Working** (always run first):
   ```bash
   ./sync-start.sh
   ```

3. **After Changes** (save your work):
   ```bash
   ./sync-save.sh
   ```

4. **Fix Conflicts** (if needed):
   ```bash
   ./sync-fix.sh
   ```

## 🛠 Sync Scripts

### `./sync-setup.sh` - Initial GitHub Connection
- Connects local repository to GitHub
- Sets up proper remote tracking
- Creates initial commit if needed
- One-time setup script

### `./sync-start.sh` - Pull Before Working
- Fetches latest changes from all platforms
- Automatically stashes local changes
- Pulls with rebase to avoid merge commits
- Re-applies stashed changes
- Installs dependencies if needed

**Always run this before starting work!**

### `./sync-save.sh` - Push After Changes
- Stages all changes automatically
- Creates commit with timestamp
- Pulls latest changes before pushing
- Pushes to GitHub with upstream tracking
- Shows sync status for all platforms

### `./sync-fix.sh` - Resolve Conflicts
- Detects and resolves merge conflicts
- Offers multiple resolution strategies
- Handles rebase conflicts
- Provides guided conflict resolution

## 📁 Project Structure

```
crypto-campaign-setup/
├── src/
│   ├── components/
│   │   ├── DonorForm.jsx           # Main donation form
│   │   └── setup/                  # Campaign setup wizard
│   │       ├── SetupWizard.jsx
│   │       ├── CampaignInfo.jsx
│   │       ├── FormCustomization.jsx
│   │       └── EmbedOptions.jsx
│   ├── lib/
│   │   └── supabase.js             # Database connection
│   └── App.jsx                     # Main application
├── sync-setup.sh                   # Initial GitHub setup
├── sync-start.sh                   # Pull before working
├── sync-save.sh                    # Push after changes
├── sync-fix.sh                     # Resolve conflicts
├── .gitignore                      # Comprehensive ignore file
└── README.md                       # This file
```

## 🌐 Platform Integration

### Lovable
- Automatically syncs with GitHub
- Pull latest: `./sync-start.sh`
- Push changes: `./sync-save.sh`

### Replit
- Manual GitHub sync required
- Use sync scripts for two-way sync
- Handles environment differences

### Local Development
- Full git control
- All sync scripts available
- Best for complex conflict resolution

## ⚡ Features

- **Campaign Setup Wizard**: Step-by-step campaign configuration
- **Custom Donation Forms**: Themed forms with configurable amounts
- **Supabase Integration**: Real-time database with error handling
- **Multi-Platform Support**: Works across Lovable, Replit, and local
- **Automatic Conflict Resolution**: Guided merge conflict handling
- **Two-Way Sync**: Always stay in sync across all platforms

## 🚀 Development Workflow

1. **Start Working Session**:
   ```bash
   ./sync-start.sh
   ```

2. **Make Changes**: Edit files, add features, fix bugs

3. **Save Changes**:
   ```bash
   ./sync-save.sh
   ```

4. **Handle Conflicts** (if any):
   ```bash
   ./sync-fix.sh
   ```

## 📋 Environment Setup

### Local Development
```bash
npm install
npm run dev
```

### Environment Variables
Create `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🔧 Troubleshooting

### Common Issues

1. **"Not a git repository"**
   - Run: `./sync-setup.sh`

2. **Push rejected**
   - Run: `./sync-start.sh` then `./sync-save.sh`

3. **Merge conflicts**
   - Run: `./sync-fix.sh`

4. **Authentication failed**
   - Check GitHub credentials
   - Use personal access token if needed

### Platform-Specific Notes

- **Lovable**: May auto-format code, commit before major changes
- **Replit**: Environment resets may require `npm install`
- **Local**: Full control, use for complex debugging

## 📊 Sync Status

The scripts provide clear status indicators:
- ✅ **Green**: Success
- ⚠️ **Yellow**: Warning or action needed  
- ❌ **Red**: Error requiring attention
- 🔄 **Blue**: In progress

## 🤝 Contributing

1. Fork the repository
2. Run `./sync-setup.sh` with your fork URL
3. Use the sync workflow for all changes
4. Submit pull requests from feature branches

## 📄 License

MIT License - See LICENSE file for details