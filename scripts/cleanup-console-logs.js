const fs = require('fs');
const path = require('path');

class ConsoleLogCleaner {
    constructor() {
        this.processedFiles = 0;
        this.removedLogs = 0;
        this.keptLogs = 0;
    }

    // Patterns to keep (important production logs)
    shouldKeepLog(line) {
        const keepPatterns = [
            /console\.log.*success/i,
            /console\.log.*error/i,
            /console\.log.*warning/i,
            /console\.log.*info/i,
            /console\.log.*result/i,
            /console\.log.*summary/i,
            /console\.error/,
            /console\.warn/,
            /console\.info/,
            // Keep structured logging
            /console\.log\(\'\u2705/, // ✅
            /console\.log\(\'\u274c/, // ❌
            /console\.log\(\'\u26a0/, // ⚠️
            /console\.log\(\'\ud83d\ude80/, // 🚀
            /console\.log\(\'\ud83d\udcc8/, // 📈
            /console\.log\(\'\ud83d\udcc4/, // 📄
            /console\.log\(\'\ud83d\udcca/, // 📊
        ];

        return keepPatterns.some(pattern => pattern.test(line));
    }

    cleanFile(filePath) {
        if (!fs.existsSync(filePath)) return;
        
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const cleanedLines = [];
        
        let removedCount = 0;
        let keptCount = 0;

        for (const line of lines) {
                if (this.shouldKeepLog(line)) {
                    cleanedLines.push(line);
                    keptCount++;
                } else {
                    removedCount++;
                }
            } else {
                cleanedLines.push(line);
            }
        }

        if (removedCount > 0) {
            fs.writeFileSync(filePath, cleanedLines.join('\n'));
            this.removedLogs += removedCount;
            this.keptLogs += keptCount;
            this.processedFiles++;
        }
    }

    // Clean all files in a directory
    cleanDirectory(dirPath, extensions = ['.js', '.cjs', '.ts']) {
        if (!fs.existsSync(dirPath)) return;

        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory() && !file.includes('node_modules')) {
                this.cleanDirectory(filePath, extensions);
            } else if (stat.isFile()) {
                const ext = path.extname(file);
                if (extensions.includes(ext)) {
                    this.cleanFile(filePath);
                }
            }
        }
    }

    // Main cleanup function
    async cleanupProject() {
        
        // Clean scripts directory
        this.cleanDirectory(path.join(__dirname));
        
        // Clean tests directory
        this.cleanDirectory(path.join(__dirname, '../tests'));
        
        // Summary
        console.log('\n📊 CLEANUP SUMMARY:');
        
        if (this.processedFiles > 0) {
            console.log('\n✅ Console.log cleanup completed successfully!');
        } else {
        }
    }
}

// Run cleanup
if (require.main === module) {
    const cleaner = new ConsoleLogCleaner();
    cleaner.cleanupProject().catch(console.error);
}

module.exports = ConsoleLogCleaner;