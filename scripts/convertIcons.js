const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function convertIcon(inputPath, outputPath, size) {
    try {
        await sharp(inputPath)
            .resize(size, size)
            .toFile(outputPath);
        console.log(`Created ${outputPath}`);
    } catch (error) {
        console.error(`Error creating ${outputPath}:`, error);
    }
}

async function convertIcons(sourceIcon) {
    const sizes = [16, 48, 128];
    const iconDir = path.join(__dirname, '../icons');

    if (!fs.existsSync(iconDir)) {
        fs.mkdirSync(iconDir, { recursive: true });
    }

    for (const size of sizes) {
        const outputPath = path.join(iconDir, `football${size}.png`);
        await convertIcon(sourceIcon, outputPath, size);
    }
}

module.exports = convertIcons; 