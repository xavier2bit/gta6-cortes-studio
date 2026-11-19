const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getTextPath } = require('../svg_text');

/**
 * Builds FFmpeg filter complex string with dynamic motion for Model 2 (Página de GTA 6 + Gameplay)
 */
function createWebPageGameTemplate(options) {
  const {
    newsTitle = 'ROCKSTAR CONFIRMA: NOVO MOTOR DE FÍSICA NO GTA VI!',
    newsCategory = 'ROCKSTAR NEWSWIRE • OFICIAL',
    authorName = 'Rockstar Games',
    authorHandle = '@RockstarGames',
    newsDate = 'HOJE • VICE CITY',
    channelTag = '@GTA6CORTES',
    tempDir = config.paths.temp,
    assPath = null
  } = options;

  fs.mkdirSync(tempDir, { recursive: true });

  const webCardSvgPath = path.join(tempDir, `web_card_${Date.now()}.svg`);

  // Prompt-Motion / HyperFrames quality SVG Card with true typography paths
  const titleParts = newsTitle.split(':');
  const part1 = (titleParts[0] || 'VAZAMENTO EXCLUSIVO').toUpperCase();
  const part2 = (titleParts[1] || 'NOVA GAMEPLAY DO GTA VI').trim().toUpperCase();

  const categoryPath = getTextPath(newsCategory.toUpperCase(), 250, 131, 16, 'bebas', { align: 'center' });
  const titlePath1 = getTextPath(part1, 80, 305, 34, 'bebas');
  const titlePath2 = getTextPath(part2, 80, 355, 38, 'bebas');
  const buttonPath = getTextPath('GAMEPLAY AO VIVO ▼', 540, 756, 17, 'bebas', { align: 'center' });

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="850" viewBox="0 0 1080 850">
  <defs>
    <linearGradient id="neonGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF007F" />
      <stop offset="50%" stop-color="#A000FF" />
      <stop offset="100%" stop-color="#00F0FF" />
    </linearGradient>

    <linearGradient id="rockstarGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFCC00" />
      <stop offset="100%" stop-color="#FF9900" />
    </linearGradient>

    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.85"/>
    </filter>
  </defs>

  <g filter="url(#cardShadow)">
    <!-- Browser Card Container -->
    <rect x="40" y="10" width="1000" height="780" rx="28" fill="#0E0B16" fill-opacity="0.96" stroke="url(#neonGlowGrad)" stroke-width="3"/>
    
    <!-- Browser Top Bar -->
    <rect x="40" y="10" width="1000" height="65" rx="28" fill="#181326"/>
    <rect x="40" y="40" width="1000" height="35" fill="#181326"/>
    
    <!-- Window Control Buttons (Red, Yellow, Green) -->
    <circle cx="85" cy="42" r="9" fill="#FF5F56"/>
    <circle cx="115" cy="42" r="9" fill="#FFBD2E"/>
    <circle cx="145" cy="42" r="9" fill="#27C93F"/>

    <!-- URL Bar -->
    <rect x="200" y="24" width="680" height="38" rx="11" fill="#0E0B16" fill-opacity="0.8" stroke="#332B45" stroke-width="1"/>
    <text x="540" y="48" font-family="'Segoe UI', Arial, sans-serif" font-size="16" fill="#A89BB8" text-anchor="middle">rockstargames.com/newswire/gta-vi-leak</text>
    <text x="225" y="49" font-family="Arial, sans-serif" font-size="16" fill="#00F0FF">🔒</text>

    <!-- Category Pill -->
    <rect x="80" y="105" width="340" height="40" rx="12" fill="url(#neonGlowGrad)"/>
    <path d="${categoryPath.pathData}" fill="#FFFFFF" />

    <!-- Author Row -->
    <g transform="translate(80, 170)">
      <rect x="0" y="0" width="65" height="65" rx="16" fill="url(#rockstarGold)"/>
      <text x="32" y="47" font-family="Arial Black, Impact, sans-serif" font-size="44" font-weight="bold" fill="#000000" text-anchor="middle">R<tspan font-size="28" dy="-16">*</tspan></text>
      
      <text x="85" y="28" font-family="'Segoe UI', Arial, sans-serif" font-size="24" font-weight="bold" fill="#FFFFFF">${authorName}</text>
      <circle cx="295" cy="20" r="11" fill="#FFCC00"/>
      <text x="295" y="26" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#000000" text-anchor="middle">✓</text>
      
      <text x="85" y="55" font-family="'Segoe UI', Arial, sans-serif" font-size="17" fill="#887E9C">${authorHandle} • ${newsDate}</text>
    </g>

    <!-- Main Headline Vector Paths (Bebas Neue) -->
    <path d="${titlePath1.pathData}" fill="#FFFFFF" />
    <path d="${titlePath2.pathData}" fill="#00F0FF" />

    <!-- Article Teaser / Details Box -->
    <rect x="80" y="405" width="920" height="175" rx="18" fill="#151022" stroke="#2B213F" stroke-width="1.5"/>
    <text x="110" y="452" font-family="'Segoe UI', Arial, sans-serif" font-size="22" fill="#E2DCED" font-weight="600">
      <tspan x="110" dy="0">"A física mais avançada da história dos videogames,</tspan>
      <tspan x="110" dy="36">com reações dinâmicas de NPCs em Leonida e</tspan>
      <tspan x="110" dy="36" fill="#00F0FF" font-weight="bold">gráficos nunca antes vistos na franquia."</tspan>
    </text>

    <!-- Engagement Bar -->
    <line x1="80" y1="620" x2="1000" y2="620" stroke="#2B213F" stroke-width="1"/>
    <g transform="translate(100, 665)" font-family="'Segoe UI', Arial, sans-serif" font-size="20" fill="#A89BB8" font-weight="bold">
      <text x="0" y="0">❤️ 482.5K</text>
      <text x="240" y="0">🔁 89.2K</text>
      <text x="480" y="0">👁️ 12.8M</text>
      <text x="720" y="0" fill="#00F0FF">🔗 Compartilhar</text>
    </g>

    <!-- Bottom Indicator -->
    <rect x="400" y="730" width="280" height="38" rx="12" fill="#181326" stroke="url(#neonGlowGrad)" stroke-width="2"/>
    <path d="${buttonPath.pathData}" fill="#00F0FF" />
  </g>
</svg>`;
  fs.writeFileSync(webCardSvgPath, svgContent, 'utf8');

  // Bottom Watermark SVG
  const bottomSvgPath = path.join(tempDir, `web_bottom_${Date.now()}.svg`);
  const tagPath = getTextPath(channelTag, 540, 50, 24, 'bebas', { align: 'center' });
  const bottomSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="80" viewBox="0 0 1080 80">
  <rect x="360" y="15" width="360" height="50" rx="15" fill="#000000" fill-opacity="0.8" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="1"/>
  <path d="${tagPath.pathData}" fill="#00F0FF" />
</svg>`;
  fs.writeFileSync(bottomSvgPath, bottomSvg, 'utf8');

  let filterComplex = `
    [0:v]split=2[bg_src][game_src];
    [bg_src]scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,boxblur=40:10,colorchannelmixer=aa=1:rr=0.35:gg=0.35:bb=0.45[dark_bg];
    [game_src]crop=iw*0.75:ih:iw*0.25:0,scale=1080:990:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:990,unsharp=3:3:0.5:3:3:0.0[bottom_game];
    [dark_bg][bottom_game]overlay=0:930[comp];
    [comp][1:v]overlay=x=0:y='if(lte(t,0.5),-800+860*(1-pow(1-t/0.5,3)),60)':eval=frame[with_card];
    [with_card][2:v]overlay=x=0:y=1820[with_bottom]
  `.trim();

  if (assPath) {
    const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const fontsDir = config.paths.fonts.replace(/\\/g, '/').replace(/:/g, '\\:');
    filterComplex += `;[with_bottom]subtitles='${escapedAss}':fontsdir='${fontsDir}'[v_out]`;
  } else {
    filterComplex += `;[with_bottom]copy[v_out]`;
  }

  return {
    extraInputs: [webCardSvgPath, bottomSvgPath],
    filterComplex
  };
}

module.exports = {
  createWebPageGameTemplate
};
