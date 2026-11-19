const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getTextPath } = require('../svg_text');

/**
 * Builds FFmpeg filter complex string for Model 1: Reação / Split Screen V2
 * Features:
 * - Smart gameplay crop that centers Lucia/protagonists without cutting edges
 * - Streamer webcam cleanly isolated in top half
 * - PiP mode option for gameplay focus
 * - GG NO CHAT branding (@ggnochat)
 * - Authentic vector GTA VI divider / transition
 */
function createSplitScreenTemplate(options = {}) {
  const brand = config.brand || require('../../brand.json');
  const {
    hookText = 'LUCIA NA CELA: "CARACA, QUE ISSO?"',
    badgeText = brand.display_name || 'GG NO CHAT',
    channelTag = brand.handle || '@ggnochat',
    tempDir = config.paths.temp,
    assPath = null,
    pipMode = false,
    framePreset = 'vice_pink', // Default to vice_pink to guarantee GG NO CHAT identity
    // Proportional facecam crop matching 817:650 ratio (zero stretch distortion on streamer face)
    facecamCrop = { x: 0.043, y: 0.022, w: 0.147, h: 0.207 },
    // Smart gameplay crop: starts at x=0.07 (avoiding left cut) and y=0.23 (below streamer webcam)
    gameplayCrop = { x: 0.07, y: 0.23, w: 0.50, h: 0.77 },
  } = options;

  fs.mkdirSync(tempDir, { recursive: true });

  const fx = facecamCrop.x, fy = facecamCrop.y, fw = facecamCrop.w, fh = facecamCrop.h;
  const gx = gameplayCrop.x, gy = gameplayCrop.y, gw = gameplayCrop.w, gh = gameplayCrop.h;

  let extraInputs = [];
  let filterComplex = '';

  const isFramed = framePreset && framePreset !== 'no_frame' && brand.frames && brand.frames[framePreset];

  if (isFramed) {
    // Official Framed Composition (e.g. Vice Pink or Subtle Dark)
    // Frame inner window: 817x1313 at (131, 347)
    // Top half: Streamer 817x650
    // Center divider: 817x12
    // Bottom half: Smart Crop Lucia Gameplay 817x663
    const framePath = path.resolve(brand.frames[framePreset]);

    const dividerSvgPath = path.join(tempDir, `divider_bar_${Date.now()}.svg`);
    const divSvg = `<svg width="817" height="16" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="divG" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FF2A85"/>
          <stop offset="50%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#00F0FF"/>
        </linearGradient>
      </defs>
      <rect width="817" height="6" y="5" fill="url(#divG)"/>
    </svg>`;
    fs.writeFileSync(dividerSvgPath, divSvg, 'utf8');

    extraInputs = [framePath, dividerSvgPath];

    filterComplex = `
      [0:v]crop=iw*${fw}:ih*${fh}:iw*${fx}:ih*${fy},scale=817:650:flags=lanczos,unsharp=3:3:0.5:3:3:0.0[cam_fit];
      [0:v]crop=iw*${gw}:ih*${gh}:iw*${gx}:ih*${gy},scale=817:663:flags=lanczos,unsharp=3:3:0.5:3:3:0.0[game_fit];
      color=c=#0A0612:s=1080x1920:r=60[bg];
      [bg][cam_fit]overlay=131:347[bg_cam];
      [bg_cam][game_fit]overlay=131:997[bg_cam_game];
      [bg_cam_game][2:v]overlay=131:991[with_div];
      [with_div][1:v]overlay=0:0[with_frame]
    `.trim();
  } else {
    // Edge-to-edge un-framed split layout
    // 1. Top Header SVG
    const topSvgPath = path.join(tempDir, `top_header_${Date.now()}.svg`);
    const badgePath = getTextPath(badgeText.toUpperCase(), 155, 68, 28, 'bebas', { align: 'center' });
    const hookPath = getTextPath(hookText.toUpperCase(), 640, 71, 34, 'bebas', { align: 'center' });

    const topSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="150" viewBox="0 0 1080 150">
    <defs>
      <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FF2A85" />
        <stop offset="35%" stop-color="#FF7B00" />
        <stop offset="70%" stop-color="#A000FF" />
        <stop offset="100%" stop-color="#00F0FF" />
      </linearGradient>
      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#neonGlow)">
      <rect x="40" y="10" width="1000" height="96" rx="20" fill="#0C0714" fill-opacity="0.95" stroke="url(#neonGrad)" stroke-width="2.5"/>
      <rect x="65" y="24" width="180" height="66" rx="14" fill="#FF2A85" />
      <path d="${badgePath.pathData}" fill="#FFFFFF" />
      <path d="${hookPath.pathData}" fill="#FFFFFF" />
    </g>
  </svg>`;
    fs.writeFileSync(topSvgPath, topSvg, 'utf8');

    // 2. Authentic Vector Divider SVG
    const dividerSvgPath = path.join(tempDir, `divider_${Date.now()}.svg`);
    const gtaPath = getTextPath('grand theft auto', 540, 36, 17, 'pricedown', { align: 'center' });
    const vcPath = getTextPath('VICE CITY', 540, 118, 17, 'bebas', { align: 'center' });

    const dividerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="150" viewBox="0 0 1080 150">
    <defs>
      <linearGradient id="viceSunset" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FF2A85" />
        <stop offset="35%" stop-color="#FF7B00" />
        <stop offset="70%" stop-color="#A000FF" />
        <stop offset="100%" stop-color="#00F0FF" />
      </linearGradient>
      <linearGradient id="metallicBevel" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
        <stop offset="45%" stop-color="#FFFFFF" stop-opacity="0.2" />
        <stop offset="55%" stop-color="#000000" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.85" />
      </linearGradient>
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
    <rect x="0" y="70" width="1080" height="8" fill="url(#viceSunset)" filter="url(#neonGlowHeavy)" />
    <rect x="0" y="72" width="1080" height="4" fill="#FFFFFF" fill-opacity="0.8" />
    <g filter="url(#neonGlowHeavy)">
      <rect x="415" y="14" width="250" height="120" rx="22" fill="#0A0612" stroke="url(#viceSunset)" stroke-width="3"/>
      <path d="${gtaPath.pathData}" fill="#FFFFFF" />
      <g transform="translate(485, 41)">
        <path d="M 0 6 L 17 6 L 17 12 L 11 12 L 29 56 L 47 12 L 41 12 L 41 6 L 58 6 L 58 12 L 52 12 L 34 58 L 24 58 L 6 12 L 0 12 Z" 
              fill="url(#viceSunset)" stroke="#FFFFFF" stroke-width="1.5" />
        <path d="M 0 6 L 17 6 L 17 12 L 11 12 L 29 56 L 47 12 L 41 12 L 41 6 L 58 6 L 58 12 L 52 12 L 34 58 L 24 58 L 6 12 L 0 12 Z" 
              fill="url(#metallicBevel)" />
        <path d="M 72 6 L 100 6 L 100 12 L 92 12 L 92 52 L 100 52 L 100 58 L 72 58 L 72 52 L 80 52 L 80 12 L 72 12 Z" 
              fill="url(#viceSunset)" stroke="#FFFFFF" stroke-width="1.5" />
        <path d="M 72 6 L 100 6 L 100 12 L 92 12 L 92 52 L 100 52 L 100 58 L 72 58 L 72 52 L 80 52 L 80 12 L 72 12 Z" 
              fill="url(#metallicBevel)" />
      </g>
      <path d="${vcPath.pathData}" fill="#00F0FF" />
    </g>
  </svg>`;
    fs.writeFileSync(dividerSvgPath, dividerSvg, 'utf8');

    // 3. Bottom Brand Watermark with @ggnochat
    const bottomSvgPath = path.join(tempDir, `bottom_${Date.now()}.svg`);
    const tagPath = getTextPath(channelTag, 540, 50, 24, 'bebas', { align: 'center' });
    const bottomSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="80" viewBox="0 0 1080 80">
    <rect x="360" y="15" width="360" height="50" rx="15" fill="#0C0714" fill-opacity="0.85" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="1"/>
    <path d="${tagPath.pathData}" fill="#00F0FF" />
  </svg>`;
    fs.writeFileSync(bottomSvgPath, bottomSvg, 'utf8');

    extraInputs = [topSvgPath, dividerSvgPath, bottomSvgPath];

    if (pipMode) {
      filterComplex = `
        [0:v]split=2[game_src][cam_src];
        [game_src]crop=iw*${gw}:ih*${gh}:iw*${gx}:ih*${gy},scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,unsharp=3:3:0.5:3:3:0.0[full_game];
        [cam_src]crop=iw*${fw}:ih*${fh}:iw*${fx}:ih*${fy},scale=360:220:flags=lanczos[cam_pip];
        [full_game][cam_pip]overlay=60:140[with_pip];
        [with_pip][1:v]overlay=x=0:y=45[with_top];
        [with_top][2:v]overlay=x=0:y=1820[with_frame]
      `.trim();
      extraInputs = [topSvgPath, bottomSvgPath];
    } else {
      filterComplex = `
        [0:v]split=3[cam_bg][cam_fg][game_raw];
        [cam_bg]crop=iw*${fw}:ih*${fh}:iw*${fx}:ih*${fy},scale=1080:960:flags=lanczos,boxblur=25:5[top_bg];
        [cam_fg]crop=iw*${fw}:ih*${fh}:iw*${fx}:ih*${fy},scale=960:540:flags=lanczos,unsharp=3:3:0.5:3:3:0.0[top_fg];
        [top_bg][top_fg]overlay=(W-w)/2:(H-h)/2[top_half];
        [game_raw]crop=iw*${gw}:ih*${gh}:iw*${gx}:ih*${gy},scale=1080:960:flags=lanczos,unsharp=3:3:0.5:3:3:0.0[bottom_half];
        [top_half][bottom_half]vstack=inputs=2[stacked];
        [stacked][1:v]overlay=x=0:y=45[with_top];
        [with_top][2:v]overlay=x=0:y=890[with_divider];
        [with_divider][3:v]overlay=x=0:y=1820[with_frame]
      `.trim();
    }
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
  createSplitScreenTemplate
};
