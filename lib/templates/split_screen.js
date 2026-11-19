const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getTextPath } = require('../svg_text');

/**
 * Builds FFmpeg filter complex string with authentic GTA VI Vector Divider and Bebas Neue / Pricedown Typography
 */
function createSplitScreenTemplate(options) {
  const {
    hookText = 'DAVY JONES REAGIU AO GTA 6!',
    badgeText = 'GTA VI',
    channelTag = '@GTA6CORTES',
    tempDir = config.paths.temp,
    assPath = null,
    facecamCrop = { x: 0.015, y: 0.02, w: 0.215, h: 0.22 },
  } = options;

  fs.mkdirSync(tempDir, { recursive: true });

  // 1. Generate Animated Header SVG with true vector font paths
  const topSvgPath = path.join(tempDir, `top_header_${Date.now()}.svg`);
  
  // Convert Badge to vector path (Pricedown if GTA VI, else Bebas)
  const badgePath = getTextPath(badgeText, 155, 68, 32, badgeText.toUpperCase().includes('GTA') ? 'pricedown' : 'bebas', { align: 'center' });
  // Convert Hook Title to Bebas Neue vector path
  const hookPath = getTextPath(hookText.toUpperCase(), 640, 71, 38, 'bebas', { align: 'center' });

  const topSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="150" viewBox="0 0 1080 150">
  <defs>
    <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF007F" />
      <stop offset="35%" stop-color="#FF5E00" />
      <stop offset="70%" stop-color="#A000FF" />
      <stop offset="100%" stop-color="#00F0FF" />
    </linearGradient>

    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="7" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <g filter="url(#neonGlow)">
    <rect x="40" y="10" width="1000" height="100" rx="22" fill="#0C0714" fill-opacity="0.95" stroke="url(#neonGrad)" stroke-width="3"/>
    
    <!-- BADGE PILL -->
    <rect x="65" y="26" width="180" height="66" rx="14" fill="#FF0055" />
    <path d="${badgePath.pathData}" fill="#FFFFFF" />
    
    <!-- HOOK TITLE VECTOR -->
    <path d="${hookPath.pathData}" fill="#FFFFFF" />
  </g>
</svg>`;
  fs.writeFileSync(topSvgPath, topSvg, 'utf8');

  // 2. Generate Authentic GTA VI Chiseled Vector Divider SVG
  const dividerSvgPath = path.join(tempDir, `divider_${Date.now()}.svg`);
  
  // Authentic "grand theft auto" in Pricedown font (vector path)
  const gtaPath = getTextPath('grand theft auto', 540, 36, 17, 'pricedown', { align: 'center' });
  // Authentic "VICE CITY" in Bebas Neue font (vector path)
  const vcPath = getTextPath('VICE CITY', 540, 118, 17, 'bebas', { align: 'center' });

  const dividerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="150" viewBox="0 0 1080 150">
  <defs>
    <!-- Vice City Sunset Neon Gradient -->
    <linearGradient id="viceSunset" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF007F" />
      <stop offset="35%" stop-color="#FF5E00" />
      <stop offset="70%" stop-color="#A000FF" />
      <stop offset="100%" stop-color="#00F0FF" />
    </linearGradient>

    <!-- Metallic Chrome Bevel -->
    <linearGradient id="metallicBevel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
      <stop offset="45%" stop-color="#FFFFFF" stop-opacity="0.2" />
      <stop offset="55%" stop-color="#000000" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.85" />
    </linearGradient>

    <!-- Deep Neon Glow Filter -->
    <filter id="neonGlowHeavy" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur1" />
      <feGaussianBlur stdDeviation="3" result="blur2" />
      <feMerge>
        <feMergeNode in="blur1" />
        <feMergeNode in="blur2" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- BACKGROUND NEON DIVIDER LINE WITH GLOW -->
  <rect x="0" y="70" width="1080" height="10" fill="url(#viceSunset)" filter="url(#neonGlowHeavy)" />
  <rect x="0" y="72" width="1080" height="6" fill="#FFFFFF" fill-opacity="0.8" />

  <!-- LEFT & RIGHT ACCENT DIAMONDS -->
  <polygon points="380,75 392,66 404,75 392,84" fill="#FF007F" filter="url(#neonGlowHeavy)"/>
  <polygon points="676,75 688,66 700,75 688,84" fill="#00F0FF" filter="url(#neonGlowHeavy)"/>

  <!-- CENTER EMBLEM CONTAINER (Pill Badge) -->
  <g filter="url(#neonGlowHeavy)">
    <!-- Outer Glow Shell -->
    <rect x="415" y="14" width="250" height="122" rx="24" fill="#0A0612" stroke="url(#viceSunset)" stroke-width="3.5"/>
    
    <!-- Inner Accent Frame -->
    <rect x="423" y="22" width="234" height="106" rx="18" fill="none" stroke="#FFFFFF" stroke-opacity="0.15" stroke-width="1.2"/>

    <!-- ICONIC GTA TITLE IN PRICEDOWN FONT (VECTOR PATH) -->
    <path d="${gtaPath.pathData}" fill="#FFFFFF" />

    <!-- AUTHENTIC GTA VI VECTOR GLYPH (Heavy Chiseled Roman Numeral) -->
    <g transform="translate(485, 41)">
      <!-- V Character -->
      <path d="M 0 6 L 17 6 L 17 12 L 11 12 L 29 56 L 47 12 L 41 12 L 41 6 L 58 6 L 58 12 L 52 12 L 34 58 L 24 58 L 6 12 L 0 12 Z" 
            fill="url(#viceSunset)" stroke="#FFFFFF" stroke-width="1.5" />
      <path d="M 0 6 L 17 6 L 17 12 L 11 12 L 29 56 L 47 12 L 41 12 L 41 6 L 58 6 L 58 12 L 52 12 L 34 58 L 24 58 L 6 12 L 0 12 Z" 
            fill="url(#metallicBevel)" />

      <!-- I Character -->
      <path d="M 72 6 L 100 6 L 100 12 L 92 12 L 92 52 L 100 52 L 100 58 L 72 58 L 72 52 L 80 52 L 80 12 L 72 12 Z" 
            fill="url(#viceSunset)" stroke="#FFFFFF" stroke-width="1.5" />
      <path d="M 72 6 L 100 6 L 100 12 L 92 12 L 92 52 L 100 52 L 100 58 L 72 58 L 72 52 L 80 52 L 80 12 L 72 12 Z" 
            fill="url(#metallicBevel)" />
    </g>

    <!-- "VICE CITY" IN BEBAS NEUE FONT (VECTOR PATH) -->
    <path d="${vcPath.pathData}" fill="#00F0FF" />
  </g>
</svg>`;
  fs.writeFileSync(dividerSvgPath, dividerSvg, 'utf8');

  // 3. Generate Bottom Watermark SVG
  const bottomSvgPath = path.join(tempDir, `bottom_${Date.now()}.svg`);
  const tagPath = getTextPath(channelTag, 540, 50, 26, 'bebas', { align: 'center' });
  const bottomSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="80" viewBox="0 0 1080 80">
  <rect x="360" y="15" width="360" height="52" rx="16" fill="#000000" fill-opacity="0.85" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="1"/>
  <path d="${tagPath.pathData}" fill="#00F0FF" />
</svg>`;
  fs.writeFileSync(bottomSvgPath, bottomSvg, 'utf8');

  const fx = facecamCrop.x;
  const fy = facecamCrop.y;
  const fw = facecamCrop.w;
  const fh = facecamCrop.h;

  let filterComplex = `
    [0:v]split=3[cam_bg][cam_fg][game_raw];
    [cam_bg]crop=iw*${fw}:ih*${fh}:iw*${fx}:ih*${fy},scale=1080:960:flags=lanczos,boxblur=25:5[top_bg];
    [cam_fg]crop=iw*${fw}:ih*${fh}:iw*${fx}:ih*${fy},scale=960:540:flags=lanczos,unsharp=3:3:0.5:3:3:0.0[top_fg];
    [top_bg][top_fg]overlay=(W-w)/2:(H-h)/2[top_half];
    [game_raw]crop=iw*0.76:ih:iw*0.24:0,scale=1080:960:flags=lanczos,unsharp=3:3:0.5:3:3:0.0[bottom_half];
    [top_half][bottom_half]vstack=inputs=2[stacked];
    [stacked][1:v]overlay=x=0:y='if(lte(t,0.45),-150+195*(1-pow(1-t/0.45,3)),45)':eval=frame[with_top];
    [with_top][2:v]overlay=x=0:y=890[with_divider];
    [with_divider][3:v]overlay=x=0:y=1820[with_bottom]
  `.trim();

  if (assPath) {
    const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const fontsDir = config.paths.fonts.replace(/\\/g, '/').replace(/:/g, '\\:');
    filterComplex += `;[with_bottom]subtitles='${escapedAss}':fontsdir='${fontsDir}'[v_out]`;
  } else {
    filterComplex += `;[with_bottom]copy[v_out]`;
  }

  return {
    extraInputs: [topSvgPath, dividerSvgPath, bottomSvgPath],
    filterComplex
  };
}

module.exports = {
  createSplitScreenTemplate
};
