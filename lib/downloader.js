const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('./config');

function runProcess(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
    });
  });
}

/**
 * Fetch video metadata
 */
async function getVideoInfo(url) {
  const args = [
    '--dump-single-json',
    '--no-playlist',
    url
  ];
  const output = await runProcess(config.bin.ytdlp, args);
  const data = JSON.parse(output);
  return {
    id: data.id,
    title: data.title,
    channel: data.channel || data.uploader,
    duration: data.duration,
    thumbnail: data.thumbnail,
    viewCount: data.view_count,
    uploadDate: data.upload_date
  };
}

/**
 * Download and parse Portuguese or best available subtitles with word-level timestamps
 */
async function getSubtitles(url, tempDir = config.paths.temp) {
  fs.mkdirSync(tempDir, { recursive: true });
  const subBase = path.join(tempDir, `sub_${Date.now()}`);
  
  const args = [
    '--write-auto-sub',
    '--sub-lang', 'pt,pt-BR,en',
    '--sub-format', 'json3',
    '--skip-download',
    '-o', subBase,
    url
  ];

  try {
    await runProcess(config.bin.ytdlp, args);
  } catch (err) {
    console.warn('Warning: Could not download auto-subtitles:', err.message);
  }

  const files = fs.readdirSync(tempDir);
  const targetFile = files.find(f => f.startsWith(path.basename(subBase)) && f.endsWith('.json3'));
  
  if (!targetFile) {
    return [];
  }

  const subPath = path.join(tempDir, targetFile);
  const rawData = JSON.parse(fs.readFileSync(subPath, 'utf8'));
  
  try { fs.unlinkSync(subPath); } catch (_) {}

  const events = rawData.events || [];
  const segments = [];

  for (const e of events) {
    if (!e.segs || e.segs.length === 0) continue;
    const tStartMs = e.tStartMs || 0;
    const dDurationMs = e.dDurationMs || 0;
    const tEndMs = tStartMs + dDurationMs;

    const words = [];
    let accumulatedText = '';

    for (let i = 0; i < e.segs.length; i++) {
      const seg = e.segs[i];
      const wordText = seg.utf8 ? seg.utf8.trim() : '';
      if (!wordText) continue;

      const offsetMs = seg.tOffsetMs || 0;
      const wordStartMs = tStartMs + offsetMs;
      
      let wordEndMs;
      if (i + 1 < e.segs.length && e.segs[i + 1].tOffsetMs) {
        wordEndMs = tStartMs + e.segs[i + 1].tOffsetMs;
      } else {
        wordEndMs = Math.min(wordStartMs + 350, tEndMs);
      }

      words.push({
        word: wordText,
        startMs: wordStartMs,
        endMs: Math.max(wordEndMs, wordStartMs + 100),
      });
      accumulatedText += (accumulatedText ? ' ' : '') + wordText;
    }

    if (words.length > 0) {
      segments.push({
        startMs: tStartMs,
        endMs: tEndMs,
        text: accumulatedText,
        words
      });
    }
  }

  return segments;
}

/**
 * Fast download of video segment in MAXIMUM Full HD 1080p (or best available)
 */
async function downloadSegment(url, startSec, durationSec, outputPath) {
  const endSec = startSec + durationSec;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Prioritize 1080p60 avc1 + m4a, then general 1080p, then 720p60
  const formatStr = 'bestvideo[height<=1080][vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best';

  const args = [
    '-f', formatStr,
    '--download-sections', `*${startSec}-${endSec}`,
    '--force-keyframes-at-cuts',
    '--extractor-args', 'youtube:player_client=web,android',
    '-o', outputPath,
    '--no-playlist',
    url
  ];

  await runProcess(config.bin.ytdlp, args);
  return outputPath;
}

module.exports = {
  getVideoInfo,
  getSubtitles,
  downloadSegment
};
