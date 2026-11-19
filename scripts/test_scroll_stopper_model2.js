const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function testScrollStopper() {
  const outDir = 'temp/test_scroll_stopper';
  fs.mkdirSync(outDir, { recursive: true });

  const rawFrame7s = 'temp/frames_analysis/raw_frame_7s.jpg';
  const overlayVicePink = 'assets/brand/processed/overlay_vice_pink.png';
  const avatarCircle = 'assets/brand/processed/avatar_gg_circle_128.png';

  // 1. First, let's test Model 1 with the corrected PROPORTIONATE webcam (Approach A)!
  // Davy Jones facecam: left: 83, top: 24, width: 282, height: 224 (Aspect ratio exactly 1.258)
  const camPerfect = await sharp(rawFrame7s)
    .extract({ left: 83, top: 24, width: 282, height: 224 })
    .resize(817, 650, { fit: 'fill' })
    .toBuffer();

  const luciaCrop = await sharp(rawFrame7s)
    .extract({ left: Math.round(1920 * 0.07), top: Math.round(1080 * 0.23), width: Math.round(1920 * 0.50), height: Math.round(1080 * 0.77) })
    .resize(817, 663, { fit: 'fill' })
    .toBuffer();

  const dividerSvg = `<svg width="817" height="14" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="divGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FF2A85"/>
        <stop offset="50%" stop-color="#FFFFFF"/>
        <stop offset="100%" stop-color="#00F0FF"/>
      </linearGradient>
    </defs>
    <rect width="817" height="6" y="4" fill="url(#divGrad)"/>
  </svg>`;
  const dividerBuffer = Buffer.from(dividerSvg);

  await sharp({
    create: { width: 1080, height: 1920, channels: 4, background: { r: 10, g: 6, b: 18, alpha: 1 } }
  })
    .composite([
      { input: camPerfect, left: 131, top: 347 },
      { input: luciaCrop, left: 131, top: 347 + 650 },
      { input: dividerBuffer, left: 131, top: 347 + 647 },
      { input: overlayVicePink, left: 0, top: 0 }
    ])
    .jpeg({ quality: 95 })
    .toFile(path.join(outDir, 'model_1_fixed_webcam.jpg'));

  console.log('Saved model_1_fixed_webcam.jpg!');

  // 2. Now let's test Model 2: VIRAL BREAKDOWN (STOP THE SCROLL)
  // Instead of a tiny 16:9 box in the middle with huge dead margins:
  // - Top: High-contrast, punchy news/breakdown header
  // - Main body: BIG, IMMERSIVE GAMEPLAY that occupies ~75% of the frame!
  // - Callouts directly overlaid on the action to stop the scroll!

  // Large vertical gameplay: 817 wide by 1100 tall! (occupies 84% of the inner window!)
  // In 1080x1920: gameplay from y=540 to y=1660 (height 1120px)
  const bigGameBuffer = await sharp(rawFrame7s)
    .extract({ left: Math.round(1920 * 0.08), top: 0, width: Math.round(1920 * 0.5625), height: 1080 })
    .resize(817, 1100, { fit: 'cover' })
    .toBuffer();

  // Viral News Header (Top 0..540 area)
  const viralHeaderSvg = `<svg width="1080" height="540" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hookGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FF2A85"/>
        <stop offset="50%" stop-color="#FF7B00"/>
        <stop offset="100%" stop-color="#00F0FF"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.8"/>
      </filter>
    </defs>

    <!-- Top Floating News Card -->
    <g filter="url(#shadow)" transform="translate(131, 140)">
      <rect width="817" height="190" rx="20" fill="#0E0818" stroke="url(#hookGrad)" stroke-width="2.5"/>
      
      <!-- Breaking / Breakdown Badge -->
      <rect x="25" y="20" width="220" height="34" rx="8" fill="#FF2A85"/>
      <text x="135" y="43" font-family="'Segoe UI', Arial, sans-serif" font-size="15" font-weight="900" fill="#FFFFFF" text-anchor="middle">🚨 DETALHE NOVO REVELADO</text>
      
      <text x="790" y="43" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="bold" fill="#00F0FF" text-anchor="end">@ggnochat</text>

      <!-- Main Headline in Impact / Bebas style -->
      <text x="25" y="98" font-family="'Segoe UI', Arial, sans-serif" font-size="32" font-weight="900" fill="#FFFFFF">VOCÊ REPAROU NA CELA DA LUCIA?</text>
      <text x="25" y="140" font-family="'Segoe UI', Arial, sans-serif" font-size="20" font-weight="700" fill="#FF7B00">A ILUMINAÇÃO VOLUMÉTRICA PROVA O NOVO MOTOR</text>
      <text x="25" y="168" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="600" fill="#A89BB8">Análise de Cena • Trailer 1 Oficial em 4K</text>
    </g>
  </svg>`;
  const viralHeaderBuffer = Buffer.from(viralHeaderSvg);

  // Callout Overlays directly on gameplay (This is what stops the scroll!)
  const calloutSvg = `<svg width="817" height="1100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00F0FF"/>
        <stop offset="100%" stop-color="#FF2A85"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <!-- Callout 1: Targeting reticle / pointer at the window light -->
    <g transform="translate(620, 180)" filter="url(#glow)">
      <circle cx="0" cy="0" r="22" fill="none" stroke="#00F0FF" stroke-width="2.5" stroke-dasharray="4,2"/>
      <circle cx="0" cy="0" r="4" fill="#00F0FF"/>
      <!-- Line to tag -->
      <line x1="-22" y1="0" x2="-80" y2="0" stroke="#00F0FF" stroke-width="2"/>
      <rect x="-310" y="-18" width="230" height="36" rx="8" fill="#0C0716" fill-opacity="0.9" stroke="#00F0FF" stroke-width="1.5"/>
      <text x="-195" y="6" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="bold" fill="#00F0FF" text-anchor="middle">⚡ ILUMINAÇÃO EM TEMPO REAL</text>
    </g>

    <!-- Callout 2: Highlighting Lucia's prison uniform physics -->
    <g transform="translate(240, 520)" filter="url(#glow)">
      <circle cx="0" cy="0" r="24" fill="none" stroke="#FF2A85" stroke-width="2.5"/>
      <circle cx="0" cy="0" r="5" fill="#FF2A85"/>
      <!-- Line to tag -->
      <line x1="24" y1="0" x2="80" y2="0" stroke="#FF2A85" stroke-width="2"/>
      <rect x="80" y="-18" width="250" height="36" rx="8" fill="#0C0716" fill-opacity="0.9" stroke="#FF2A85" stroke-width="1.5"/>
      <text x="205" y="6" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle">👕 TECIDO DINÂMICO DOS NPCS</text>
    </g>

    <!-- Bottom Hook Badge -->
    <rect x="180" y="990" width="457" height="50" rx="14" fill="#0E0818" fill-opacity="0.95" stroke="url(#pillGrad)" stroke-width="2"/>
    <text x="408" y="1022" font-family="'Segoe UI', Arial, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle">OLHA A DIFERENÇA PRO GTA 5! 👀</text>
  </svg>`;
  const calloutBuffer = Buffer.from(calloutSvg);

  // Overlay with dark subtle frame
  const overlayDark = 'assets/brand/processed/overlay_subtle_dark.png';

  await sharp({
    create: { width: 1080, height: 1920, channels: 4, background: { r: 10, g: 6, b: 18, alpha: 1 } }
  })
    .composite([
      { input: bigGameBuffer, left: 131, top: 347 + 213 }, // 347 + 213 = 560
      { input: calloutBuffer, left: 131, top: 347 + 213 },
      { input: overlayDark, left: 0, top: 0 },
      { input: viralHeaderBuffer, left: 0, top: 0 }
    ])
    .jpeg({ quality: 95 })
    .toFile(path.join(outDir, 'model_2_viral_scroll_stopper.jpg'));

  console.log('Saved model_2_viral_scroll_stopper.jpg!');
}

testScrollStopper().catch(console.error);
