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
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`FFmpeg failed (code ${code}): ${stderr || stdout}`));
    });
  });
}

/**
 * Render a clip into one of the 3 GTA 6 models V2
 * Features:
 * - Broadcast standard loudness normalization (-16.0 LUFS, TP <= -1.0 dBTP)
 * - Intelligent sidechain audio ducking (music softens during speech)
 * - GG NO CHAT branding (@ggnochat)
 * - Safe area subtitle positioning
 * - Smart framing and crop keyframing (no cut Lucia!)
 * - Transparent alpha brand frame support
 */
async function renderClip(params) {
  const brand = config.brand || require('../brand.json');
  const {
    inputVideoPath,
    model = 'split',
    outputPath,
    subtitles = [],
    clipStartSec = 0,
    clipDurationSec = 30,
    hookText = null,
    badgeText = brand.display_name || 'GG NO CHAT',
    channelTag = brand.handle || '@ggnochat',
    newsTitle = null,
    newsSubtitle = null,
    newsCategory = '🚨 DETALHE NOVO REVELADO',
    facecamCrop = { x: 0.043, y: 0.022, w: 0.147, h: 0.207 },
    gameplayCrop = { x: 0.07, y: 0.23, w: 0.50, h: 0.77 },
    pipMode = false,
    framePreset = 'no_frame',
    directMode = 'smart_crop', // 'smart_crop' | 'framed'
    cropAnchor = { x: 0.10, y: 0.0, w: 0.5625, h: 1.0 },
    lofiVolume = config.audio.lofiDefaultVolume, // Default: 0.08
    fontName = 'Bebas Neue',
    fontSize = null,
  } = params;

  fs.mkdirSync(config.paths.temp, { recursive: true });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const timestamp = Date.now();
  let assPath = null;
  const normalizedModel = model.toLowerCase();

  // 1. Build Subtitles with safe-zone margins and bracket filtering
  if (subtitles && subtitles.length > 0) {
    assPath = path.join(config.paths.temp, `subs_${timestamp}.ass`);
    let marginV = 440;
    if (normalizedModel === 'split' || normalizedModel === 'meio-a-meio' || normalizedModel === '1') {
      marginV = 460; // Placed right below the action, safe from TikTok footer
    } else if (normalizedModel === 'web' || normalizedModel === 'pagina' || normalizedModel === '2') {
      marginV = 420; // Lower third
    } else {
      marginV = 440; // Safe vertical center
    }

    buildAssSubtitles(subtitles, clipStartSec, clipDurationSec, assPath, {
      marginV,
      fontName,
      fontSize: fontSize || undefined
    });
  }

  // 2. Select Template with scene-adherent default hooks
  let templateResult;

  if (normalizedModel === 'split' || normalizedModel === 'meio-a-meio' || normalizedModel === '1') {
    templateResult = createSplitScreenTemplate({
      hookText: hookText || 'LUCIA NA CELA: "CARACA, QUE ISSO?"',
      badgeText,
      channelTag,
      tempDir: config.paths.temp,
      assPath,
      facecamCrop,
      gameplayCrop,
      pipMode,
      framePreset
    });
  } else if (normalizedModel === 'web' || normalizedModel === 'pagina' || normalizedModel === '2') {
    templateResult = createWebPageGameTemplate({
      newsTitle: newsTitle || hookText || 'VOCÊ REPAROU NA CELA DA LUCIA?',
      newsSubtitle: newsSubtitle || 'A ILUMINAÇÃO VOLUMÉTRICA PROVA O NOVO MOTOR',
      newsCategory,
      channelTag,
      tempDir: config.paths.temp,
      assPath,
      gameplayCrop,
      framePreset
    });
  } else {
    templateResult = createDirectCutTemplate({
      hookText: hookText || 'LUCIA EXPLORANDO A PRISÃO DE LEONIDA',
      badgeText,
      channelTag,
      tempDir: config.paths.temp,
      assPath,
      mode: directMode,
      cropAnchor,
      framePreset
    });
  }

  const { extraInputs = [], filterComplex: visualFilter } = templateResult;

  // 3. Audio Mixing with Lo-Fi Track & EBU R128 Loudness Normalization
  const hasLofiTrack = fs.existsSync(config.audio.lofiTrack) && lofiVolume > 0;
  
  // Construct inputs list:
  // Input 0: Raw video
  // Input 1 (optional): Lo-Fi audio track
  // Inputs 2+: Extra SVG / PNG layers
  const args = ['-i', inputVideoPath];
  let lofiInputIdx = -1;

  if (hasLofiTrack) {
    args.push('-i', config.audio.lofiTrack);
    lofiInputIdx = 1;
  }

  for (const extraPath of extraInputs) {
    args.push('-i', extraPath);
  }

  // Adjust input indexes inside visualFilter if Lo-Fi input was inserted at position 1
  let adjustedVisualFilter = visualFilter;
  if (hasLofiTrack) {
    for (let i = extraInputs.length; i >= 1; i--) {
      adjustedVisualFilter = adjustedVisualFilter.replace(new RegExp(`\\[${i}:v\\]`, 'g'), `[${i + 1}:v]`);
    }
  }

  // Combine Visual Filter + Broadcast Audio Filter
  let fullFilterComplex = adjustedVisualFilter;
  const fadeOutStart = Math.max(0, clipDurationSec - 1.2);

  let audioFilter = '';
  if (hasLofiTrack) {
    audioFilter = `
      [0:a]volume=1.1[voice];
      [${lofiInputIdx}:a]aloop=loop=-1:size=2e+09,volume=${lofiVolume},afade=t=in:ss=0:d=1.0,afade=t=out:st=${fadeOutStart}:d=1.2[lofi_raw];
      [lofi_raw][voice]sidechaincompress=threshold=0.08:ratio=3:attack=50:release=300[lofi_ducked];
      [voice][lofi_ducked]amix=inputs=2:duration=first:dropout_transition=2[mixed_audio];
      [mixed_audio]loudnorm=I=-16.0:TP=-1.0:LRA=11.0[a_out]
    `.trim();
  } else {
    audioFilter = `
      [0:a]loudnorm=I=-16.0:TP=-1.0:LRA=11.0[a_out]
    `.trim();
  }

  fullFilterComplex += ';' + audioFilter;

  args.push(
    '-filter_complex', fullFilterComplex,
    '-map', '[v_out]',
    '-map', '[a_out]',
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

  console.log(`[Renderer V2] Renderizando Modelo [${normalizedModel.toUpperCase()}] com normalização -16 LUFS, Smart Crop e marca @ggnochat...`);
  const renderResult = await runProcess(config.bin.ffmpeg, args);

  // 4. Cleanup temporary SVG / ASS files (preserve brand processed PNGs)
  for (const p of extraInputs) {
    if (p.includes('temp') && fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch (_) {}
    }
  }
  try { if (assPath && fs.existsSync(assPath)) fs.unlinkSync(assPath); } catch (_) {}

  return outputPath;
}

module.exports = {
  renderClip
};
