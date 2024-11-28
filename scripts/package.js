const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

const DIST_DIR = 'gameday-weather';

async function createIcons() {
  console.log('Creating icons...');
  // ... icon creation code ...
}

async function packageExtension() {
  try {
    // Create dist directory if it doesn't exist
    await fs.ensureDir(DIST_DIR);

    // Copy manifest
    await fs.copy('manifest.json', path.join(DIST_DIR, 'manifest.json'));

    // Copy index.html instead of popup.html
    await fs.copy('index.html', path.join(DIST_DIR, 'index.html'));

    // Copy styles.css from root
    await fs.copy('styles.css', path.join(DIST_DIR, 'styles.css'));

    // Copy bundled files
    await fs.copy('dist', path.join(DIST_DIR, 'dist'));

    // Copy data directory
    await fs.copy('src/data', path.join(DIST_DIR, 'data'));

    // Copy icons
    await fs.copy('icons', path.join(DIST_DIR, 'icons'));

    // Copy individual scripts
    await fs.copy('background.js', path.join(DIST_DIR, 'background.js'));
    await fs.copy('settings.js', path.join(DIST_DIR, 'settings.js'));
    await fs.copy('popup.js', path.join(DIST_DIR, 'popup.js'));

    console.log('Extension packaged successfully in:', DIST_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: Could not find file ${error.path}`);
    } else {
      console.error('Error packaging extension:', error);
    }
  }
}

createIcons()
  .then(packageExtension)
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  }); 