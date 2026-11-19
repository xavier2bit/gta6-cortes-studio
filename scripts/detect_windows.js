const sharp = require('sharp');
const path = require('path');

async function findChromeBorders() {
  const brandDir = 'assets/brand';
  const frames = [
    { name: 'vice_pink', file: 'moldura_9x16_vice_city_rosa_neon_oficial.jpg' },
    { name: 'subtle_dark', file: 'moldura_9x16_vice_city_roxo_noturno_alt.jpg' },
    { name: 'wide_16x9', file: 'moldura_9x16_vice_city_roxo_noturno_16x9.jpg' }
  ];

  for (const f of frames) {
    const inputPath = path.join(brandDir, f.file);
    const image = sharp(inputPath);
    const { width, height, channels } = await image.metadata();
    const raw = await image.raw().toBuffer();

    // The chrome border is bright/silver (R, G, B > 120 and |R-G| < 30 and |G-B| < 30)
    // Let's sample along horizontal line y = height/2
    const centerY = Math.floor(height / 2);
    const chromeX = [];
    for (let x = 0; x < width; x++) {
      const idx = (centerY * width + x) * channels;
      const r = raw[idx], g = raw[idx + 1], b = raw[idx + 2];
      if (r > 130 && g > 130 && b > 130) {
        chromeX.push(x);
      }
    }

    // sample along vertical line x = width/2
    const centerX = Math.floor(width / 2);
    const chromeY = [];
    for (let y = 0; y < height; y++) {
      const idx = (y * width + centerX) * channels;
      const r = raw[idx], g = raw[idx + 1], b = raw[idx + 2];
      if (r > 130 && g > 130 && b > 130) {
        chromeY.push(y);
      }
    }

    console.log(`[${f.name}] Chrome border horizontal crossings:`, chromeX.slice(0, 5), '...', chromeX.slice(-5));
    console.log(`[${f.name}] Chrome border vertical crossings:`, chromeY.slice(0, 5), '...', chromeY.slice(-5));
  }
}

findChromeBorders().catch(console.error);
