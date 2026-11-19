const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function testCleanScroll() {
  const rawFrame7s = 'temp/frames_analysis/raw_frame_7s.jpg';
  const outDir = 'temp/test_scroll_stopper';
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Clean Lucia: x: 235, y: 248, w: 624, h: 832
  const luciaClean = await sharp(rawFrame7s)
    .extract({ left: 235, top: 248, width: 624, height: 832 })
    .resize(817, 1100, { fit: 'fill' })
    .toBuffer();

  // 2. Viral News Header
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

    <g filter="url(#shadow)" transform="translate(131, 140)">
      <rect width="817" height="190" rx="20" fill="#0E0818" stroke="url(#hookGrad)" stroke-width="2.5"/>
      
      <rect x="25" y="20" width="230" height="34" rx="8" fill="#FF2A85"/>
      <text x="140" y="43" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">🚨 DETALHE NOVO REVELADO</text>
      
      <text x="790" y="43" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="bold" fill="#00F0FF" text-anchor="end">@ggnochat</text>

      <text x="25" y="98" font-family="'Segoe UI', Arial, sans-serif" font-size="32" font-weight="900" fill="#FFFFFF">VOCÊ REPAROU NA CELA DA LUCIA?</text>
      <text x="25" y="138" font-family="'Segoe UI', Arial, sans-serif" font-size="20" font-weight="700" fill="#FF7B00">A ILUMINAÇÃO VOLUMÉTRICA PROVA O NOVO MOTOR</text>
      <text x="25" y="166" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="600" fill="#A89BB8">Análise de Cena • Trailer 1 Oficial em 4K</text>
    </g>
  </svg>`;
  const viralHeaderBuffer = Buffer.from(viralHeaderSvg);

  // 3. Callout Overlays directly on gameplay
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

    <!-- Callout 1: Pointer at the window light -->
    <g transform="translate(540, 80)" filter="url(#glow)">
      <circle cx="0" cy="0" r="20" fill="none" stroke="#00F0FF" stroke-width="2.5" stroke-dasharray="4,2"/>
      <circle cx="0" cy="0" r="4" fill="#00F0FF"/>
      <line x1="-20" y1="0" x2="-70" y2="0" stroke="#00F0FF" stroke-width="2"/>
      <rect x="-290" y="-18" width="220" height="36" rx="8" fill="#0C0716" fill-opacity="0.9" stroke="#00F0FF" stroke-width="1.5"/>
      <text x="-180" y="6" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="bold" fill="#00F0FF" text-anchor="middle">⚡ ILUMINAÇÃO EM TEMPO REAL</text>
    </g>

    <!-- Callout 2: Lucia uniform -->
    <g transform="translate(440, 680)" filter="url(#glow)">
      <circle cx="0" cy="0" r="22" fill="none" stroke="#FF2A85" stroke-width="2.5"/>
      <circle cx="0" cy="0" r="5" fill="#FF2A85"/>
      <line x1="-22" y1="0" x2="-80" y2="0" stroke="#FF2A85" stroke-width="2"/>
      <rect x="-330" y="-18" width="250" height="36" rx="8" fill="#0C0716" fill-opacity="0.9" stroke="#FF2A85" stroke-width="1.5"/>
      <text x="-205" y="6" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle">👕 TECIDO DINÂMICO DOS NPCS</text>
    </g>

    <rect x="180" y="990" width="457" height="50" rx="14" fill="#0E0818" fill-opacity="0.95" stroke="url(#pillGrad)" stroke-width="2"/>
    <text x="408" y="1022" font-family="'Segoe UI', Arial, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle">OLHA A DIFERENÇA PRO GTA 5! 👀</text>
  </svg>`;
  const calloutBuffer = Buffer.from(calloutSvg);

  const overlayDark = 'assets/brand/processed/overlay_subtle_dark.png';

  await sharp({
    create: { width: 1080, height: 1920, channels: 4, background: { r: 10, g: 6, b: 18, alpha: 1 } }
  })
    .composite([
      { input: luciaClean, left: 131, top: 560 },
      { input: calloutBuffer, left: 131, top: 560 },
      { input: overlayDark, left: 0, top: 0 },
      { input: viralHeaderBuffer, left: 0, top: 0 }
    ])
    .jpeg({ quality: 95 })
    .toFile(path.join(outDir, 'model_2_clean_scroll_stopper.jpg'));

  console.log('Saved model_2_clean_scroll_stopper.jpg!');
}

testCleanScroll().catch(console.error);
