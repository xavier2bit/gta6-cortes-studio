const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getTextPath } = require('../svg_text');

/**
 * Builds FFmpeg filter complex string with dynamic motion for Model 3 (Só Cortes / Viral Shorts)
 */
function createDirectCutTemplate(options) {
  const {
    hookText = 'O MOMENTO MAIS ÉPICO DO GTA 6!',
    badgeText = 'CORTE DO DIA',
    channelTag = '@GTA6CORTES',
    tempDir = config.paths.temp,
    assPath = null,
    zoomCrop = false
  } = options;

  fs.mkdirSync(tempDir, { recursive: true });

  const hookSvgPath = path.join(tempDir, `direct_hook_${Date.now()}.svg`);
  
  // Vector typography for badge and hook
  const badgePath = getTextPath(badgeText.toUpperCase(), 125, 62, 24, badgeText.toUpperCase().includes('GTA') ? 'pricedown' : 'bebas', { align: 'center' });
  const hookPath = getTextPath(hookText.toUpperCase(), 590, 64, 32, 'bebas', { align: 'center' });

  const hookSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="150" viewBox="0 0 1080 150">
  <defs>
    <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF007F" />
      <stop offset="50%" stop-color="#A000FF" />
      <stop offset="100%" stop-color="#00F0FF" />
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <g transform="translate(60, 20)" filter="url(#glow)">
    <rect x="0" y="0" width="960" height="110" rx="24" fill="#0D0818" fill-opacity="0.95" stroke="url(#neonGrad)" stroke-width="3"/>
    
    <rect x="25" y="25" width="200" height="60" rx="14" fill="#FF0055"/>
    <path d="${badgePath.pathData}" fill="#FFFFFF" />
    
    <path d="${hookPath.pathData}" fill="#FFFFFF" />
  </g>
</svg>`;
  fs.writeFileSync(hookSvgPath, hookSvg, 'utf8');

  const bottomSvgPath = path.join(tempDir, `direct_bottom_${Date.now()}.svg`);
  const tagPath = getTextPath(channelTag, 540, 50, 24, 'bebas', { align: 'center' });
  const bottomSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="80" viewBox="0 0 1080 80">
  <rect x="360" y="15" width="360" height="52" rx="16" fill="#0C0714" fill-opacity="0.85" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="1"/>
  <path d="${tagPath.pathData}" fill="#00F0FF" />
</svg>`;
  fs.writeFileSync(bottomSvgPath, bottomSvg, 'utf8');

  let filterComplex = '';

  if (zoomCrop) {
    filterComplex = `
      [0:v]scale=-1:1920:flags=lanczos,crop=1080:1920:(iw-1080)/2:0,unsharp=3:3:0.5:3:3:0.0[cropped];
      [cropped][1:v]overlay=x=0:y='if(lte(t,0.4),-140+185*(1-pow(1-t/0.4,3)),45)':eval=frame[with_hook];
      [with_hook][2:v]overlay=x=0:y=1820[with_bottom]
    `.trim();
  } else {
    filterComplex = `
      [0:v]split=2[bg_raw][fg_raw];
      [bg_raw]scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,boxblur=30:10,colorchannelmixer=aa=1:rr=0.4:gg=0.4:bb=0.5[blurred_bg];
      [fg_raw]scale=1080:-1:flags=lanczos,unsharp=3:3:0.5:3:3:0.0[crisp_fg];
      [blurred_bg][crisp_fg]overlay=(W-w)/2:(H-h)/2[centered];
      [centered][1:v]overlay=x=0:y='if(lte(t,0.4),-140+185*(1-pow(1-t/0.4,3)),45)':eval=frame[with_hook];
      [with_hook][2:v]overlay=x=0:y=1820[with_bottom]
    `.trim();
  }

  if (assPath) {
    const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const fontsDir = config.paths.fonts.replace(/\\/g, '/').replace(/:/g, '\\:');
    filterComplex += `;[with_bottom]subtitles='${escapedAss}':fontsdir='${fontsDir}'[v_out]`;
  } else {
    filterComplex += `;[with_bottom]copy[v_out]`;
  }

  return {
    extraInputs: [hookSvgPath, bottomSvgPath],
    filterComplex
  };
}

module.exports = {
  createDirectCutTemplate
};
