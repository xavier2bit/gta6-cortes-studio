const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function testFrameComposition() {
  const brandDir = 'assets/brand';
  const outDir = 'temp/test_frames';
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Let's inspect the exact inner window of moldura_9x16_vice_city_rosa_neon_oficial.jpg (768x1376)
  // Scaled to 1080x1920:
  // scaleX = 1080 / 768 = 1.40625
  // scaleY = 1920 / 1376 = 1.3953488
  // Window in 768x1376: x1=93, x2=674, y1=249, y2=1190
  // Window in 1080x1920:
  // left = Math.round(93 * 1.40625) = 131
  // right = Math.round(674 * 1.40625) = 948
  // width = 948 - 131 = 817
  // top = Math.round(249 * 1.3953488) = 347
  // bottom = Math.round(1190 * 1.3953488) = 1660
  // height = 1660 - 347 = 1313

  console.log('Window dimensions in 1080x1920: left=131, top=347, width=817, height=1313');

  // Let's create the gameplay image resized to fill this exact window: 817x1313
  // Using our cropped Lucia frame:
  const luciaCrop = 'temp/frames_analysis/crop_lucia_perfect.jpg';
  const gameInWindow = await sharp(luciaCrop)
    .resize(817, 1313, { fit: 'cover' })
    .toBuffer();

  // Load the overlay with transparent window
  const overlayPath = 'assets/brand/processed/overlay_vice_pink.png';

  // Compose: Background (gameplay at 131, 347) + Overlay on top!
  await sharp({
    create: {
      width: 1080,
      height: 1920,
      channels: 4,
      background: { r: 10, g: 6, b: 18, alpha: 1 }
    }
  })
    .composite([
      { input: gameInWindow, left: 131, top: 347 },
      { input: overlayPath, left: 0, top: 0 }
    ])
    .jpeg({ quality: 95 })
    .toFile(path.join(outDir, 'test_composed_vice_pink.jpg'));

  console.log('Saved test_composed_vice_pink.jpg!');
}

testFrameComposition().catch(console.error);
