const fs = require('fs');
const path = require('path');

function formatAssTime(ms) {
  const totalSeconds = Math.max(0, ms) / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = (totalSeconds % 60).toFixed(2);
  const paddedSec = seconds.padStart(5, '0');
  const paddedMin = String(minutes).padStart(2, '0');
  return `${hours}:${paddedMin}:${paddedSec}`;
}

/**
 * Builds an ASS subtitle file with dynamic word highlighting (Karaoke scale pop)
 */
function buildAssSubtitles(segments, clipStartSec, clipDurationSec, outputPath, options = {}) {
  const clipStartMs = clipStartSec * 1000;
  const clipEndMs = (clipStartSec + clipDurationSec) * 1000;

  // Supported fonts: 'Bebas Neue', 'Anton', 'Pricedown', 'Montserrat'
  let fontName = options.fontName || 'Bebas Neue';
  if (fontName.toLowerCase().includes('pricedown')) {
    fontName = 'PricedownBl-Regular';
  }
  let defaultSize = 84;
  if (fontName === 'PricedownBl-Regular') defaultSize = 76;
  else if (fontName.toLowerCase().includes('montserrat')) defaultSize = 60;

  const fontSize = options.fontSize || defaultSize;
  const marginV = options.marginV || 480;
  const baseColor = options.baseColor || '&H00FFFFFF&'; // Crisp White
  const outlineColor = options.outlineColor || '&H00000000&'; // Deep Black
  const outlineWidth = options.outlineWidth || 8;

  // Vice City Palette for active word highlights (BGR format for ASS)
  const highlightPalette = [
    '&H0000FFFF&', // Electric Yellow
    '&H00FFFF00&', // Cyber Cyan
    '&H007F00FF&', // Vice Pink
  ];

  const clipWords = [];
  for (const seg of segments) {
    for (const w of seg.words || []) {
      if (w.endMs >= clipStartMs && w.startMs <= clipEndMs) {
        clipWords.push({
          word: w.word.toUpperCase(),
          startMs: Math.max(0, w.startMs - clipStartMs),
          endMs: Math.min(clipDurationSec * 1000, w.endMs - clipStartMs),
        });
      }
    }
  }

  // 2-3 words per chunk for punchy, fast-reading viral shorts
  const chunkSize = options.chunkSize || 3;
  const chunks = [];
  for (let i = 0; i < clipWords.length; i += chunkSize) {
    const group = clipWords.slice(i, i + chunkSize);
    if (group.length > 0) {
      const chunkStartMs = group[0].startMs;
      const chunkEndMs = group[group.length - 1].endMs;
      chunks.push({ words: group, startMs: chunkStartMs, endMs: chunkEndMs });
    }
  }

  const dialogues = [];
  let colorIdx = 0;

  for (const chunk of chunks) {
    const activeColor = highlightPalette[colorIdx % highlightPalette.length];
    colorIdx++;

    for (let activeIdx = 0; activeIdx < chunk.words.length; activeIdx++) {
      const currentWord = chunk.words[activeIdx];
      const nextWord = chunk.words[activeIdx + 1];
      
      const frameStartMs = currentWord.startMs;
      const frameEndMs = nextWord ? nextWord.startMs : chunk.endMs;
      
      if (frameEndMs <= frameStartMs) continue;

      const lineText = chunk.words.map((w, idx) => {
        if (idx === activeIdx) {
          // Dynamic punchy scale-pop animation
          return `{\\c${activeColor}\\fscx120\\fscy120\\t(0,60,\\fscx128\\fscy128)\\t(60,140,\\fscx112\\fscy112)}${w.word}{\\c${baseColor}\\fscx100\\fscy100}`;
        }
        return `{\\c${baseColor}}${w.word}`;
      }).join(' ');

      dialogues.push(
        `Dialogue: 0,${formatAssTime(frameStartMs)},${formatAssTime(frameEndMs)},Default,,0,0,0,,${lineText}`
      );
    }
  }

  const assContent = `[Script Info]
Title: GTA 6 Cortes Dynamic Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${baseColor},&H000000FF,${outlineColor},&H80000000,-1,0,0,0,100,100,2,0,1,${outlineWidth},3,2,40,40,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${dialogues.join('\n')}
`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, assContent, 'utf8');
  return outputPath;
}

module.exports = {
  buildAssSubtitles,
  formatAssTime
};
