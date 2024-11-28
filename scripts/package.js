const fs = require('fs-extra');
const path = require('path');

const packageExtension = async () => {
  const packageDir = 'gameday-weather';

  // First, create the icons
  try {
    console.log('Creating icons...');
    require('../icons/convertIcons.js');
    // Wait a bit for the icons to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Error creating icons:', error);
  }

  // Clean and create package directory
  await fs.remove(packageDir);
  await fs.ensureDir(packageDir);
  await fs.ensureDir(path.join(packageDir, 'icons'));

  // Copy necessary files
  const filesToCopy = [
    { src: 'manifest.json', dest: 'manifest.json' },
    { src: 'index.html', dest: 'index.html' },
    { src: 'dist', dest: 'dist' },
    { src: 'src/styles', dest: 'src/styles' },
    { src: 'src/data', dest: 'src/data' },
    { src: 'icons/football16.png', dest: 'icons/football16.png' },
    { src: 'icons/football48.png', dest: 'icons/football48.png' },
    { src: 'icons/football128.png', dest: 'icons/football128.png' }
  ];

  for (const file of filesToCopy) {
    try {
      await fs.copy(file.src, path.join(packageDir, file.dest));
    } catch (error) {
      console.error(`Error copying ${file.src}:`, error);
    }
  }

  console.log('Extension packaged successfully in:', packageDir);
};

packageExtension().catch(console.error); 