const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getTextPath } = require('../svg_text');

/**
 * Builds FFmpeg filter complex string for Model 3: Highlight / Direct Cut V2
 * Features:
 * - Smart Reframe / Crop vertical 9:16 (Zero blur bars! Immersive vertical gameplay)
 * - Optional compact branded letterbox mode when 16:9 presentation is requested
 * - Immediate hook in frame 0.0s (zero delay)
 * - Safe-zone compliant subtitle positioning
 * - Brand: @ggnochat
 */
function createDirectCutTemplate(options = {}) {
  const brand = config.brand || require('../../brand.json');
  const {
    hookText = 'LUCIA EXPLORANDO A PRISÃO DE LEONIDA',
    badgeText = 'GG NO CHAT',
    channelTag = brand.handle || '@ggnochat',
    tempDir = config.paths.temp,
    assPath = null,
    mode = 'smart_crop', // 'smart_crop' | 'framed'
    framePreset = 'no_frame',
    // Smart crop focusing on Lucia and gameplay action:
    cropAnchor = { x: 0.10, y: 0.0, w: 0.5625, h: 1.0 }, // 0.5625 = 9/16 aspect ratio
  } = options;

  fs.mkdirSync(tempDir, { recursive: true });

  // 1. Hook Header SVG - Instant frame 0 display
  const hookSvgPath = path.join(tempDir, `direct_hook_${Date.now()}.svg`);
  const badgePath = getTextPath(badgeText.toUpperCase(), 125, 62, 24, 'bebas', { align: 'center' });
  const hookPath = getTextPath(hookText.toUpperCase(), 590, 64, 30, 'bebas', { align: 'center' });

  const hookSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="150" viewBox="0 0 1080 150">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF2A85" />
      <stop offset="50%" stop-color="#A000FF" />
      <stop offset="100%" stop-color="#00F0FF" />
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <g transform="translate(60, 20)" filter="url(#glow)">
    <rect x="0" y="0" width="960" height="96" rx="20" fill="#0D0818" fill-opacity="0.95" stroke="url(#brandGrad)" stroke-width="2.5"/>
    
    <rect x="22" y="18" width="190" height="60" rx="12" fill="#FF2A85"/>
    <path d="${badgePath.pathData}" fill="#FFFFFF" />
    
    <path d="${hookPath.pathData}" fill="#FFFFFF" />
  </g>
</svg>`;
  fs.writeFileSync(hookSvgPath, hookSvg, 'utf8');

  // 2. Bottom Watermark SVG
  const bottomSvgPath = path.join(tempDir, `direct_bottom_${Date.now()}.svg`);
  const tagPath = getTextPath(channelTag, 540, 50, 24, 'bebas', { align: 'center' });
  const bottomSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="80" viewBox="0 0 1080 80">
  <rect x="360" y="15" width="360" height="50" rx="15" fill="#0C0714" fill-opacity="0.85" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="1"/>
  <path d="${tagPath.pathData}" fill="#00F0FF" />
</svg>`;
  fs.writeFileSync(bottomSvgPath, bottomSvg, 'utf8');

  let extraInputs = [hookSvgPath, bottomSvgPath];
  let filterComplex = '';

  const cx = cropAnchor.x, cy = cropAnchor.y, cw = cropAnchor.w, ch = cropAnchor.h;

  if (mode === 'smart_crop') {
    // 9:16 Full Screen Smart Crop - ZERO BLUR BARS! Full immersive gameplay
    filterComplex = `
      [0:v]crop=iw*${cw}:ih*${ch}:iw*${cx}:ih*${cy},scale=1080:1920:flags=lanczos,unsharp=3:3:0.5:3:3:0.0[smart_game];
      [smart_game][1:v]overlay=x=0:y=45[with_hook];
      [with_hook][2:v]overlay=x=0:y=1820[with_bottom]
    `.trim();
  } else {
    // Branded framed letterbox: intentional treatment, not empty blur
    filterComplex = `
      [0:v]split=2[bg_raw][fg_raw];
      [bg_raw]scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,boxblur=20:6,colorchannelmixer=aa=1:rr=0.3:gg=0.3:bb=0.4[dark_bg];
      [fg_raw]scale=1080:608:flags=lanczos,unsharp=3:3:0.5:3:3:0.0[crisp_fg];
      [dark_bg][crisp_fg]overlay=0:656[comp];
      [comp][1:v]overlay=x=0:y=45[with_hook];
      [with_hook][2:v]overlay=x=0:y=1820[with_bottom]
    `.trim();
  }

  // Handle optional brand frame
  if (framePreset && framePreset !== 'no_frame' && brand.frames && brand.frames[framePreset]) {
    const framePath = path.resolve(brand.frames[framePreset]);
    if (fs.existsSync(framePath)) {
      extraInputs.push(framePath);
      const frameIdx = extraInputs.length;
      filterComplex += `;[with_bottom][${frameIdx}:v]overlay=0:0[with_frame]`;
    } else {
      filterComplex += `;[with_bottom]copy[with_frame]`;
    }
  } else {
    filterComplex += `;[with_bottom]copy[with_frame]`;
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
  createDirectCutTemplate
};
