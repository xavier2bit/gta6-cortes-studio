const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getTextPath } = require('../svg_text');

/**
 * Builds FFmpeg filter complex string for Model 2: Análise Editorial / Viral Breakdown V2
 * Designed specifically to STOP THE SCROLL:
 * - Dominant, immersive vertical gameplay occupying over 80% of the screen (zero wasted space!)
 * - High-impact, high-contrast breaking news header in the top safe area
 * - Dynamic visual callouts & pointers directly on the gameplay (lighting, textures, physics)
 * - Safe-zone karaoke subtitles
 * - Brand: @ggnochat
 */
function createWebPageGameTemplate(options = {}) {
  const brand = config.brand || require('../../brand.json');
  const {
    newsTitle = 'VOCÊ REPAROU NA CELA DA LUCIA?',
    newsSubtitle = 'A ILUMINAÇÃO VOLUMÉTRICA PROVA O NOVO MOTOR',
    newsCategory = '🚨 DETALHE NOVO REVELADO',
    channelTag = brand.handle || '@ggnochat',
    tempDir = config.paths.temp,
    assPath = null,
    framePreset = 'subtle_dark',
    // Clean Lucia crop below streamer webcam:
    gameplayCrop = { x: 0.12, y: 0.23, w: 0.325, h: 0.77 }
  } = options;

  fs.mkdirSync(tempDir, { recursive: true });

  const isFramed = framePreset && framePreset !== 'no_frame' && brand.frames && brand.frames[framePreset];
  const framePath = isFramed ? path.resolve(brand.frames[framePreset]) : path.resolve(brand.frames['subtle_dark']);

  // 1. High-Impact Viral Header SVG (Top Area y=130..340)
  const headerSvgPath = path.join(tempDir, `viral_header_${Date.now()}.svg`);
  const headerSvg = `<svg width="1080" height="400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hookGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FF2A85"/>
        <stop offset="50%" stop-color="#FF7B00"/>
        <stop offset="100%" stop-color="#00F0FF"/>
      </linearGradient>
      <filter id="cardGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.85"/>
      </filter>
    </defs>

    <g filter="url(#cardGlow)" transform="translate(131, 140)">
      <!-- Main Header Card -->
      <rect width="817" height="190" rx="20" fill="#0C0716" stroke="url(#hookGrad)" stroke-width="2.5"/>
      
      <!-- Breaking Badge -->
      <rect x="25" y="20" width="230" height="34" rx="8" fill="#FF2A85"/>
      <text x="140" y="43" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">${newsCategory.toUpperCase()}</text>
      
      <!-- Channel Handle -->
      <text x="790" y="43" font-family="'Segoe UI', Arial, sans-serif" font-size="15" font-weight="bold" fill="#00F0FF" text-anchor="end">${channelTag}</text>

      <!-- Main Headline -->
      <text x="25" y="98" font-family="'Segoe UI', Arial, sans-serif" font-size="32" font-weight="900" fill="#FFFFFF">${newsTitle.toUpperCase()}</text>
      <text x="25" y="138" font-family="'Segoe UI', Arial, sans-serif" font-size="20" font-weight="700" fill="#FF7B00">${newsSubtitle.toUpperCase()}</text>
      <text x="25" y="166" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="600" fill="#A89BB8">Análise de Cena • Trailer 1 Oficial em 4K</text>
    </g>
  </svg>`;
  fs.writeFileSync(headerSvgPath, headerSvg, 'utf8');

  // 2. Callout Overlay SVG directly on gameplay (Pointers & Reticles)
  const calloutSvgPath = path.join(tempDir, `callout_overlay_${Date.now()}.svg`);
  const calloutSvg = `<svg width="817" height="1100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00F0FF"/>
        <stop offset="100%" stop-color="#FF2A85"/>
      </linearGradient>
      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <!-- Callout 1: Pointer at the window light -->
    <g transform="translate(540, 80)" filter="url(#neonGlow)">
      <circle cx="0" cy="0" r="20" fill="none" stroke="#00F0FF" stroke-width="2.5" stroke-dasharray="4,2"/>
      <circle cx="0" cy="0" r="4" fill="#00F0FF"/>
      <line x1="-20" y1="0" x2="-70" y2="0" stroke="#00F0FF" stroke-width="2"/>
      <rect x="-290" y="-18" width="220" height="36" rx="8" fill="#0C0716" fill-opacity="0.9" stroke="#00F0FF" stroke-width="1.5"/>
      <text x="-180" y="6" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="bold" fill="#00F0FF" text-anchor="middle">⚡ ILUMINAÇÃO EM TEMPO REAL</text>
    </g>

    <!-- Callout 2: Lucia uniform -->
    <g transform="translate(440, 680)" filter="url(#neonGlow)">
      <circle cx="0" cy="0" r="22" fill="none" stroke="#FF2A85" stroke-width="2.5"/>
      <circle cx="0" cy="0" r="5" fill="#FF2A85"/>
      <line x1="-22" y1="0" x2="-80" y2="0" stroke="#FF2A85" stroke-width="2"/>
      <rect x="-330" y="-18" width="250" height="36" rx="8" fill="#0C0716" fill-opacity="0.9" stroke="#FF2A85" stroke-width="1.5"/>
      <text x="-205" y="6" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle">👕 TECIDO DINÂMICO DOS NPCS</text>
    </g>

    <!-- Bottom Engagement Pill -->
    <rect x="180" y="990" width="457" height="50" rx="14" fill="#0E0818" fill-opacity="0.95" stroke="url(#pillGrad)" stroke-width="2"/>
    <text x="408" y="1022" font-family="'Segoe UI', Arial, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle">OLHA A DIFERENÇA PRO GTA 5! 👀</text>
  </svg>`;
  fs.writeFileSync(calloutSvgPath, calloutSvg, 'utf8');

  const gx = gameplayCrop.x, gy = gameplayCrop.y, gw = gameplayCrop.w, gh = gameplayCrop.h;

  let extraInputs = [framePath, calloutSvgPath, headerSvgPath];

  // Large dominant gameplay filling 817x1100 inside the frame (560 to 1660)
  let filterComplex = `
    [0:v]crop=iw*${gw}:ih*${gh}:iw*${gx}:ih*${gy},scale=817:1100:flags=lanczos,unsharp=3:3:0.5:3:3:0.0[game_large];
    color=c=#0A0612:s=1080x1920:r=60[bg];
    [bg][game_large]overlay=131:560[bg_game];
    [bg_game][2:v]overlay=131:560[game_with_callouts];
    [game_with_callouts][1:v]overlay=0:0[framed];
    [framed][3:v]overlay=0:0[with_frame]
  `.trim();

  if (assPath) {
    const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const fontsDir = config.paths.fonts.replace(/\\/g, '/').replace(/:/g, '\\:');
    filterComplex += `;[with_frame]subtitles='${escapedAss}':fontsdir='${fontsDir}'[v_out]`;
  } else {
    filterComplex += `;[with_frame]copy[v_out]`;
  }

  return {
    extraInputs,
    filterComplex
  };
}

module.exports = {
  createWebPageGameTemplate
};
