const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'assets', 'images', 'logo.jpeg');
const outputPath = path.join(__dirname, 'assets', 'images', 'logo_shadow.png');

async function processImage() {
  try {
    console.log('Reading image...');
    
    // Resize with background and add shadow using SVG
    const svgOverlay = `
    <svg width="400" height="400">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-opacity="0.25"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <rect x="25" y="25" width="350" height="350" fill="white" rx="30" />
      </g>
    </svg>`;

    // We will put the original logo inside a white rounded rectangle with a shadow
    // First, resize the original logo to fit nicely inside
    const resizedLogo = await sharp(inputPath)
      .resize(300, 300, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toBuffer();

    console.log('Adding shadow background...');
    await sharp(Buffer.from(svgOverlay))
      .composite([
        { input: resizedLogo, gravity: 'center' }
      ])
      .png()
      .toFile(outputPath);
      
    console.log('Successfully created logo_shadow.png');
  } catch (err) {
    console.error('Error processing image:', err);
  }
}

processImage();
