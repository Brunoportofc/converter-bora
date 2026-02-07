const fs = require('fs');
const https = require('https');
const path = require('path');

// Confirmed URL via check-urls.js
const fileUrl = "https://raw.githubusercontent.com/sina-masnadi/lambda-ghostscript/master/bin/gs";
const dest = path.join(__dirname, 'bin', 'gs');

if (!fs.existsSync(path.dirname(dest))) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
}

const file = fs.createWriteStream(dest);

console.log(`Downloading Ghostscript from ${fileUrl}...`);

https.get(fileUrl, (response) => {
    if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
            file.close(() => {
                console.log('Download completed: bin/gs');
                const stats = fs.statSync(dest);
                console.log(`File size: ${stats.size} bytes`);
                if (stats.size < 1000000) {
                    console.error("WARNING: File too small, likely not the binary.");
                } else {
                    console.log("File size looks reasonable for a binary.");
                }
            });
        });
    } else {
        console.error(`Failed to download: ${response.statusCode}`);
    }
}).on('error', (err) => {
    fs.unlink(dest, () => { });
    console.error(`Error downloading file: ${err.message}`);
});
