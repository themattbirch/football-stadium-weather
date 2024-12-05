const fs = require('fs-extra');
const path = require('path');

const DIST_DIR = 'gameday-weather';

async function packageExtension() {
  try {
    // Create dist directory if it doesn't exist
    await fs.ensureDir(DIST_DIR);

    // Copy manifest
    await fs.copy('manifest.json', path.join(DIST_DIR, 'manifest.json'));

    // Copy HTML files
    await fs.copy('index.html', path.join(DIST_DIR, 'index.html'));

    // Copy styles.css
    await fs.copy('styles.css', path.join(DIST_DIR, 'styles.css'));

    // Copy scripts
    await fs.copy('background.js', path.join(DIST_DIR, 'background.js'));
    await fs.copy('popup.js', path.join(DIST_DIR, 'popup.js'));
    await fs.copy('offlineDetection.js', path.join(DIST_DIR, 'offlineDetection.js')); // Existing script
    await fs.copy('runtime.js', path.join(DIST_DIR, 'runtime.js')); // New script

    // Copy data directory
    await fs.copy('data', path.join(DIST_DIR, 'data'));

    // Copy icons
    await fs.copy('icons', path.join(DIST_DIR, 'icons'));

    console.log('Extension packaged successfully in:', DIST_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: Could not find file ${error.path}`);
    } else {
      console.error('Error packaging extension:', error);
    }
  }
}

packageExtension().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
