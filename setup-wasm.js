const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'node_modules', '@jspawn', 'ghostscript-wasm');
// Adjust based on actual structure, might be dist/ or root
const destDir = path.join(__dirname, 'public', 'gs');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

function copyRecursive(src, dest) {
    if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(child => {
            copyRecursive(path.join(src, child), path.join(dest, child));
        });
    } else {
        if (src.endsWith('.wasm') || src.endsWith('.js') || src.endsWith('.mem')) {
            console.log(`Copying ${src} to ${dest}`);
            fs.copyFileSync(src, dest);
        }
    }
}

try {
    copyRecursive(srcDir, destDir);
    console.log('WASM files copied successfully.');
} catch (e) {
    console.error('Error copying files:', e);
    // Fallback: list the directory to see structure if copy failed due to path mismatch
    try {
        console.log('Structure of node_modules/@jspawn/ghostscript-wasm:');
        console.log(fs.readdirSync(srcDir));
    } catch (err) {
        console.log('Could not list directory');
    }
}
