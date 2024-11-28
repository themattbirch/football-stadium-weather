const sharp = require('sharp');

const sizes = [16, 48, 128];

sizes.forEach(size => {
  sharp('icons/football.svg')
    .resize(size, size)
    .toFile(`icons/football${size}.png`)
    .catch(err => console.error(`Error creating ${size}x${size} icon:`, err));
}); 