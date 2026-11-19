const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function testCompositions() {
  const outDir = 'temp/test_frames_v2';
  fs.mkdirSync(outDir, { recursive: true });

  const rawFrame7s = 'temp/frames_analysis/raw_frame_7s.jpg';
  const overlayVicePink = 'assets/brand/processed/overlay_vice_pink.png';
  const overlayDark = 'assets/brand/processed/overlay_subtle_dark.png';
  const overlay16x9 = 'assets/brand/processed/overlay_wide_16x9.png';
  const avatarCircle = 'assets/brand/processed/avatar_gg_circle_128.png';

  console.log('Testing Model 1: Split Screen inside overlay_vice_pink.png...');
  // Streamer crop (approx facecam from 1920x1080)
  // Davy Jones is at top-left: x=30..440, y=20..260
  const rawMeta = await sharp(rawFrame7s).metadata();
  console.log(`Raw frame size: ${rawMeta.width}x${rawMeta.height}`);

  // 1. Model 1 Split Screen composition inside 817x1313 window:
  // Streamer top half: 817x650
  // Gameplay bottom half: 817x663
  const streamerBuffer = await sharp(rawFrame7s)
    .extract({ left: Math.round(rawMeta.width * 0.015), top: Math.round(rawMeta.height * 0.02), width: Math.round(rawMeta.width * 0.22), height: Math.round(rawMeta.height * 0.22) })
    .resize(817, 650, { fit: 'cover' })
    .toBuffer();

  // Lucia gameplay (smart crop)
  const luciaBuffer = await sharp(rawFrame7s)
    .extract({ left: Math.round(rawMeta.width * 0.07), top: Math.round(rawMeta.height * 0.23), width: Math.round(rawMeta.width * 0.50), height: Math.round(rawMeta.height * 0.77) })
    .resize(817, 663, { fit: 'cover' })
    .toBuffer();

  // Divider line
  const dividerSvg = `<svg width="817" height="12" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="divGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#FF2A85"/>
        <stop offset="50%" stop-color="#FFFFFF"/>
        <stop offset="100%" stop-color="#00F0FF"/>
      </linearGradient>
    </defs>
    <rect width="817" height="6" y="3" fill="url(#divGrad)"/>
  </svg>`;
  const dividerBuffer = Buffer.from(dividerSvg);

  // Compose inside 1080x1920 canvas:
  // Base dark background
  const compModel1 = await sharp({
    create: { width: 1080, height: 1920, channels: 4, background: { r: 10, g: 6, b: 18, alpha: 1 } }
  })
    .composite([
      { input: streamerBuffer, left: 131, top: 347 },
      { input: luciaBuffer, left: 131, top: 347 + 650 },
      { input: dividerBuffer, left: 131, top: 347 + 647 },
      { input: overlayVicePink, left: 0, top: 0 }
    ])
    .jpeg({ quality: 95 })
    .toFile(path.join(outDir, 'comp_model_1_vice_pink.jpg'));

  console.log('Saved comp_model_1_vice_pink.jpg!');

  // 2. Model 2 Editorial inside overlay_wide_16x9.png
  // Window is 817x461 at (131, 728)
  const game16x9 = await sharp(rawFrame7s)
    .resize(817, 461, { fit: 'cover' })
    .toBuffer();

  const editorialHeaderSvg = `<svg width="1080" height="700" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#FF2A85"/>
        <stop offset="100%" stop-color="#00F0FF"/>
      </linearGradient>
    </defs>
    <!-- Brand Tag -->
    <rect x="131" y="240" width="320" height="36" rx="10" fill="url(#headerGrad)"/>
    <text x="291" y="265" font-family="'Segoe UI', Arial, sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF" text-anchor="middle">GG NO CHAT • ANÁLISE EDITORIAL</text>
    
    <!-- Headline -->
    <text x="131" y="330" font-family="'Segoe UI', Arial, sans-serif" font-size="34" font-weight="900" fill="#FFFFFF">LUCIA NA CELA: DETALHES DE LEONIDA</text>
    <text x="131" y="375" font-family="'Segoe UI', Arial, sans-serif" font-size="22" font-weight="600" fill="#00F0FF">ANÁLISE DE ILUMINAÇÃO E AMBIENTAÇÃO DO TRAILER</text>

    <!-- Source Note -->
    <text x="131" y="420" font-family="'Segoe UI', Arial, sans-serif" font-size="16" fill="#A89BB8">Fonte: Trailer Oficial Rockstar Games | Análise: @ggnochat</text>
  </svg>`;
  const editorialHeaderBuffer = Buffer.from(editorialHeaderSvg);

  const editorialFooterSvg = `<svg width="1080" height="700" xmlns="http://www.w3.org/2000/svg">
    <!-- Callout Box -->
    <rect x="131" y="50" width="817" height="180" rx="16" fill="#140E24" stroke="#2D2147" stroke-width="2"/>
    <text x="160" y="95" font-family="'Segoe UI', Arial, sans-serif" font-size="20" font-weight="bold" fill="#FF6EC7">PONTOS OBSERVADOS NA CENA:</text>
    <text x="160" y="135" font-family="'Segoe UI', Arial, sans-serif" font-size="18" fill="#FFFFFF">• Iluminação volumétrica entrando pelas grades da janela</text>
    <text x="160" y="170" font-family="'Segoe UI', Arial, sans-serif" font-size="18" fill="#FFFFFF">• Textura de alta fidelidade no uniforme prisional de Lucia</text>
    <text x="160" y="205" font-family="'Segoe UI', Arial, sans-serif" font-size="18" fill="#FFFFFF">• Interação dinâmica entre as personagens na cela</text>
  </svg>`;
  const editorialFooterBuffer = Buffer.from(editorialFooterSvg);

  const compModel2 = await sharp({
    create: { width: 1080, height: 1920, channels: 4, background: { r: 12, g: 8, b: 22, alpha: 1 } }
  })
    .composite([
      { input: game16x9, left: 131, top: 728 },
      { input: overlay16x9, left: 0, top: 0 },
      { input: avatarCircle, left: 131, top: 90 },
      { input: editorialHeaderBuffer, left: 0, top: 0 },
      { input: editorialFooterBuffer, left: 0, top: 1200 }
    ])
    .jpeg({ quality: 95 })
    .toFile(path.join(outDir, 'comp_model_2_editorial_16x9.jpg'));

  console.log('Saved comp_model_2_editorial_16x9.jpg!');

  // 3. Model 3: Direct Cut inside overlay_subtle_dark.png
  // Lucia smart crop fills 817x1313
  const directCrop = await sharp(rawFrame7s)
    .extract({ left: Math.round(rawMeta.width * 0.10), top: 0, width: Math.round(rawMeta.width * 0.5625), height: rawMeta.height })
    .resize(817, 1313, { fit: 'cover' })
    .toBuffer();

  const directHeaderSvg = `<svg width="1080" height="340" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dhGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#FF2A85"/>
        <stop offset="100%" stop-color="#00F0FF"/>
      </linearGradient>
    </defs>
    <rect x="131" y="260" width="817" height="60" rx="14" fill="#0E0918" stroke="url(#dhGrad)" stroke-width="2"/>
    <text x="160" y="298" font-family="'Segoe UI', Arial, sans-serif" font-size="18" font-weight="bold" fill="#FF2A85">GG NO CHAT</text>
    <text x="310" y="298" font-family="'Segoe UI', Arial, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF">LUCIA EXPLORANDO A PRISÃO DE LEONIDA</text>
  </svg>`;
  const directHeaderBuffer = Buffer.from(directHeaderSvg);

  const compModel3 = await sharp({
    create: { width: 1080, height: 1920, channels: 4, background: { r: 10, g: 6, b: 18, alpha: 1 } }
  })
    .composite([
      { input: directCrop, left: 131, top: 347 },
      { input: overlayDark, left: 0, top: 0 },
      { input: directHeaderBuffer, left: 0, top: 0 }
    ])
    .jpeg({ quality: 95 })
    .toFile(path.join(outDir, 'comp_model_3_direct_dark.jpg'));

  console.log('Saved comp_model_3_direct_dark.jpg!');
}

testCompositions().catch(console.error);
