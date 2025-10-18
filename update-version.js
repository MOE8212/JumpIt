#!/usr/bin/env node
// Auto-update version info in index.html with current git commit

const fs = require('fs');
const { execSync } = require('child_process');

try {
    // Get current commit hash (short version)
    let currentHash;
    try {
        currentHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    } catch (e) {
        currentHash = 'initial';
    }

    // Get last commit message
    let commitMsg;
    try {
        commitMsg = execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim();
        // Shorten to first 50 chars
        if (commitMsg.length > 50) {
            commitMsg = commitMsg.substring(0, 50) + '...';
        }
    } catch (e) {
        commitMsg = 'Initial commit';
    }

    console.log(`🔄 Updating version info to: ${currentHash}`);

    // Read index.html
    let content = fs.readFileSync('index.html', 'utf-8');

    // Update Build Info comment (support multi-line comments)
    content = content.replace(
        /<!-- Build Info: Commit [a-f0-9]+ - [^\n]*(?:\n[^>]*)*-->/,
        `<!-- Build Info: Commit ${currentHash} - ${commitMsg} -->`
    );

    // Update version display (preserve version number, only update hash)
    content = content.replace(
        /(id="version-display">v[\d.]+) - Build [a-f0-9]+/,
        `$1 - Build ${currentHash}`
    );

    // Write back to file
    fs.writeFileSync('index.html', content, 'utf-8');

    console.log('✅ Version info updated successfully!');
    process.exit(0);

} catch (error) {
    console.error('❌ Error updating version:', error.message);
    process.exit(1);
}

