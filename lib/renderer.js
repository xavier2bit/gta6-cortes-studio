const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { buildAssSubtitles } = require('./subtitle_builder');
const { createSplitScreenTemplate } = require('./templates/split_screen');
const { createWebPageGameTemplate } = require('./templates/web_page_game');
const { createDirectCutTemplate } = require('./templates/direct_cut');

function runProcess(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`FFmpeg failed (code ${code}): ${stderr || stdout}`));
    });
  });
}

/**
 * Render a clip into one of the 3 GTA 6 models with Lo-Fi background music and dynamic animations
 */
async function renderClip(params) {
  const {
    inputVideoPath,
    model = 'split',
    outputPath,
    subtitles = [],
    clipStartSec = 0,
    clipDurationSec = 30,
    hookText = 'DAVY JONES REAGIU AO GTA 6!',
    badgeText = 'GTA VI',
    channelTag = '@GTA6CORTES',
    newsTitle = 'ROCKSTAR CONFIRMA: NOVO MOTOR DE FÍSICA NO GTA VI!',
    newsCategory = 'ROCKSTAR NEWSWIRE • OFICIAL',
    facecamCrop = { x: 0.015, y: 0.02, w: 0.215, h: 0.22 },
    zoomCrop = false,
    lofiVolume = config.audio.lofiDefaultVolume, // Subtle background volume (0.08)
    fontName = 'Bebas Neue',
    fontSize = null,
  } = params;

  fs.mkdirSync(config.paths.temp, { recursive: true });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const timestamp = Date.now();
  let assPath = null;

  // 1. Build Subtitles
  if (subtitles && subtitles.length > 0) {
    assPath = path.join(config.paths.temp, `subs_${timestamp}.ass`);
    let marginV = 500;
    if (model === 'split' || model === 'meio-a-meio' || model === '1') {
      marginV = 520; // Positioned right above the divider
    } else if (model === 'web' || model === 'pagina' || model === '2') {
      marginV = 160; // Lower third in gameplay area
    } else {
      marginV = 480; // Golden ratio
    }

    buildAssSubtitles(subtitles, clipStartSec, clipDurationSec, assPath, {
      marginV,
      fontName,
      fontSize: fontSize || undefined
    });
  }

  // 2. Select Template
  let templateResult;
  const normalizedModel = model.toLowerCase();

  if (normalizedModel === 'split' || normalizedModel === 'meio-a-meio' || normalizedModel === '1') {
    templateResult = createSplitScreenTemplate({
      hookText,
      badgeText,
      channelTag,
      tempDir: config.paths.temp,
      assPath,
      facecamCrop
    });
  } else if (normalizedModel === 'web' || normalizedModel === 'pagina' || normalizedModel === '2') {
    templateResult = createWebPageGameTemplate({
      newsTitle,
      newsCategory,
      channelTag,
      tempDir: config.paths.temp,
      assPath
    });
  } else {
    templateResult = createDirectCutTemplate({
      hookText,
      badgeText,
      channelTag,
      tempDir: config.paths.temp,
      assPath,
      zoomCrop
    });
  }

  const { extraInputs = [], filterComplex: visualFilter } = templateResult;

  // 3. Audio Mixing with Lo-Fi Track
  const hasLofiTrack = fs.existsSync(config.audio.lofiTrack) && lofiVolume > 0;
  
  // Construct Inputs list:
  // Input 0: Raw video
  // Input 1 (optional): Lo-Fi audio track
  // Inputs 2+: Extra SVG layers
  const args = ['-i', inputVideoPath];
  let lofiInputIdx = -1;

  if (hasLofiTrack) {
    args.push('-i', config.audio.lofiTrack);
    lofiInputIdx = 1;
  }

  for (const svgPath of extraInputs) {
    args.push('-i', svgPath);
  }

  // Adjust input indexes inside visualFilter if Lo-Fi input was inserted at position 1
  let adjustedVisualFilter = visualFilter;
  if (hasLofiTrack) {
    // If Lo-Fi is at index 1, SVG inputs shift from [1:v], [2:v], [3:v] -> [2:v], [3:v], [4:v]
    for (let i = extraInputs.length; i >= 1; i--) {
      adjustedVisualFilter = adjustedVisualFilter.replace(new RegExp(`\\[${i}:v\\]`, 'g'), `[${i + 1}:v]`);
    }
  }

  // Combine Visual + Audio Filters
  let fullFilterComplex = adjustedVisualFilter;
  let audioMap = '0:a?';

  if (hasLofiTrack) {
    const fadeOutStart = Math.max(0, clipDurationSec - 1.2);
    const audioFilter = `
      [0:a]volume=1.0[voice];
      [${lofiInputIdx}:a]aloop=loop=-1:size=2e+09,volume=${lofiVolume},afade=t=in:ss=0:d=1.2,afade=t=out:st=${fadeOutStart}:d=1.2[lofi_bg];
      [voice][lofi_bg]amix=inputs=2:duration=first:dropout_transition=2[a_out]
    `.trim();
    fullFilterComplex += ';' + audioFilter;
    audioMap = '[a_out]';
  }

  args.push(
    '-filter_complex', fullFilterComplex,
    '-map', '[v_out]',
    '-map', audioMap,
    '-c:v', 'libx264',
    '-preset', config.video.preset,
    '-crf', String(config.video.crf),
    '-c:a', 'aac',
    '-b:a', '192k',
    '-pix_fmt', 'yuv420p',
    '-t', String(clipDurationSec),
    '-y',
    outputPath
  );

  console.log(`[Renderer] Renderizando Modelo: ${normalizedModel} com Lo-Fi (${(lofiVolume * 100).toFixed(0)}% volume) e 1080p Ultra HD...`);
  await runProcess(config.bin.ffmpeg, args);

  // 4. Cleanup temporary SVG / ASS files
  for (const p of extraInputs) {
    try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (_) {}
  }
  try { if (assPath && fs.existsSync(assPath)) fs.unlinkSync(assPath); } catch (_) {}

  return outputPath;
}

module.exports = {
  renderClip
};
