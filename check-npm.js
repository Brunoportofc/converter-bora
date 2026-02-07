const { execSync } = require('child_process');

try {
    console.log('Checking for @jspawn/ghostscript-wasm...');
    const output = execSync('npm view @jspawn/ghostscript-wasm version', { encoding: 'utf8' });
    console.log(`Package exists: ${output.trim()}`);
} catch (error) {
    console.error('Package does not exist or npm error:', error.message);
    process.exit(1);
}
