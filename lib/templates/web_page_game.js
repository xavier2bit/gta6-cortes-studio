const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getTextPath } = require('../svg_text');

/**
 * Builds FFmpeg filter complex string for Model 2: Notícia / Análise Editorial V2
 * Features:
 * - Truthful editorial card: "GG NO CHAT • ANÁLISE"
 * - No fake Rockstar domain, no fabricated likes or fake verifications
 * - Dynamic card motion: visible in 0-2.5s, then collapses upwards leaving full focus on gameplay
 * - Smart gameplay crop that centers Lucia/action
 * - Channel brand: @ggnochat
 */
function createWebPageGameTemplate(options = {}) {
  const brand = config.brand || require('../../brand.json');
  const {
    newsTitle = 'LUCIA NA CELA: DETALHES DA PRISÃO DE LEONIDA',
    newsCategory = 'GG NO CHAT • ANÁLISE EDITORIAL',
    authorName = brand.display_name || 'GG NO CHAT',
    authorHandle = brand.handle || '@ggnochat',
    newsDate = 'GTA VI • GAMEPLAY BREAKDOWN',
    channelTag = brand.handle || '@ggnochat',
    tempDir = config.paths.temp,
    assPath = null,
    framePreset = 'no_frame',
    gameplayCrop = { x: 0.07, y: 0.23, w: 0.50, h: 0.77 },
  } = options;

  fs.mkdirSync(tempDir, { recursive: true });

  const webCardSvgPath = path.join(tempDir, `editorial_card_${Date.now()}.svg`);

  // Parse title into 2 punchy lines
  let part1 = newsTitle;
  let part2 = 'ANÁLISE DE CENA & DETALHES';
  if (newsTitle.includes(':')) {
    const parts = newsTitle.split(':');
    part1 = parts[0].trim().toUpperCase();
    part2 = parts[1].trim().toUpperCase();
  }

  const categoryPath = getTextPath(newsCategory.toUpperCase(), 250, 131, 16, 'bebas', { align: 'center' });
  const titlePath1 = getTextPath(part1.toUpperCase(), 80, 290, 32, 'bebas');
  const titlePath2 = getTextPath(part2.toUpperCase(), 80, 335, 34, 'bebas');
  const tagBadgePath = getTextPath('ANÁLISE DE GAMEPLAY ▼', 540, 680, 16, 'bebas', { align: 'center' });

  // Clean, honest editorial card without fabricated metrics
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="740" viewBox="0 0 1080 740">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF2A85" />
      <stop offset="50%" stop-color="#A000FF" />
      <stop offset="100%" stop-color="#00F0FF" />
    </linearGradient>

    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.9"/>
    </filter>
  </defs>

  <g filter="url(#cardShadow)">
    <!-- Main Card Body -->
    <rect x="40" y="10" width="1000" height="700" rx="26" fill="#0E0B16" fill-opacity="0.97" stroke="url(#brandGrad)" stroke-width="2.5"/>
    
    <!-- Top Bar -->
    <rect x="40" y="10" width="1000" height="60" rx="26" fill="#181326"/>
    <rect x="40" y="38" width="1000" height="32" fill="#181326"/>
    
    <circle cx="85" cy="40" r="8" fill="#FF5F56"/>
    <circle cx="115" cy="40" r="8" fill="#FFBD2E"/>
    <circle cx="145" cy="40" r="8" fill="#27C93F"/>

    <!-- Channel Badge URL Bar -->
    <rect x="200" y="22" width="680" height="36" rx="10" fill="#0E0B16" fill-opacity="0.8" stroke="#332B45" stroke-width="1"/>
    <text x="540" y="46" font-family="'Segoe UI', Arial, sans-serif" font-size="15" fill="#A89BB8" text-anchor="middle">ggnochat.com/analise/gta-6-lucia-breakdown</text>

    <!-- Category Pill -->
    <rect x="80" y="96" width="340" height="38" rx="12" fill="url(#brandGrad)"/>
    <path d="${categoryPath.pathData}" fill="#FFFFFF" />

    <!-- Author Row -->
    <g transform="translate(80, 155)">
      <!-- Avatar Box -->
      <rect x="0" y="0" width="60" height="60" rx="14" fill="#FF2A85"/>
      <text x="30" y="40" font-family="Arial Black, Impact, sans-serif" font-size="28" font-weight="bold" fill="#FFFFFF" text-anchor="middle">GG</text>
      
      <text x="80" y="26" font-family="'Segoe UI', Arial, sans-serif" font-size="23" font-weight="bold" fill="#FFFFFF">${authorName}</text>
      <text x="80" y="52" font-family="'Segoe UI', Arial, sans-serif" font-size="16" fill="#887E9C">${authorHandle} • ${newsDate}</text>
    </g>

    <!-- Main Headline in Bebas Neue -->
    <path d="${titlePath1.pathData}" fill="#FFFFFF" />
    <path d="${titlePath2.pathData}" fill="#00F0FF" />

    <!-- Editorial Note Box -->
    <rect x="80" y="380" width="920" height="180" rx="16" fill="#151022" stroke="#2B213F" stroke-width="1.2"/>
    <text x="115" y="425" font-family="'Segoe UI', Arial, sans-serif" font-size="21" fill="#E2DCED" font-weight="600">
      <tspan x="115" dy="0">"Cena revela a cela da protagonista Lucia em Leonida,</tspan>
      <tspan x="115" dy="34">com iluminação volumétrica, modelos de alta fidelidade</tspan>
      <tspan x="115" dy="34" fill="#00F0FF" font-weight="bold">e novos diálogos com companheiras de cela."</tspan>
    </text>

    <!-- Action Indicator -->
    <rect x="390" y="655" width="300" height="38" rx="12" fill="#181326" stroke="url(#brandGrad)" stroke-width="1.5"/>
    <path d="${tagBadgePath.pathData}" fill="#00F0FF" />
  </g>
</svg>`;
  fs.writeFileSync(webCardSvgPath, svgContent, 'utf8');

  // Bottom Watermark SVG
  const bottomSvgPath = path.join(tempDir, `editorial_bottom_${Date.now()}.svg`);
  const tagPath = getTextPath(channelTag, 540, 50, 24, 'bebas', { align: 'center' });
  const bottomSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="80" viewBox="0 0 1080 80">
  <rect x="360" y="15" width="360" height="50" rx="15" fill="#000000" fill-opacity="0.85" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="1"/>
  <path d="${tagPath.pathData}" fill="#00F0FF" />
</svg>`;
  fs.writeFileSync(bottomSvgPath, bottomSvg, 'utf8');

  const isWideFrame = framePreset === 'wide_16x9' && brand.frames && brand.frames['wide_16x9'];

  if (isWideFrame) {
    const framePath = path.resolve(brand.frames['wide_16x9']);
    const avatarPath = path.resolve(brand.avatar_circle || 'assets/brand/processed/avatar_gg_circle_128.png');

    // Editorial Header SVG (0..728 area)
    const headerSvgPath = path.join(tempDir, `editorial_header_${Date.now()}.svg`);
    const headSvg = `<svg width="1080" height="720" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FF2A85"/>
          <stop offset="100%" stop-color="#00F0FF"/>
        </linearGradient>
      </defs>
      <!-- Brand Tag -->
      <rect x="131" y="240" width="320" height="38" rx="10" fill="url(#hGrad)"/>
      <text x="291" y="266" font-family="'Segoe UI', Arial, sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF" text-anchor="middle">GG NO CHAT • ANÁLISE EDITORIAL</text>
      
      <!-- Headline -->
      <text x="131" y="330" font-family="'Segoe UI', Arial, sans-serif" font-size="34" font-weight="900" fill="#FFFFFF">${part1}</text>
      <text x="131" y="375" font-family="'Segoe UI', Arial, sans-serif" font-size="22" font-weight="600" fill="#00F0FF">${part2}</text>

      <!-- Source Attribution -->
      <text x="131" y="420" font-family="'Segoe UI', Arial, sans-serif" font-size="16" fill="#A89BB8">Fonte: Trailer Oficial Rockstar Games | Análise: @ggnochat</text>
    </svg>`;
    fs.writeFileSync(headerSvgPath, headSvg, 'utf8');

    // Editorial Footer SVG (1200..1920 area)
    const footerSvgPath = path.join(tempDir, `editorial_footer_${Date.now()}.svg`);
    const footSvg = `<svg width="1080" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect x="131" y="40" width="817" height="180" rx="16" fill="#140E24" stroke="#2D2147" stroke-width="2"/>
      <text x="160" y="85" font-family="'Segoe UI', Arial, sans-serif" font-size="20" font-weight="bold" fill="#FF6EC7">PONTOS OBSERVADOS NA CENA:</text>
      <text x="160" y="125" font-family="'Segoe UI', Arial, sans-serif" font-size="18" fill="#FFFFFF">• Iluminação volumétrica entrando pelas grades da janela</text>
      <text x="160" y="160" font-family="'Segoe UI', Arial, sans-serif" font-size="18" fill="#FFFFFF">• Textura de alta fidelidade no uniforme prisional de Lucia</text>
      <text x="160" y="195" font-family="'Segoe UI', Arial, sans-serif" font-size="18" fill="#FFFFFF">• Interação dinâmica entre as personagens na cela</text>
    </svg>`;
    fs.writeFileSync(footerSvgPath, footSvg, 'utf8');

    extraInputs = [framePath, avatarPath, headerSvgPath, footerSvgPath];

    filterComplex = `
      [0:v]scale=817:461:flags=lanczos,unsharp=3:3:0.5:3:3:0.0[game_16x9];
      color=c=#0C0816:s=1080x1920:r=60[bg];
      [bg][game_16x9]overlay=131:728[bg_game];
      [bg_game][1:v]overlay=0:0[framed];
      [framed][2:v]overlay=131:90[with_avatar];
      [with_avatar][3:v]overlay=0:0[with_header];
      [with_header][4:v]overlay=0:1200[with_frame]
    `.trim();
  } else {
    // Dynamic collapsible web card layout
    const gx = gameplayCrop.x, gy = gameplayCrop.y, gw = gameplayCrop.w, gh = gameplayCrop.h;
    extraInputs = [webCardSvgPath, bottomSvgPath];
    const cardYExpr = "if(lte(t,2.5), 45, if(lte(t,3.2), 45 - 725 * (1 - cos((t-2.5)/0.7 * 3.14159))/2, -680))";

    filterComplex = `
      [0:v]split=2[bg_src][game_src];
      [bg_src]scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,boxblur=30:10,colorchannelmixer=aa=1:rr=0.35:gg=0.35:bb=0.45[dark_bg];
      [game_src]crop=iw*${gw}:ih*${gh}:iw*${gx}:ih*${gy},scale=1080:1350:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1350,unsharp=3:3:0.5:3:3:0.0[game_cropped];
      [dark_bg][game_cropped]overlay=0:570[comp];
      [comp][1:v]overlay=x=0:y='${cardYExpr}':eval=frame[with_card];
      [with_card][2:v]overlay=x=0:y=1820[with_frame]
    `.trim();
  }

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
