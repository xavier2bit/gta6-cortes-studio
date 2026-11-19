const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processBrandOverlays() {
  const brandDir = 'assets/brand';
  const outDir = 'assets/brand/processed';
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Process 48px micro avatar & 128px avatar
  console.log('Generating micro avatar (48x48) and clean badge (128x128)...');
  const avatarSrc = path.join(brandDir, 'avatar_ggnochat_vice_city.jpg');
  
  // Crop around central "GG" symbol (from x: 200, y: 220, w: 624, h: 480)
  await sharp(avatarSrc)
    .extract({ left: 200, top: 220, width: 624, height: 480 })
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(outDir, 'avatar_gg_micro_48.png'));

  await sharp(avatarSrc)
    .extract({ left: 200, top: 220, width: 624, height: 480 })
    .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(outDir, 'avatar_gg_badge_128.png'));

  // Full circular avatar for profiles/watermarks
  const circleSvg = Buffer.from(
    '<svg><circle cx="64" cy="64" r="62" fill="#fff"/></svg>'
  );
  await sharp(avatarSrc)
    .resize(128, 128)
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toFile(path.join(outDir, 'avatar_gg_circle_128.png'));

  // 2. Process frames into 1080x1920 PNGs with true transparent inner window
  // Window geometries at 768x1376:
  // vice_pink & subtle_dark: inner window x in [93, 674], y in [249, 1190]
  // wide_16x9: inner window x in [93, 674], y in [522, 852]

  const configs = [
    {
      name: 'overlay_vice_pink.png',
      file: 'moldura_9x16_vice_city_rosa_neon_oficial.jpg',
      win: { x1: 93, x2: 674, y1: 249, y2: 1190, r: 14 }
    },
    {
      name: 'overlay_subtle_dark.png',
      file: 'moldura_9x16_vice_city_roxo_noturno_alt.jpg',
      win: { x1: 93, x2: 674, y1: 249, y2: 1190, r: 14 }
    },
    {
      name: 'overlay_wide_16x9.png',
      file: 'moldura_9x16_vice_city_roxo_noturno_16x9.jpg',
      win: { x1: 93, x2: 674, y1: 522, y2: 852, r: 14 }
    }
  ];

  for (const cfg of configs) {
    console.log(`Processing ${cfg.name}...`);
    const inputPath = path.join(brandDir, cfg.file);
    const img = sharp(inputPath);
    const meta = await img.metadata();
    const { width, height } = meta;

    // Convert to RGBA raw buffer
    const raw = await img.ensureAlpha().raw().toBuffer();

    const { x1, x2, y1, y2, r: radius } = cfg.win;

    // Helper: is pixel inside rounded rectangle
    function isInsideWindow(px, py) {
      if (px < x1 || px > x2 || py < y1 || py > y2) return false;
      // Check 4 corners for rounding
      if (px < x1 + radius && py < y1 + radius) {
        const dx = px - (x1 + radius);
        const dy = py - (y1 + radius);
        return (dx * dx + dy * dy) <= (radius * radius);
      }
      if (px > x2 - radius && py < y1 + radius) {
        const dx = px - (x2 - radius);
        const dy = py - (y1 + radius);
        return (dx * dx + dy * dy) <= (radius * radius);
      }
      if (px < x1 + radius && py > y2 - radius) {
        const dx = px - (x1 + radius);
        const dy = py - (y2 - radius);
        return (dx * dx + dy * dy) <= (radius * radius);
      }
      // Note: bottom right of this frame has a 45-degree chamfer / cut in the design!
      // Let's inspect: x > x2 - 20 && py > y2 - 20
      if (px > x2 - 18 && py > y2 - 18) {
        // Chamfer cut: (px - (x2 - 18)) + (py - (y2 - 18)) > 18
        if ((px - (x2 - 18)) + (py - (y2 - 18)) > 18) {
          return false;
        }
      }
      return true;
    }

    // Set alpha = 0 for pixels inside the window
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (isInsideWindow(x, y)) {
          const idx = (y * width + x) * 4;
          raw[idx + 3] = 0; // Transparent
        }
      }
    }

    // Now write modified buffer and resize to 1080x1920
    const outPath = path.join(outDir, cfg.name);
    await sharp(raw, {
      raw: { width, height, channels: 4 }
    })
      .resize(1080, 1920, { fit: 'fill' })
      .png({ compressionLevel: 8 })
      .toFile(outPath);

    console.log(`Saved ${outPath} (${fs.statSync(outPath).size} bytes)`);
  }

  console.log('✅ All brand overlays created successfully with TRUE alpha transparency!');
}

processBrandOverlays().catch(console.error);
